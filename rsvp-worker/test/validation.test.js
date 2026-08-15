import test from "node:test";
import assert from "node:assert/strict";
import worker, { allowedOrigins, normalizeOrigin, validateRsvp } from "../src/index.js";

const validPayload = {
    eventId: "demo-syari-1",
    submissionId: "d39b540e-4a90-4fe0-bd68-eda983180a16",
    name: "Salman",
    attendance: "hadir",
    guestCount: 2,
    message: "Semoga lancar",
    website: "",
    turnstileToken: "token-test"
};

test("normalizes configured origins", () => {
    assert.equal(normalizeOrigin("https://contoh.com/"), "https://contoh.com");
    assert.deepEqual([...allowedOrigins({ ALLOWED_ORIGINS: "https://a.com/, https://b.com" })], ["https://a.com", "https://b.com"]);
});

test("accepts a valid RSVP", () => {
    const result = validateRsvp(validPayload);
    assert.equal(result.error, undefined);
    assert.equal(result.data.guestCount, 2);
});

test("forces guest count to zero when not attending", () => {
    const result = validateRsvp({ ...validPayload, attendance: "tidak_hadir", guestCount: 8 });
    assert.equal(result.data.guestCount, 0);
});

test("rejects invalid event IDs and oversized messages", () => {
    assert.match(validateRsvp({ ...validPayload, eventId: "x" }).error, /ID acara/);
    assert.match(validateRsvp({ ...validPayload, message: "a".repeat(501) }).error, /maksimal/);
});

test("rejects requests from an origin outside the allowlist", async () => {
    const request = new Request("https://worker.example/api/rsvp", {
        method: "POST",
        headers: { Origin: "https://evil.example", "Content-Type": "application/json" },
        body: JSON.stringify(validPayload)
    });

    const response = await worker.fetch(request, { ALLOWED_ORIGINS: "https://invitalab.example" });
    assert.equal(response.status, 403);
});

test("protects the RSVP guest list with an admin token", async () => {
    const fakeDb = {
        prepare(sql) {
            return {
                bind() { return this; },
                async all() { return { results: [] }; },
                async first() {
                    return sql.includes("COUNT(*)")
                        ? { responses: 0, hadir: 0, tidakHadir: 0, ragu: 0, totalTamu: 0 }
                        : null;
                }
            };
        }
    };
    const env = {
        ALLOWED_ORIGINS: "https://invitalab.example",
        RSVP_READ_TOKEN: "test-read-token-at-least-24-characters",
        DB: fakeDb
    };

    const publicResponse = await worker.fetch(
        new Request("https://worker.example/api/rsvp?eventId=demo-syari-1"),
        env
    );
    assert.equal(publicResponse.status, 401);

    const adminResponse = await worker.fetch(
        new Request("https://worker.example/api/rsvp?eventId=demo-syari-1", {
            headers: { Authorization: `Bearer ${env.RSVP_READ_TOKEN}` }
        }),
        env
    );
    assert.equal(adminResponse.status, 200);
    assert.deepEqual(await adminResponse.json(), {
        entries: [],
        summary: { responses: 0, hadir: 0, tidakHadir: 0, ragu: 0, totalTamu: 0 }
    });
});

test("stores a verified RSVP through the Worker endpoint", async (t) => {
    const statements = [];
    const fakeDb = {
        prepare(sql) {
            const statement = {
                sql,
                values: [],
                bind(...values) {
                    this.values = values;
                    return this;
                },
                async first() {
                    return { request_count: 1 };
                },
                async run() {
                    statements.push({ sql: this.sql, values: this.values });
                    return { success: true };
                }
            };
            return statement;
        }
    };

    const originalFetch = globalThis.fetch;
    globalThis.fetch = async () => new Response(JSON.stringify({ success: true, action: "rsvp" }), {
        status: 200,
        headers: { "Content-Type": "application/json" }
    });
    t.after(() => {
        globalThis.fetch = originalFetch;
    });

    const request = new Request("https://worker.example/api/rsvp", {
        method: "POST",
        headers: {
            Origin: "https://invitalab.example",
            "Content-Type": "application/json",
            "CF-Connecting-IP": "203.0.113.10"
        },
        body: JSON.stringify(validPayload)
    });
    const env = {
        ALLOWED_ORIGINS: "https://invitalab.example",
        RATE_LIMIT_SALT: "test-salt-that-is-not-used-in-production",
        TURNSTILE_SECRET_KEY: "test-secret",
        DB: fakeDb
    };

    const response = await worker.fetch(request, env);
    assert.equal(response.status, 201);
    assert.equal(response.headers.get("Access-Control-Allow-Origin"), "https://invitalab.example");
    assert.equal(statements.length, 1);
    assert.match(statements[0].sql, /INSERT INTO rsvps/);
    assert.deepEqual(statements[0].values.slice(0, 5), [
        "demo-syari-1",
        validPayload.submissionId,
        "Salman",
        "hadir",
        2
    ]);
});
