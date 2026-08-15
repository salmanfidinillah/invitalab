(function () {
    "use strict";

    const config = window.INVITALAB_RSVP_CONFIG || {};
    const apiUrl = String(config.apiUrl || "").replace(/\/$/, "");
    const siteKey = String(config.turnstileSiteKey || "");
    const REQUEST_TIMEOUT_MS = 15_000;

    function hasValidApiUrl(value) {
        try {
            const url = new URL(value);
            return url.protocol === "https:"
                && !url.username
                && !url.password
                && !url.search
                && !url.hash;
        } catch {
            return false;
        }
    }

    const configured = hasValidApiUrl(apiUrl)
        && !apiUrl.includes("YOUR-WORKER")
        && /^[a-zA-Z0-9_-]{10,}$/.test(siteKey)
        && !siteKey.includes("YOUR_TURNSTILE");

    let turnstileScriptPromise;

    function injectStyles() {
        if (document.getElementById("invitalab-rsvp-styles")) return;

        const style = document.createElement("style");
        style.id = "invitalab-rsvp-styles";
        style.textContent = `
            .invitalab-rsvp-status { margin-top: .75rem; padding: .7rem .85rem; border-radius: .65rem; font-size: .85rem; line-height: 1.4; }
            .invitalab-rsvp-status[hidden] { display: none !important; }
            .invitalab-rsvp-status.is-info { background: #eef4ff; color: #234a7d; border: 1px solid #cdddf5; }
            .invitalab-rsvp-status.is-success { background: #edf8f0; color: #23613a; border: 1px solid #c9e8d1; }
            .invitalab-rsvp-status.is-error { background: #fff0f0; color: #8a2525; border: 1px solid #f0caca; }
            .invitalab-rsvp-honeypot { position: absolute !important; width: 1px !important; height: 1px !important; overflow: hidden !important; clip: rect(0, 0, 0, 0) !important; white-space: nowrap !important; }
            .invitalab-sr-only { position: absolute !important; width: 1px !important; height: 1px !important; padding: 0 !important; margin: -1px !important; overflow: hidden !important; clip: rect(0, 0, 0, 0) !important; white-space: nowrap !important; border: 0 !important; }
            [data-invitalab-rsvp] button:disabled { cursor: not-allowed; opacity: .65; }
            .invitalab-turnstile { margin-top: .75rem; min-height: 65px; }
        `;
        document.head.appendChild(style);
    }

    function setStatus(node, message, type) {
        node.textContent = message;
        node.className = `invitalab-rsvp-status is-${type}`;
        node.hidden = false;
        node.setAttribute("role", type === "error" ? "alert" : "status");
    }

    function loadTurnstile() {
        if (window.turnstile) return Promise.resolve();
        if (turnstileScriptPromise) return turnstileScriptPromise;

        turnstileScriptPromise = new Promise((resolve, reject) => {
            const script = document.createElement("script");
            script.src = "https://challenges.cloudflare.com/turnstile/v0/api.js?render=explicit";
            script.async = true;
            script.defer = true;
            script.onload = resolve;
            script.onerror = () => reject(new Error("Turnstile gagal dimuat."));
            document.head.appendChild(script);
        });

        return turnstileScriptPromise;
    }

    function normalizedAttendance(value) {
        const normalized = String(value || "").trim().toLowerCase().replace(/[\s-]+/g, "_");
        const mapping = {
            hadir: "hadir",
            ya: "hadir",
            tidak: "tidak_hadir",
            tidak_hadir: "tidak_hadir",
            ragu: "ragu",
            masih_ragu: "ragu"
        };
        return mapping[normalized] || "";
    }

    function selectedAttendance(form) {
        const field = form.elements.attendance;
        if (!field) return "";
        if (field instanceof RadioNodeList) return normalizedAttendance(field.value);
        return normalizedAttendance(field.value);
    }

    function createSubmissionId() {
        if (window.crypto && typeof window.crypto.randomUUID === "function") {
            return window.crypto.randomUUID();
        }
        return `rsvp-${Date.now()}-${Math.random().toString(16).slice(2)}`;
    }

    function ensureLabel(form, field, labelText, idSuffix) {
        if (!field || field instanceof RadioNodeList || field.closest("label")) return;

        if (!field.id) {
            const eventPart = String(form.dataset.eventId || "event").replace(/[^a-z0-9_-]/gi, "-");
            field.id = `invitalab-${eventPart}-${idSuffix}`;
        }

        const alreadyLabelled = [...form.querySelectorAll("label[for]")]
            .some((label) => label.htmlFor === field.id);
        if (alreadyLabelled) return;

        const label = document.createElement("label");
        label.className = "invitalab-sr-only";
        label.htmlFor = field.id;
        label.textContent = labelText;
        field.insertAdjacentElement("beforebegin", label);
    }

    function setupForm(form) {
        if (form.dataset.rsvpReady === "true") return;
        form.dataset.rsvpReady = "true";

        const eventId = form.dataset.eventId || "";
        const submitButton = form.querySelector('button[type="submit"], input[type="submit"]');
        const nameField = form.elements.name;
        const messageField = form.elements.message;
        const guestCountField = form.elements.guestCount;
        const attendanceField = form.elements.attendance;

        ensureLabel(form, nameField, "Nama tamu", "name");
        ensureLabel(form, messageField, "Ucapan dan doa", "message");
        ensureLabel(form, guestCountField, "Jumlah tamu", "guest-count");
        ensureLabel(form, attendanceField, "Konfirmasi kehadiran", "attendance");

        if (nameField) {
            nameField.required = true;
            nameField.minLength = 2;
            nameField.maxLength = 80;
            if (!nameField.getAttribute("autocomplete")) nameField.setAttribute("autocomplete", "name");
            if (!nameField.getAttribute("aria-label")) nameField.setAttribute("aria-label", "Nama tamu");
        }
        if (messageField) {
            messageField.maxLength = 500;
            if (!messageField.getAttribute("aria-label")) messageField.setAttribute("aria-label", "Ucapan dan doa");
        }
        if (guestCountField) {
            guestCountField.setAttribute("min", "1");
            guestCountField.setAttribute("max", "10");
            if (!guestCountField.getAttribute("aria-label")) guestCountField.setAttribute("aria-label", "Jumlah tamu");
        }
        if (attendanceField && !(attendanceField instanceof RadioNodeList)) {
            attendanceField.required = true;
            if (!attendanceField.getAttribute("aria-label")) attendanceField.setAttribute("aria-label", "Konfirmasi kehadiran");
        }

        const statusNode = document.createElement("div");
        statusNode.className = "invitalab-rsvp-status";
        statusNode.hidden = true;
        form.appendChild(statusNode);

        const honeypot = document.createElement("div");
        honeypot.className = "invitalab-rsvp-honeypot";
        honeypot.setAttribute("aria-hidden", "true");
        honeypot.innerHTML = '<label>Website<input type="text" name="website" tabindex="-1" autocomplete="off"></label>';
        form.appendChild(honeypot);

        const turnstileNode = document.createElement("div");
        turnstileNode.className = "invitalab-turnstile";
        form.insertBefore(turnstileNode, statusNode);

        let widgetId = null;
        let turnstileToken = "";
        let submissionId = createSubmissionId();

        if (!configured) {
            if (submitButton) submitButton.disabled = true;
            setStatus(statusNode, "RSVP belum diaktifkan oleh pemilik undangan.", "info");
            return;
        }

        loadTurnstile()
            .then(() => {
                widgetId = window.turnstile.render(turnstileNode, {
                    sitekey: siteKey,
                    action: "rsvp",
                    theme: "auto",
                    callback(token) {
                        turnstileToken = token;
                    },
                    "expired-callback"() {
                        turnstileToken = "";
                    },
                    "error-callback"() {
                        turnstileToken = "";
                        setStatus(statusNode, "Verifikasi keamanan gagal dimuat. Silakan muat ulang halaman.", "error");
                    }
                });
            })
            .catch(() => setStatus(statusNode, "Verifikasi keamanan gagal dimuat. Periksa koneksi internet Anda.", "error"));

        form.addEventListener("submit", async (event) => {
            event.preventDefault();
            if (!form.reportValidity()) return;

            const name = String(form.elements.name?.value || "").trim();
            const attendance = selectedAttendance(form);
            const guestCount = Number.parseInt(form.elements.guestCount?.value || (attendance === "hadir" ? "1" : "0"), 10);
            const message = String(form.elements.message?.value || "").trim();
            const website = String(form.elements.website?.value || "").trim();

            if (!eventId || !attendance) {
                setStatus(statusNode, "Lengkapi konfirmasi kehadiran terlebih dahulu.", "error");
                return;
            }
            if (!turnstileToken) {
                setStatus(statusNode, "Selesaikan verifikasi keamanan terlebih dahulu.", "error");
                return;
            }

            if (submitButton) submitButton.disabled = true;
            setStatus(statusNode, "Sedang mengirim konfirmasi…", "info");

            const controller = new AbortController();
            const timeoutId = window.setTimeout(() => controller.abort(), REQUEST_TIMEOUT_MS);

            try {
                const response = await fetch(`${apiUrl}/api/rsvp`, {
                    method: "POST",
                    headers: { "Content-Type": "application/json" },
                    signal: controller.signal,
                    body: JSON.stringify({
                        eventId,
                        submissionId,
                        name,
                        attendance,
                        guestCount: Number.isFinite(guestCount) ? guestCount : 0,
                        message,
                        website,
                        turnstileToken
                    })
                });

                const payload = await response.json().catch(() => ({}));
                if (!response.ok) throw new Error(payload.message || "Konfirmasi belum dapat disimpan.");

                setStatus(statusNode, "Terima kasih. Konfirmasi kehadiran Anda sudah tersimpan.", "success");
                form.reset();
                submissionId = createSubmissionId();
                turnstileToken = "";
                if (widgetId !== null && window.turnstile) window.turnstile.reset(widgetId);
            } catch (error) {
                const message = error?.name === "AbortError"
                    ? "Koneksi terlalu lama. Silakan periksa internet dan coba lagi."
                    : error.message || "Terjadi gangguan. Silakan coba lagi.";
                setStatus(statusNode, message, "error");
                if (widgetId !== null && window.turnstile) window.turnstile.reset(widgetId);
                turnstileToken = "";
            } finally {
                window.clearTimeout(timeoutId);
                if (submitButton) submitButton.disabled = false;
            }
        });
    }

    function init() {
        injectStyles();
        document.querySelectorAll("form[data-invitalab-rsvp]").forEach(setupForm);
    }

    if (document.readyState === "loading") {
        document.addEventListener("DOMContentLoaded", init, { once: true });
    } else {
        init();
    }
})();
