document.addEventListener('DOMContentLoaded', () => {
    const container = document.getElementById('container');
    const cover = document.getElementById('cover');
    const openButton = cover?.querySelector('button');
    if (!container || !cover) return;

    const progress = document.createElement('div');
    progress.className = 'sy2-scroll-progress';
    progress.setAttribute('aria-hidden', 'true');
    document.body.appendChild(progress);

    const sections = [
        { id: 'couple', label: 'Mempelai', icon: '♥', element: document.querySelector('#mainContent > section:nth-of-type(1)') },
        { id: 'event', label: 'Acara', icon: '31', element: document.querySelector('#mainContent > section:nth-of-type(2)') },
        { id: 'story', label: 'Kisah', icon: '∞', element: document.querySelector('#mainContent > section:nth-of-type(4)') },
        { id: 'gift', label: 'Gift', icon: '◇', element: document.querySelector('#mainContent > section:nth-of-type(5)') },
        { id: 'wishes', label: 'Ucapan', icon: '✦', element: document.querySelector('#mainContent > section:nth-of-type(6)') }
    ].filter((item) => item.element);

    sections.forEach((item) => { item.element.id = item.id; });

    const nav = document.createElement('nav');
    nav.className = 'sy2-nav';
    nav.setAttribute('aria-label', 'Navigasi undangan');
    nav.innerHTML = sections.map((item) => (
        `<a href="#${item.id}" data-label="${item.label}" aria-label="${item.label}">${item.icon}</a>`
    )).join('');
    document.body.appendChild(nav);

    const links = [...nav.querySelectorAll('a')];
    links.forEach((link) => {
        link.addEventListener('click', (event) => {
            event.preventDefault();
            const target = document.querySelector(link.getAttribute('href'));
            target?.scrollIntoView({ behavior: 'smooth', block: 'start' });
        });
    });

    const setOpenState = () => document.body.classList.toggle('sy2-open', cover.classList.contains('open'));
    openButton?.addEventListener('click', () => window.requestAnimationFrame(setOpenState));
    new MutationObserver(setOpenState).observe(cover, { attributes: true, attributeFilter: ['class'] });

    const updateScrollUI = () => {
        const scrollable = container.scrollHeight - container.clientHeight;
        const ratio = scrollable > 0 ? Math.min(container.scrollTop / scrollable, 1) : 0;
        progress.style.transform = `scaleX(${ratio})`;

        const marker = container.scrollTop + container.clientHeight * 0.38;
        let currentId = sections[0]?.id;
        sections.forEach((item) => {
            if (item.element.offsetTop <= marker) currentId = item.id;
        });

        links.forEach((link) => {
            const active = link.getAttribute('href') === `#${currentId}`;
            link.classList.toggle('is-active', active);
            if (active) link.setAttribute('aria-current', 'page');
            else link.removeAttribute('aria-current');
        });
    };

    let ticking = false;
    container.addEventListener('scroll', () => {
        if (ticking) return;
        ticking = true;
        window.requestAnimationFrame(() => {
            updateScrollUI();
            ticking = false;
        });
    }, { passive: true });
    window.addEventListener('resize', updateScrollUI, { passive: true });
    updateScrollUI();

    if (window.matchMedia('(prefers-reduced-motion: no-preference)').matches) {
        for (let i = 0; i < 9; i += 1) {
            const leaf = document.createElement('span');
            leaf.className = 'sy2-leaf';
            leaf.setAttribute('aria-hidden', 'true');
            leaf.style.left = `${8 + i * 11}%`;
            leaf.style.setProperty('--leaf-duration', `${10 + (i % 4) * 2.2}s`);
            leaf.style.setProperty('--leaf-delay', `${-i * 1.7}s`);
            document.body.appendChild(leaf);
        }

        const coverImage = cover.querySelector('.arch-image');
        cover.addEventListener('pointermove', (event) => {
            if (!coverImage || !window.matchMedia('(pointer: fine)').matches) return;
            const bounds = cover.getBoundingClientRect();
            const x = (event.clientX - bounds.left) / bounds.width - .5;
            const y = (event.clientY - bounds.top) / bounds.height - .5;
            coverImage.style.transform = `translate3d(${x * 8}px, ${y * 8}px, 0) rotate(${x * .7}deg)`;
        });
        cover.addEventListener('pointerleave', () => {
            if (coverImage) coverImage.style.transform = '';
        });
    }
});
