const JSON_HEADERS = Object.freeze({
    "Content-Type": "application/json; charset=utf-8",
    "Cache-Control": "no-store",
    "X-Content-Type-Options": "nosniff",
    "Referrer-Policy": "no-referrer",
    "Permissions-Policy": "camera=(), microphone=(), geolocation=()",
    "X-Frame-Options": "DENY"
});

const MAX_BODY_BYTES = 16_384;
const RATE_LIMIT_MAX = 5;
const RATE_LIMIT_WINDOW_MS = 10 * 60 * 1000;

function json(data, status = 200, extraHeaders = {}) {
    return new Response(JSON.stringify(data), {
        status,
        headers: { ...JSON_HEADERS, ...extraHeaders }
    });
}

export function normalizeOrigin(origin) {
    return String(origin || "").trim().replace(/\/$/, "");
}

export function allowedOrigins(env) {
    return new Set(String(env.ALLOWED_ORIGINS || "")
        .split(",")
        .map(normalizeOrigin)
        .filter(Boolean));
}

function corsHeaders(request, env) {
    const origin = normalizeOrigin(request.headers.get("Origin"));
    if (!origin || !allowedOrigins(env).has(origin)) return null;

    return {
        "Access-Control-Allow-Origin": origin,
        "Access-Control-Allow-Methods": "GET, POST, OPTIONS",
        "Access-Control-Allow-Headers": "Content-Type",
        "Access-Control-Max-Age": "86400",
        "Vary": "Origin"
    };
}

function cleanText(value) {
    return String(value || "")
        .replace(/[\u0000-\u0008\u000B\u000C\u000E-\u001F\u007F]/g, "")
        .replace(/\s+/g, " ")
        .trim();
}

export function validateRsvp(input) {
    const data = {
        eventId: cleanText(input?.eventId),
        submissionId: cleanText(input?.submissionId),
        name: cleanText(input?.name),
        attendance: cleanText(input?.attendance).toLowerCase(),
        guestCount: Number(input?.guestCount),
        message: cleanText(input?.message),
        website: cleanText(input?.website),
        turnstileToken: cleanText(input?.turnstileToken)
    };

    if (!/^[a-z0-9][a-z0-9_-]{2,63}$/i.test(data.eventId)) return { error: "ID acara tidak valid." };
    if (!/^[a-z0-9-]{16,80}$/i.test(data.submissionId)) return { error: "ID pengiriman tidak valid." };
    if (data.name.length < 2 || data.name.length > 80) return { error: "Nama harus terdiri dari 2–80 karakter." };
    if (!new Set(["hadir", "tidak_hadir", "ragu"]).has(data.attendance)) return { error: "Status kehadiran tidak valid." };
    if (!Number.isInteger(data.guestCount) || data.guestCount < 0 || data.guestCount > 10) return { error: "Jumlah tamu harus antara 0–10." };
    if (data.attendance === "hadir" && data.guestCount < 1) return { error: "Jumlah tamu minimal 1 untuk status hadir." };
    if (data.attendance !== "hadir") data.guestCount = 0;
    if (data.message.length > 500) return { error: "Ucapan maksimal 500 karakter." };
    if (!data.turnstileToken) return { error: "Verifikasi keamanan belum lengkap." };

    return { data };
}

async function sha256(value) {
    const bytes = new TextEncoder().encode(value);
    const digest = await crypto.subtle.digest("SHA-256", bytes);
    return [...new Uint8Array(digest)].map((byte) => byte.toString(16).padStart(2, "0")).join("");
}

async function checkRateLimit(request, env) {
    if (!env.RATE_LIMIT_SALT) throw new Error("RATE_LIMIT_SALT belum dikonfigurasi.");

    const ip = request.headers.get("CF-Connecting-IP") || "unknown";
    const now = Date.now();
    const bucket = Math.floor(now / RATE_LIMIT_WINDOW_MS);
    const rateKey = await sha256(`${env.RATE_LIMIT_SALT}:${ip}:${bucket}`);
    const expiresAt = (bucket + 1) * RATE_LIMIT_WINDOW_MS;

    const result = await env.DB.prepare(`
        INSERT INTO rsvp_rate_limits (rate_key, request_count, expires_at)
        VALUES (?, 1, ?)
        ON CONFLICT(rate_key) DO UPDATE SET request_count = request_count + 1
        RETURNING request_count
    `).bind(rateKey, expiresAt).first();

    if (Math.random() < 0.02) {
        await env.DB.prepare("DELETE FROM rsvp_rate_limits WHERE expires_at < ?").bind(now).run().catch(() => {});
    }

    return Number(result?.request_count || 1) <= RATE_LIMIT_MAX;
}

async function verifyTurnstile(token, request, env) {
    if (!env.TURNSTILE_SECRET_KEY) throw new Error("TURNSTILE_SECRET_KEY belum dikonfigurasi.");

    const formData = new FormData();
    formData.append("secret", env.TURNSTILE_SECRET_KEY);
    formData.append("response", token);
    const ip = request.headers.get("CF-Connecting-IP");
    if (ip) formData.append("remoteip", ip);

    const response = await fetch("https://challenges.cloudflare.com/turnstile/v0/siteverify", {
        method: "POST",
        body: formData
    });
    if (!response.ok) return false;

    const result = await response.json();
    const validHostnames = new Set([...allowedOrigins(env)].map((origin) => {
        try {
            return new URL(origin).hostname;
        } catch {
            return "";
        }
    }).filter(Boolean));
    const hostnameAllowed = !result.hostname || validHostnames.has(result.hostname);

    return result.success === true
        && (!result.action || result.action === "rsvp")
        && hostnameAllowed;
}

async function createRsvp(request, env, cors) {
    if (!request.headers.get("Content-Type")?.toLowerCase().startsWith("application/json")) {
        return json({ message: "Content-Type harus application/json." }, 415, cors);
    }

    const contentLength = Number(request.headers.get("Content-Length") || 0);
    if (contentLength > MAX_BODY_BYTES) return json({ message: "Data terlalu besar." }, 413, cors);

    const rawBody = await request.text();
    if (new TextEncoder().encode(rawBody).byteLength > MAX_BODY_BYTES) {
        return json({ message: "Data terlalu besar." }, 413, cors);
    }

    let input;
    try {
        input = JSON.parse(rawBody);
    } catch {
        return json({ message: "Format data tidak valid." }, 400, cors);
    }

    // Honeypot: balas generik agar bot tidak mengetahui penyebab penolakan.
    if (cleanText(input?.website)) return json({ ok: true }, 200, cors);

    const validation = validateRsvp(input);
    if (validation.error) return json({ message: validation.error }, 400, cors);

    let withinLimit;
    try {
        withinLimit = await checkRateLimit(request, env);
    } catch (error) {
        console.error(error);
        return json({ message: "Konfigurasi keamanan server belum lengkap." }, 503, cors);
    }
    if (!withinLimit) return json({ message: "Terlalu banyak percobaan. Silakan tunggu beberapa menit." }, 429, cors);

    let verified;
    try {
        verified = await verifyTurnstile(validation.data.turnstileToken, request, env);
    } catch (error) {
        console.error(error);
        return json({ message: "Layanan verifikasi sedang bermasalah." }, 503, cors);
    }
    if (!verified) return json({ message: "Verifikasi keamanan gagal. Silakan coba lagi." }, 403, cors);

    const { eventId, submissionId, name, attendance, guestCount, message } = validation.data;
    try {
        await env.DB.prepare(`
            INSERT INTO rsvps (event_id, submission_id, guest_name, attendance, guest_count, message)
            VALUES (?, ?, ?, ?, ?, ?)
        `).bind(eventId, submissionId, name, attendance, guestCount, message).run();
    } catch (error) {
        if (String(error?.message || error).includes("UNIQUE")) {
            return json({ ok: true, duplicate: true }, 200, cors);
        }
        console.error(error);
        return json({ message: "Konfirmasi belum dapat disimpan." }, 500, cors);
    }

    return json({ ok: true }, 201, cors);
}

async function canReadRsvps(request, env) {
    const configuredToken = String(env.RSVP_READ_TOKEN || "");
    if (configuredToken.length < 24) return { configurationError: true };

    const authorization = request.headers.get("Authorization") || "";
    const suppliedToken = authorization.startsWith("Bearer ") ? authorization.slice(7).trim() : "";
    if (!suppliedToken) return { allowed: false };

    const [configuredHash, suppliedHash] = await Promise.all([
        sha256(configuredToken),
        sha256(suppliedToken)
    ]);
    return { allowed: configuredHash === suppliedHash };
}

async function listRsvps(request, url, env, cors) {
    const access = await canReadRsvps(request, env);
    if (access.configurationError) {
        return json({ message: "Akses daftar RSVP belum dikonfigurasi." }, 503, cors);
    }
    if (!access.allowed) {
        return json({ message: "Akses ditolak." }, 401, { ...cors, "WWW-Authenticate": "Bearer" });
    }

    const eventId = cleanText(url.searchParams.get("eventId"));
    if (!/^[a-z0-9][a-z0-9_-]{2,63}$/i.test(eventId)) return json({ message: "ID acara tidak valid." }, 400, cors);

    const rows = await env.DB.prepare(`
        SELECT guest_name AS name, attendance, guest_count AS guestCount, message, created_at AS createdAt
        FROM rsvps
        WHERE event_id = ?
        ORDER BY created_at DESC
        LIMIT 50
    `).bind(eventId).all();

    const summary = await env.DB.prepare(`
        SELECT
            COUNT(*) AS responses,
            SUM(CASE WHEN attendance = 'hadir' THEN 1 ELSE 0 END) AS hadir,
            SUM(CASE WHEN attendance = 'tidak_hadir' THEN 1 ELSE 0 END) AS tidakHadir,
            SUM(CASE WHEN attendance = 'ragu' THEN 1 ELSE 0 END) AS ragu,
            SUM(CASE WHEN attendance = 'hadir' THEN guest_count ELSE 0 END) AS totalTamu
        FROM rsvps
        WHERE event_id = ?
    `).bind(eventId).first();

    const normalizedSummary = {
        responses: Number(summary?.responses || 0),
        hadir: Number(summary?.hadir || 0),
        tidakHadir: Number(summary?.tidakHadir || 0),
        ragu: Number(summary?.ragu || 0),
        totalTamu: Number(summary?.totalTamu || 0)
    };

    return json({ entries: rows.results || [], summary: normalizedSummary }, 200, cors);
}

export default {
    async fetch(request, env) {
        const url = new URL(request.url);
        const cors = corsHeaders(request, env);

        if (request.method === "OPTIONS") {
            return cors ? new Response(null, { status: 204, headers: cors }) : json({ message: "Origin tidak diizinkan." }, 403);
        }

        if (url.pathname === "/health" && request.method === "GET") {
            return json({ ok: true, service: "Invitalab RSVP" });
        }

        if (url.pathname === "/api/rsvp" && request.method === "GET") {
            const hasOrigin = Boolean(request.headers.get("Origin"));
            if (hasOrigin && !cors) return json({ message: "Origin tidak diizinkan." }, 403);
            return listRsvps(request, url, env, cors || {});
        }

        if (!cors) return json({ message: "Origin tidak diizinkan." }, 403);
        if (url.pathname === "/api/rsvp" && request.method === "POST") return createRsvp(request, env, cors);

        return json({ message: "Endpoint tidak ditemukan." }, 404, cors);
    }
};
