(() => {
  const rows = [...document.querySelectorAll('#schedule .row')];
  const buttons = [...document.querySelectorAll('[data-filter]')];
  const details = [...document.querySelectorAll('.course-details')];
  document.querySelector('.schedule-controls').hidden = false;

  function filterSessions(filter) {
    let count = 0;
    rows.forEach(row => {
      const show = filter === 'all' || (filter === 'materials' && row.dataset.materials === 'true') ||
        (filter === 'exams' && row.classList.contains('exam'));
      row.hidden = !show;
      if (show) count++;
    });
    buttons.forEach(button => button.setAttribute('aria-pressed', String(button.dataset.filter === filter)));
    document.querySelector('.filter-count').textContent = `${count} of ${rows.length} meetings`;
    window.dispatchEvent(new Event('resize'));
  }
  buttons.forEach(button => button.addEventListener('click', () => filterSessions(button.dataset.filter)));
  filterSessions('all');

  function reveal(hash) {
    const target = document.getElementById(hash.slice(1));
    if (!target) return;
    let changed = false;
    if (target.closest('.row[hidden]')) {
      filterSessions('all'); changed = true;
    }
    const detail = target.closest('details');
    if (detail && !detail.open) { detail.open = true; changed = true; }
    if (changed) requestAnimationFrame(() => target.scrollIntoView());
  }
  window.addEventListener('hashchange', () => reveal(location.hash));
  document.addEventListener('click', event => {
    const anchor = event.target.closest('a[href^="#"]');
    if (anchor) reveal(anchor.hash);
  });
  reveal(location.hash);
  details.forEach(detail => detail.addEventListener('toggle', () => window.dispatchEvent(new Event('resize'))));

  let printStates;
  window.addEventListener('beforeprint', () => {
    if (printStates) return;
    printStates = details.map(detail => detail.open);
    details.forEach(detail => { detail.open = true; });
  });
  window.addEventListener('afterprint', () => {
    if (!printStates) return;
    details.forEach((detail, i) => { detail.open = printStates[i]; });
    printStates = undefined;
  });
})();

// Keep the selected section visible in the sticky navigation, including short end sections.
(() => {
  const links = [...document.querySelectorAll('.section-nav a')];
  const sections = links.map(link => document.querySelector(link.hash));
  let pending = false;
  function destinationSection() {
    const target = document.getElementById(location.hash.slice(1));
    return target ? sections.findIndex(section => section === target || section.contains(target)) : -1;
  }
  let requested = destinationSection();
  function update() {
    const threshold = Math.max(document.querySelector('.section-nav').offsetHeight + 22,
      parseFloat(getComputedStyle(document.documentElement).scrollPaddingTop) + 2);
    let active = 0;
    sections.forEach((section, index) => { if (section.getBoundingClientRect().top <= threshold) active = index; });
    if (scrollY > 0 && scrollY + innerHeight >= document.documentElement.scrollHeight - 2) active = sections.length - 1;
    if (requested >= 0) {
      const bounds = sections[requested].getBoundingClientRect();
      if (bounds.top < innerHeight && bounds.bottom > threshold) active = requested;
    }
    links.forEach((link, i) => {
      if (i === active) link.setAttribute('aria-current', 'location');
      else link.removeAttribute('aria-current');
    });
    pending = false;
  }
  function queue() { if (!pending) { pending = true; requestAnimationFrame(update); } }
  function release() { requested = -1; queue(); }
  links.forEach((link, i) => link.addEventListener('click', () => { requested = i; queue(); }));
  window.addEventListener('hashchange', () => { requested = destinationSection(); queue(); });
  window.addEventListener('wheel', release, { passive: true });
  window.addEventListener('touchmove', release, { passive: true });
  window.addEventListener('keydown', event => {
    if (['ArrowDown', 'ArrowUp', 'PageDown', 'PageUp', 'Home', 'End', ' '].includes(event.key)) release();
  });
  document.addEventListener('pointerdown', event => { if (!event.target.closest('.section-nav')) release(); });
  window.addEventListener('scroll', queue, { passive: true });
  window.addEventListener('resize', queue);
  document.fonts.ready.then(update);
  update();
})();
