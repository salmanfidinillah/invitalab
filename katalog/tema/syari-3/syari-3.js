(function () {
  "use strict";

  const weddingDate = new Date("2028-12-31T08:00:00+07:00").getTime();
  const reducedMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;

  function initGuestName() {
    if (window.InvitalabTemplate) {
      window.InvitalabTemplate.applyGuestName("guest-name", "Tamu Undangan");
    }
  }

  function initCoverAndMusic() {
    const cover = document.getElementById("coverScreen");
    const openButton = document.getElementById("openInvitation");
    const audio = document.getElementById("bg-music");
    const musicButton = document.getElementById("music-control");

    const updateMusicButton = () => {
      if (!musicButton || !audio) return;
      const isPlaying = !audio.paused;
      musicButton.classList.toggle("is-muted", !isPlaying);
      musicButton.setAttribute("aria-pressed", String(isPlaying));
      musicButton.title = isPlaying ? "Jeda musik" : "Putar musik";
    };

    const playMusic = async () => {
      if (!audio) return;
      try {
        await audio.play();
      } catch (error) {
        updateMusicButton();
      }
    };

    openButton?.addEventListener("click", () => {
      cover?.classList.add("is-open");
      document.body.classList.remove("cover-open");
      document.body.classList.add("invitation-open");
      playMusic();

      window.setTimeout(() => {
        cover?.setAttribute("aria-hidden", "true");
      }, reducedMotion ? 0 : 850);
    });

    musicButton?.addEventListener("click", () => {
      if (!audio) return;
      if (audio.paused) playMusic();
      else audio.pause();
    });

    audio?.addEventListener("play", updateMusicButton);
    audio?.addEventListener("pause", updateMusicButton);
    audio?.addEventListener("ended", updateMusicButton);
    updateMusicButton();
  }

  function initFullscreen() {
    const button = document.getElementById("fullscreenBtn");
    if (!button || !document.documentElement.requestFullscreen) {
      button?.setAttribute("hidden", "");
      return;
    }

    button.addEventListener("click", async () => {
      try {
        if (document.fullscreenElement) await document.exitFullscreen();
        else await document.documentElement.requestFullscreen();
      } catch (error) {
        button.title = "Layar penuh tidak tersedia di browser ini";
      }
    });

    document.addEventListener("fullscreenchange", () => {
      const active = Boolean(document.fullscreenElement);
      button.setAttribute("aria-pressed", String(active));
      button.title = active ? "Keluar dari layar penuh" : "Aktifkan layar penuh";
    });
  }

  function initCountdown() {
    const fields = {
      days: document.getElementById("days"),
      hours: document.getElementById("hours"),
      minutes: document.getElementById("minutes"),
      seconds: document.getElementById("seconds")
    };

    const render = () => {
      const distance = Math.max(0, weddingDate - Date.now());
      const values = {
        days: Math.floor(distance / 86400000),
        hours: Math.floor((distance % 86400000) / 3600000),
        minutes: Math.floor((distance % 3600000) / 60000),
        seconds: Math.floor((distance % 60000) / 1000)
      };

      Object.entries(values).forEach(([key, value]) => {
        if (fields[key]) fields[key].textContent = String(value).padStart(2, "0");
      });
    };

    render();
    window.setInterval(render, 1000);
  }

  function initCopyButtons() {
    document.querySelectorAll("[data-copy-target]").forEach((button) => {
      const originalLabel = button.innerHTML;
      button.addEventListener("click", async () => {
        const target = document.getElementById(button.dataset.copyTarget);
        if (!target || !window.InvitalabTemplate) return;

        try {
          await window.InvitalabTemplate.copyText(target.textContent);
          button.innerHTML = "Tersalin <span>✓</span>";
          button.classList.add("is-copied");
        } catch (error) {
          button.innerHTML = "Salin manual <span>↗</span>";
        }

        window.setTimeout(() => {
          button.innerHTML = originalLabel;
          button.classList.remove("is-copied");
        }, 1800);
      });
    });
  }

  function initReveal() {
    const items = document.querySelectorAll(".reveal");
    if (reducedMotion || !("IntersectionObserver" in window)) {
      items.forEach((item) => item.classList.add("is-visible"));
      return;
    }

    const observer = new IntersectionObserver((entries) => {
      entries.forEach((entry) => {
        if (!entry.isIntersecting) return;
        entry.target.classList.add("is-visible");
        observer.unobserve(entry.target);
      });
    }, { threshold: 0.12, rootMargin: "0px 0px -7%" });

    items.forEach((item) => observer.observe(item));
  }

  function initNavigation() {
    const links = document.querySelectorAll('a[href^="#"]');
    const dockItems = document.querySelectorAll(".dock-item[data-section]");

    links.forEach((link) => {
      link.addEventListener("click", (event) => {
        const target = document.querySelector(link.getAttribute("href"));
        if (!target) return;
        event.preventDefault();
        target.scrollIntoView({ behavior: reducedMotion ? "auto" : "smooth", block: "start" });
      });
    });

    const sections = [...dockItems]
      .map((item) => document.getElementById(item.dataset.section))
      .filter(Boolean);
    let ticking = false;

    const updateActiveSection = () => {
      const checkpoint = window.scrollY + Math.min(220, window.innerHeight * 0.3);
      let activeId = sections[0]?.id;
      sections.forEach((section) => {
        if (section.offsetTop <= checkpoint) activeId = section.id;
      });

      dockItems.forEach((item) => {
        const active = item.dataset.section === activeId;
        item.classList.toggle("active", active);
        if (active) item.setAttribute("aria-current", "page");
        else item.removeAttribute("aria-current");
      });
      ticking = false;
    };

    window.addEventListener("scroll", () => {
      if (ticking) return;
      ticking = true;
      window.requestAnimationFrame(updateActiveSection);
    }, { passive: true });
    updateActiveSection();
  }

  function initParallax() {
    if (reducedMotion || window.matchMedia("(pointer: coarse)").matches) return;
    document.querySelectorAll("[data-parallax]").forEach((element) => {
      element.addEventListener("pointermove", (event) => {
        const bounds = element.getBoundingClientRect();
        const x = (event.clientX - bounds.left) / bounds.width - 0.5;
        const y = (event.clientY - bounds.top) / bounds.height - 0.5;
        element.style.setProperty("--parallax-x", `${x * 10}px`);
        element.style.setProperty("--parallax-y", `${y * 8}px`);
      });
      element.addEventListener("pointerleave", () => {
        element.style.setProperty("--parallax-x", "0px");
        element.style.setProperty("--parallax-y", "0px");
      });
    });
  }

  function init() {
    initGuestName();
    initCoverAndMusic();
    initFullscreen();
    initCountdown();
    initCopyButtons();
    initReveal();
    initNavigation();
    initParallax();
  }

  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", init, { once: true });
  } else {
    init();
  }
})();
