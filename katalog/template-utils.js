(function () {
    "use strict";

    function cleanGuestName(value) {
        return String(value || "")
            .replace(/[\u0000-\u001F\u007F]/g, "")
            .replace(/\s+/g, " ")
            .trim()
            .slice(0, 80);
    }

    function getGuestName() {
        const params = new URLSearchParams(window.location.search);
        return cleanGuestName(params.get("to") || params.get("kepada"));
    }

    function applyGuestName(elementId, fallback) {
        const element = document.getElementById(elementId);
        if (!element) return "";

        const guestName = getGuestName();
        element.textContent = guestName || fallback || element.textContent;
        return guestName;
    }

    async function copyText(value) {
        const text = String(value || "").trim();
        if (!text) throw new Error("Tidak ada teks yang dapat disalin.");

        if (navigator.clipboard && window.isSecureContext) {
            await navigator.clipboard.writeText(text);
            return;
        }

        const textArea = document.createElement("textarea");
        textArea.value = text;
        textArea.setAttribute("readonly", "");
        textArea.style.position = "fixed";
        textArea.style.opacity = "0";
        document.body.appendChild(textArea);
        textArea.select();

        const copied = document.execCommand("copy");
        document.body.removeChild(textArea);
        if (!copied) throw new Error("Browser tidak mengizinkan penyalinan otomatis.");
    }

    function injectAccessibilityStyles() {
        if (document.getElementById("invitalab-accessibility-styles")) return;

        const style = document.createElement("style");
        style.id = "invitalab-accessibility-styles";
        style.textContent = `
            :focus-visible { outline: 3px solid #2563eb !important; outline-offset: 3px !important; }
            img, svg, video, iframe { max-width: 100%; }
            body { overflow-wrap: break-word; }
            .text-gray-400 { color: #59616c !important; }
            .text-gray-500 { color: #4b5563 !important; }
            .invitalab-turnstile { max-width: 100%; overflow: hidden; }
            .invitalab-demo-notice {
                margin: 0;
                padding: .7rem 1rem;
                background: #fff8db;
                color: #574400;
                border-top: 1px solid #e8d58c;
                font: 600 .78rem/1.5 system-ui, sans-serif;
                text-align: center;
            }
            @media (pointer: coarse) {
                button, a.btn, .nav-item, [role="button"] { min-height: 44px; min-width: 44px; }
            }
            @media (max-width: 360px) {
                .invitalab-turnstile { transform: scale(.9); transform-origin: left top; margin-bottom: -6px; }
            }
            @media (prefers-reduced-motion: reduce) {
                html { scroll-behavior: auto !important; }
                *, *::before, *::after {
                    animation-duration: .01ms !important;
                    animation-iteration-count: 1 !important;
                    scroll-behavior: auto !important;
                    transition-duration: .01ms !important;
                }
            }
        `;
        document.head.appendChild(style);
    }

    function initAccessibility() {
        const controlLabels = {
            fullscreenBtn: "Aktifkan atau keluar dari layar penuh",
            audioBtn: "Putar atau jeda musik",
            musicBtn: "Putar atau jeda musik",
            "music-btn": "Putar atau jeda musik",
            "music-control": "Putar atau jeda musik"
        };

        Object.entries(controlLabels).forEach(([id, label]) => {
            const control = document.getElementById(id);
            if (!control) return;
            control.setAttribute("aria-label", label);
            control.setAttribute("title", label);
        });

        const navLabels = {
            "#home": "Beranda undangan",
            "#couple": "Profil mempelai",
            "#event": "Detail acara",
            "#map": "Lokasi acara",
            "#wish": "RSVP dan ucapan",
            "#rsvp": "RSVP dan ucapan"
        };
        document.querySelectorAll("a.nav-item").forEach((link) => {
            if (!link.getAttribute("aria-label")) {
                link.setAttribute("aria-label", navLabels[link.getAttribute("href")] || "Navigasi undangan");
            }
        });

        document.querySelectorAll('[onclick]:not(button):not(a)').forEach((control) => {
            control.setAttribute("role", "button");
            control.setAttribute("tabindex", "0");
            control.addEventListener("keydown", (event) => {
                if (event.key === "Enter" || event.key === " ") {
                    event.preventDefault();
                    control.click();
                }
            });
        });

        document.querySelectorAll("img").forEach((image) => {
            if (!image.hasAttribute("decoding")) image.setAttribute("decoding", "async");
        });

        const audio = document.querySelector("audio");
        if (audio) {
            const musicControls = ["audioBtn", "musicBtn", "music-btn", "music-control"]
                .map((id) => document.getElementById(id))
                .filter(Boolean);
            const updateAudioState = () => {
                musicControls.forEach((control) => control.setAttribute("aria-pressed", String(!audio.paused)));
            };
            audio.addEventListener("play", updateAudioState);
            audio.addEventListener("pause", updateAudioState);
            updateAudioState();
        }
    }

    function initDemoNotice() {
        if (document.body?.dataset.templateMode !== "demo") return;
        if (document.getElementById("invitalab-demo-notice")) return;

        const notice = document.createElement("aside");
        notice.id = "invitalab-demo-notice";
        notice.className = "invitalab-demo-notice";
        notice.setAttribute("role", "note");
        notice.textContent = "Preview template Invitalab — nama, tanggal, lokasi, rekening, Instagram, dan data meeting pada halaman ini hanya data demo.";
        document.body.appendChild(notice);

        document.querySelectorAll("a[data-demo-link='true']").forEach((link) => {
            link.setAttribute("aria-describedby", notice.id);
            link.setAttribute("title", "Link demo — ganti melalui konfigurasi sebelum dipublikasikan");
            link.addEventListener("click", (event) => {
                event.preventDefault();
                notice.textContent = "Link ini masih data demo. Ganti URL Instagram, streaming, atau meeting sebelum undangan dipublikasikan.";
                notice.scrollIntoView({ block: "nearest", behavior: "smooth" });
            });
        });
    }

    injectAccessibilityStyles();
    if (document.readyState === "loading") {
        document.addEventListener("DOMContentLoaded", () => {
            initAccessibility();
            initDemoNotice();
        }, { once: true });
    } else {
        initAccessibility();
        initDemoNotice();
    }

    window.InvitalabTemplate = Object.freeze({
        applyGuestName,
        cleanGuestName,
        copyText,
        getGuestName
    });
})();
