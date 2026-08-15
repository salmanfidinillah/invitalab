(function () {
  "use strict";

  const weddingDate = new Date("2027-07-17T13:00:00+07:00").getTime();
  const reducedMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;

  function initGuestName() {
    window.InvitalabTemplate?.applyGuestName("nama-tamu", "Tamu Undangan");
  }

  function initPetals() {
    if (reducedMotion) return;
    const layer = document.getElementById("petal-layer");
    if (!layer) return;

    const createPetal = () => {
      if (document.hidden || layer.childElementCount >= 18) return;
      const petal = document.createElement("span");
      const duration = 7 + Math.random() * 6;
      petal.className = "petal";
      petal.style.left = `${Math.random() * 100}%`;
      petal.style.width = `${8 + Math.random() * 9}px`;
      petal.style.height = `${12 + Math.random() * 12}px`;
      petal.style.animationDuration = `${duration}s`;
      petal.style.setProperty("--petal-drift", `${-90 + Math.random() * 180}px`);
      petal.style.setProperty("--petal-rotate", `${280 + Math.random() * 460}deg`);
      layer.appendChild(petal);
      window.setTimeout(() => petal.remove(), duration * 1000 + 300);
    };

    for (let index = 0; index < 8; index += 1) {
      window.setTimeout(createPetal, index * 180);
    }
    window.setInterval(createPetal, 850);
  }

  function initOpeningAndMusic() {
    const cover = document.getElementById("wedding-cover");
    const openButton = document.getElementById("openInvitation");
    const audio = document.getElementById("bg-music");
    const musicButton = document.getElementById("music-btn");
    let petalsStarted = false;

    const syncMusic = () => {
      if (!audio || !musicButton) return;
      const playing = !audio.paused;
      musicButton.classList.toggle("is-muted", !playing);
      musicButton.setAttribute("aria-pressed", String(playing));
      musicButton.title = playing ? "Jeda musik" : "Putar musik";
    };

    const playMusic = async () => {
      if (!audio) return;
      try { await audio.play(); } catch (error) { syncMusic(); }
    };

    openButton?.addEventListener("click", () => {
      cover?.classList.add("is-open");
      document.body.classList.remove("cover-locked");
      document.body.classList.add("invitation-open");
      playMusic();
      if (!petalsStarted) { petalsStarted = true; initPetals(); }
      window.setTimeout(() => cover?.setAttribute("aria-hidden", "true"), reducedMotion ? 0 : 900);
    });

    musicButton?.addEventListener("click", () => {
      if (!audio) return;
      if (audio.paused) playMusic(); else audio.pause();
    });
    audio?.addEventListener("play", syncMusic);
    audio?.addEventListener("pause", syncMusic);
    audio?.addEventListener("ended", syncMusic);
    syncMusic();
  }

  function initFullscreen() {
    const button = document.getElementById("fullscreenBtn");
    if (!button || !document.documentElement.requestFullscreen) { button?.setAttribute("hidden", ""); return; }
    button.addEventListener("click", async () => {
      try {
        if (document.fullscreenElement) await document.exitFullscreen();
        else await document.documentElement.requestFullscreen();
      } catch (error) { button.title = "Layar penuh tidak tersedia di browser ini"; }
    });
    document.addEventListener("fullscreenchange", () => {
      const active = Boolean(document.fullscreenElement);
      button.setAttribute("aria-pressed", String(active));
      button.title = active ? "Keluar dari layar penuh" : "Aktifkan layar penuh";
    });
  }

  function initCountdown() {
    const fields = { hari: document.getElementById("hari"), jam: document.getElementById("jam"), menit: document.getElementById("menit"), detik: document.getElementById("detik") };
    const render = () => {
      const distance = Math.max(0, weddingDate - Date.now());
      const values = { hari: Math.floor(distance / 86400000), jam: Math.floor((distance % 86400000) / 3600000), menit: Math.floor((distance % 3600000) / 60000), detik: Math.floor((distance % 60000) / 1000) };
      Object.entries(values).forEach(([key, value]) => {
        const field = fields[key];
        const next = String(value).padStart(2, "0");
        if (!field || field.textContent === next) return;
        field.textContent = next;
        field.classList.remove("tick");
        void field.offsetWidth;
        field.classList.add("tick");
      });
    };
    render();
    window.setInterval(render, 1000);
  }

  function initCopyButtons() {
    document.querySelectorAll("[data-copy-target]").forEach((button) => {
      const original = button.innerHTML;
      button.addEventListener("click", async () => {
        const target = document.getElementById(button.dataset.copyTarget);
        if (!target || !window.InvitalabTemplate) return;
        try {
          await window.InvitalabTemplate.copyText(target.textContent.replace(/\s+/g, ""));
          button.innerHTML = "Tersalin <span>✓</span>";
          button.classList.add("is-copied");
        } catch (error) { button.innerHTML = "Salin manual <span>↗</span>"; }
        window.setTimeout(() => { button.innerHTML = original; button.classList.remove("is-copied"); }, 1800);
      });
    });
  }

  function initReveal() {
    const items = document.querySelectorAll(".reveal");
    if (reducedMotion || !("IntersectionObserver" in window)) { items.forEach((item) => item.classList.add("is-visible")); return; }
    const observer = new IntersectionObserver((entries) => {
      entries.forEach((entry) => {
        if (!entry.isIntersecting) return;
        entry.target.classList.add("is-visible");
        observer.unobserve(entry.target);
      });
    }, { threshold: .12, rootMargin: "0px 0px -7%" });
    items.forEach((item) => observer.observe(item));
  }

  function initNavigation() {
    document.querySelectorAll('a[href^="#"]').forEach((link) => {
      link.addEventListener("click", (event) => {
        const target = document.querySelector(link.getAttribute("href"));
        if (!target) return;
        event.preventDefault();
        target.scrollIntoView({ behavior: reducedMotion ? "auto" : "smooth", block: "start" });
      });
    });

    const dockItems = document.querySelectorAll(".dock-item[data-section]");
    const sections = [...dockItems].map((item) => document.getElementById(item.dataset.section)).filter(Boolean);
    let ticking = false;
    const update = () => {
      const checkpoint = scrollY + Math.min(220, innerHeight * .3);
      let activeId = sections[0]?.id;
      sections.forEach((section) => { if (section.offsetTop <= checkpoint) activeId = section.id; });
      dockItems.forEach((item) => {
        const active = item.dataset.section === activeId;
        item.classList.toggle("active", active);
        if (active) item.setAttribute("aria-current", "page"); else item.removeAttribute("aria-current");
      });
      ticking = false;
    };
    addEventListener("scroll", () => { if (!ticking) { ticking = true; requestAnimationFrame(update); } }, { passive: true });
    update();
  }

  function initParallax() {
    if (reducedMotion || matchMedia("(pointer: coarse)").matches) return;
    document.querySelectorAll("[data-parallax]").forEach((element) => {
      element.addEventListener("pointermove", (event) => {
        const bounds = element.getBoundingClientRect();
        const x = (event.clientX - bounds.left) / bounds.width - .5;
        const y = (event.clientY - bounds.top) / bounds.height - .5;
        element.style.setProperty("--parallax-x", `${x * 12}px`);
        element.style.setProperty("--parallax-y", `${y * 9}px`);
      });
      element.addEventListener("pointerleave", () => { element.style.setProperty("--parallax-x", "0px"); element.style.setProperty("--parallax-y", "0px"); });
    });
  }

  function init() { initGuestName(); initOpeningAndMusic(); initFullscreen(); initCountdown(); initCopyButtons(); initReveal(); initNavigation(); initParallax(); }
  if (document.readyState === "loading") document.addEventListener("DOMContentLoaded", init, { once: true }); else init();
})();
