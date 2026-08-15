document.addEventListener('DOMContentLoaded',()=>{
  const button=document.querySelector('.menu-button');
  const nav=document.querySelector('.primary-nav');
  const closeMenu=()=>{button?.classList.remove('is-open');nav?.classList.remove('is-open');button?.setAttribute('aria-expanded','false');document.body.classList.remove('menu-open')};
  button?.addEventListener('click',()=>{const open=!button.classList.contains('is-open');button.classList.toggle('is-open',open);nav?.classList.toggle('is-open',open);button.setAttribute('aria-expanded',String(open));document.body.classList.toggle('menu-open',open)});
  nav?.querySelectorAll('a').forEach(link=>link.addEventListener('click',closeMenu));
  window.addEventListener('resize',()=>{if(innerWidth>760)closeMenu()});
  const observer=new IntersectionObserver(entries=>entries.forEach(entry=>{if(entry.isIntersecting){entry.target.classList.add('is-visible');observer.unobserve(entry.target)}}),{threshold:.12,rootMargin:'0px 0px -30px'});
  document.querySelectorAll('.reveal').forEach(el=>observer.observe(el));
  const filterButtons=document.querySelectorAll('[data-filter]');
  const cards=document.querySelectorAll('[data-category]');
  filterButtons.forEach(btn=>btn.addEventListener('click',()=>{filterButtons.forEach(item=>item.classList.remove('active'));btn.classList.add('active');const filter=btn.dataset.filter;cards.forEach(card=>card.classList.toggle('is-hidden',filter!=='Semua'&&card.dataset.category!==filter))}));
});
