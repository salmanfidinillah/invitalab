(function () {
    "use strict";

    const targetDate = new Date("2028-03-12T19:00:00+07:00").getTime();
    const reducedMotion = window.matchMedia("(prefers-reduced-motion: reduce)");
    const finePointer = window.matchMedia("(pointer: fine)");

    function byId(id) {
        return document.getElementById(id);
    }

    function setAudioButtonState(audio, button) {
        const muted = audio.paused;
        button.classList.toggle("is-muted", muted);
        button.setAttribute("aria-pressed", String(!muted));
        button.setAttribute("title", muted ? "Putar musik" : "Jeda musik");
    }

    async function playAudio(audio, button) {
        try {
            await audio.play();
        } catch (error) {
            console.info("Musik menunggu interaksi pengguna.", error);
        }
        setAudioButtonState(audio, button);
    }

    function initInvitationCover() {
        const cover = byId("invitationCover");
        const openButton = byId("openInvitation");
        const audio = byId("bgMusic");
        const audioButton = byId("audioBtn");
        if (!cover || !openButton || !audio || !audioButton) return;

        setAudioButtonState(audio, audioButton);
        openButton.addEventListener("click", async () => {
            cover.classList.add("is-open");
            document.body.classList.remove("cover-open");
            document.body.classList.add("invitation-open");
            await playAudio(audio, audioButton);
            window.setTimeout(() => cover.setAttribute("aria-hidden", "true"), 850);
        });

        audioButton.addEventListener("click", async () => {
            if (audio.paused) await playAudio(audio, audioButton);
            else audio.pause();
            setAudioButtonState(audio, audioButton);
        });
        audio.addEventListener("play", () => setAudioButtonState(audio, audioButton));
        audio.addEventListener("pause", () => setAudioButtonState(audio, audioButton));
    }

    function initGuestName() {
        if (window.InvitalabTemplate) {
            window.InvitalabTemplate.applyGuestName("nama-tamu", "Tamu Undangan");
        }
    }

    function initFullscreen() {
        const button = byId("fullscreenBtn");
        if (!button) return;

        button.addEventListener("click", async () => {
            try {
                if (!document.fullscreenElement) await document.documentElement.requestFullscreen();
                else await document.exitFullscreen();
            } catch (error) {
                console.info("Mode layar penuh tidak tersedia.", error);
            }
        });
    }

    function updateCountdown() {
        const distance = Math.max(0, targetDate - Date.now());
        const values = {
            days: Math.floor(distance / 86_400_000),
            hours: Math.floor((distance % 86_400_000) / 3_600_000),
            minutes: Math.floor((distance % 3_600_000) / 60_000),
            seconds: Math.floor((distance % 60_000) / 1_000)
        };

        Object.entries(values).forEach(([id, value]) => {
            const element = byId(id);
            if (element) element.textContent = String(value).padStart(2, "0");
        });
    }

    function initCountdown() {
        updateCountdown();
        window.setInterval(updateCountdown, 1_000);
    }

    function initCopyAccount() {
        const button = byId("copyAccount");
        const feedback = byId("copyFeedback");
        if (!button || !feedback) return;

        button.addEventListener("click", async () => {
            const account = button.dataset.copy || "";
            try {
                await window.InvitalabTemplate.copyText(account);
                feedback.textContent = "Nomor rekening berhasil disalin.";
            } catch {
                feedback.textContent = `Salin manual: ${account}`;
            }
            window.setTimeout(() => { feedback.textContent = ""; }, 3_000);
        });
    }

    function initRevealAnimation() {
        const elements = document.querySelectorAll(".reveal");
        if (reducedMotion.matches || !("IntersectionObserver" in window)) {
            elements.forEach((element) => element.classList.add("is-visible"));
            return;
        }

        const observer = new IntersectionObserver((entries) => {
            entries.forEach((entry) => {
                if (!entry.isIntersecting) return;
                entry.target.classList.add("is-visible");
                observer.unobserve(entry.target);
            });
        }, { threshold: 0.12, rootMargin: "0px 0px -40px" });

        elements.forEach((element) => observer.observe(element));
    }

    function initSmoothNavigation() {
        const links = document.querySelectorAll('a[href^="#"]');
        links.forEach((link) => {
            link.addEventListener("click", (event) => {
                const target = document.querySelector(link.getAttribute("href"));
                if (!target) return;
                event.preventDefault();
                target.scrollIntoView({ behavior: reducedMotion.matches ? "auto" : "smooth", block: "start" });
            });
        });
    }

    function initActiveDock() {
        const dockItems = [...document.querySelectorAll(".dock-item[data-section]")];
        if (!dockItems.length || !("IntersectionObserver" in window)) return;

        const sections = dockItems
            .map((item) => document.getElementById(item.dataset.section))
            .filter(Boolean);
        const observer = new IntersectionObserver((entries) => {
            const visible = entries
                .filter((entry) => entry.isIntersecting)
                .sort((a, b) => b.intersectionRatio - a.intersectionRatio)[0];
            if (!visible) return;
            dockItems.forEach((item) => item.classList.toggle("active", item.dataset.section === visible.target.id));
        }, { rootMargin: "-32% 0px -52%", threshold: [0, 0.12, 0.3] });

        sections.forEach((section) => observer.observe(section));
    }

    function initPortraitParallax() {
        const portrait = document.querySelector("[data-parallax]");
        if (!portrait || reducedMotion.matches || !finePointer.matches) return;

        portrait.addEventListener("pointermove", (event) => {
            const rect = portrait.getBoundingClientRect();
            const x = (event.clientX - rect.left) / rect.width - 0.5;
            const y = (event.clientY - rect.top) / rect.height - 0.5;
            portrait.style.transform = `perspective(1000px) rotateY(${x * 2.4}deg) rotateX(${y * -2.4}deg) translate3d(${x * 5}px, ${y * 5}px, 0)`;
        });
        portrait.addEventListener("pointerleave", () => { portrait.style.transform = ""; });
    }

    function init() {
        initGuestName();
        initInvitationCover();
        initFullscreen();
        initCountdown();
        initCopyAccount();
        initRevealAnimation();
        initSmoothNavigation();
        initActiveDock();
        initPortraitParallax();
    }

    if (document.readyState === "loading") document.addEventListener("DOMContentLoaded", init, { once: true });
    else init();
})();
