document.addEventListener('DOMContentLoaded', () => {
    const progress = document.createElement('div');
    progress.className = 'jp-scroll-progress';
    progress.setAttribute('aria-hidden', 'true');
    document.body.appendChild(progress);

    const navLinks = [...document.querySelectorAll('.nav-item')];
    const sections = navLinks
        .map((link) => document.querySelector(link.getAttribute('href')))
        .filter(Boolean);

    const updateScrollUI = () => {
        const scrollable = document.documentElement.scrollHeight - window.innerHeight;
        const ratio = scrollable > 0 ? Math.min(window.scrollY / scrollable, 1) : 0;
        progress.style.transform = `scaleX(${ratio})`;

        const marker = window.scrollY + window.innerHeight * 0.38;
        let currentId = sections[0]?.id;

        sections.forEach((section) => {
            if (section.offsetTop <= marker) currentId = section.id;
        });

        navLinks.forEach((link) => {
            const active = link.getAttribute('href') === `#${currentId}`;
            link.classList.toggle('is-active', active);
            if (active) link.setAttribute('aria-current', 'page');
            else link.removeAttribute('aria-current');
        });
    };

    let ticking = false;
    window.addEventListener('scroll', () => {
        if (ticking) return;
        ticking = true;
        window.requestAnimationFrame(() => {
            updateScrollUI();
            ticking = false;
        });
    }, { passive: true });

    window.addEventListener('resize', updateScrollUI, { passive: true });
    updateScrollUI();

    if (window.matchMedia('(pointer: fine) and (prefers-reduced-motion: no-preference)').matches) {
        const heroImage = document.querySelector('#home img[alt="Foto Naufal dan Lina"]');
        const hero = document.getElementById('home');

        hero?.addEventListener('pointermove', (event) => {
            if (!heroImage) return;
            const bounds = hero.getBoundingClientRect();
            const x = (event.clientX - bounds.left) / bounds.width - 0.5;
            const y = (event.clientY - bounds.top) / bounds.height - 0.5;
            heroImage.style.transform = `translate3d(${x * 8}px, ${y * 8}px, 0) rotate(${x * 0.8}deg)`;
        });

        hero?.addEventListener('pointerleave', () => {
            if (heroImage) heroImage.style.transform = '';
        });
    }
});
