(() => {
  'use strict';
  const root = document.documentElement;
  root.classList.add('js');
  const reduced = window.matchMedia('(prefers-reduced-motion: reduce)');
  const fine = window.matchMedia('(hover: hover) and (pointer: fine)');
  const sections = [...document.querySelectorAll('[data-world]')];
  const chapters = sections.filter(section => section.hasAttribute('data-chapter'));
  const world = window.PortfolioWorld;
  const canvas = document.getElementById('world-canvas');
  const motionButton = document.getElementById('motion-toggle');
  const currentChapter = document.getElementById('current-chapter');
  const currentName = document.getElementById('current-chapter-name');
  let userPaused = false;
  let paused = reduced.matches;
  let frame = 0;
  let geometry = [];
  let activeId = '';
  let pointerX = 0;
  let pointerY = 0;
  try { userPaused = localStorage.getItem('bat-motion-paused-v2') === 'true'; } catch (_) { /* Optional local preference. */ }
  paused = reduced.matches || userPaused;
  if (canvas && world?.init(canvas)) document.querySelector('.world')?.classList.add('has-webgl');

  const measure = () => {
    geometry = sections.map(section => ({element: section, top: section.getBoundingClientRect().top + window.scrollY, progress: Number(section.dataset.world)}));
    schedule();
  };
  const update = () => {
    frame = 0;
    const scrollY = window.scrollY;
    root.classList.toggle('is-scrolled', scrollY > 80);
    const range = Math.max(1, root.scrollHeight - window.innerHeight);
    root.style.setProperty('--progress', Math.min(1, Math.max(0, scrollY / range)).toFixed(5));
    // Native scrolling remains the source of truth. Interpolate between the actual chapter positions.
    const focus = scrollY + window.innerHeight * 0.18;
    let before = geometry[0];
    let after = geometry[geometry.length - 1];
    for (let index = 0; index < geometry.length - 1; index++) {
      if (focus >= geometry[index].top && focus < geometry[index + 1].top) {
        before = geometry[index]; after = geometry[index + 1]; break;
      }
    }
    if (focus >= geometry[geometry.length - 1]?.top) before = after;
    if (before && after) {
      const t = Math.max(0, Math.min(1, (focus - before.top) / Math.max(1, after.top - before.top)));
      const progress = before.progress + (after.progress - before.progress) * t;
      if (!paused) world?.setProgress(progress);
    }
    let active = chapters[0];
    for (const chapter of chapters) {
      if (chapter.getBoundingClientRect().top < window.innerHeight * 0.53) active = chapter;
    }
    if (active && active.id !== activeId) {
      activeId = active.id;
      root.dataset.chapter = activeId;
      currentChapter.textContent = active.dataset.chapter;
      currentName.textContent = active.dataset.name;
      document.querySelectorAll('[data-chapter-link]').forEach(link => {
        const selected = link.dataset.chapterLink === activeId;
        link.classList.toggle('active', selected);
        if (selected) link.setAttribute('aria-current', 'location');
        else link.removeAttribute('aria-current');
      });
    }
    if (!paused) {
      document.querySelectorAll('[data-parallax]').forEach(art => {
        const bounds = art.getBoundingClientRect();
        if (bounds.bottom < 0 || bounds.top > window.innerHeight) return;
        const shift = (window.innerHeight * 0.5 - bounds.top - bounds.height * 0.5) * Number(art.dataset.parallax);
        art.style.setProperty('--art-y', `${shift.toFixed(1)}px`);
      });
    }
  };
  function schedule() { if (!frame) frame = requestAnimationFrame(update); }
  const applyMotion = () => {
    paused = userPaused || reduced.matches;
    root.classList.toggle('motion-paused', paused);
    motionButton.setAttribute('aria-pressed', String(paused));
    motionButton.disabled = reduced.matches;
    motionButton.setAttribute('aria-label', reduced.matches ? 'Reduced motion follows your device setting' : paused ? 'Resume animation' : 'Pause animation');
    motionButton.querySelector('.motion-label').textContent = reduced.matches ? 'Reduced motion' : paused ? 'Motion off' : 'Motion on';
    motionButton.querySelector('.motion-icon').textContent = paused ? '▷' : 'Ⅱ';
    world?.setPaused(paused);
    if (paused) document.querySelectorAll('[data-parallax]').forEach(art => { art.style.removeProperty('--art-y'); art.style.removeProperty('--art-x'); });
    schedule();
  };
  motionButton.addEventListener('click', () => {
    userPaused = !userPaused;
    try { localStorage.setItem('bat-motion-paused-v2', String(userPaused)); } catch (_) { /* Storage is optional. */ }
    applyMotion();
  });
  reduced.addEventListener('change', applyMotion);
  window.addEventListener('scroll', schedule, {passive: true});
  window.addEventListener('resize', measure, {passive: true});
  if (fine.matches) window.addEventListener('pointermove', event => {
    if (paused) return;
    pointerX = event.clientX / window.innerWidth * 2 - 1;
    pointerY = event.clientY / window.innerHeight * 2 - 1;
    world?.setPointer(pointerX, pointerY);
    document.querySelectorAll('[data-parallax]').forEach(art => {
      if (art.getBoundingClientRect().top < window.innerHeight) art.style.setProperty('--art-x', `${(pointerX * 8).toFixed(1)}px`);
    });
  }, {passive: true});
  if ('IntersectionObserver' in window) {
    const observer = new IntersectionObserver(entries => entries.forEach(entry => {
      if (!entry.isIntersecting) return;
      entry.target.classList.add('is-visible'); observer.unobserve(entry.target);
    }), {threshold: 0.09, rootMargin: '0px 0px -25px 0px'});
    document.querySelectorAll('.reveal').forEach(element => observer.observe(element));
    root.classList.add('reveal-ready');
  }
  // Both dialogs have real links underneath their progressive enhancements.
  const indexDialog = document.getElementById('index-dialog');
  const contactDialog = document.getElementById('contact-dialog');
  let dialogOpener = null;
  function openDialog(dialog, opener) {
    if (!dialog?.showModal) return false;
    dialogOpener = opener;
    dialog.showModal();
    return true;
  }
  document.querySelectorAll('[data-open-index]').forEach(button => button.addEventListener('click', () => openDialog(indexDialog, button)));
  document.querySelectorAll('[data-open-contact]').forEach(link => link.addEventListener('click', event => {
    document.getElementById('contact-title').innerHTML = link.dataset.contactReason === 'resume' ? 'The <em>résumé.</em>' : 'Say <em>hello.</em>';
    document.getElementById('contact-description').textContent = link.dataset.contactReason === 'resume' ? 'Drop me an email and I’ll share my experience with you.' : 'An idea, a collaboration, or a good conversation.';
    if (openDialog(contactDialog, link)) event.preventDefault();
  }));
  document.querySelectorAll('[data-close-dialog]').forEach(button => button.addEventListener('click', () => document.getElementById(button.dataset.closeDialog)?.close()));
  document.querySelectorAll('dialog').forEach(dialog => {
    dialog.addEventListener('click', event => {
      if (event.target !== dialog) return;
      const bounds = dialog.getBoundingClientRect();
      if (event.clientX < bounds.left || event.clientX > bounds.right || event.clientY < bounds.top || event.clientY > bounds.bottom) dialog.close();
    });
    dialog.addEventListener('close', () => { dialogOpener?.focus({preventScroll:true}); });
  });
  indexDialog.querySelectorAll('a').forEach(link => link.addEventListener('click', event => {
    const destination = document.querySelector(link.getAttribute('href'));
    if (!destination) return;
    event.preventDefault();
    dialogOpener = null;
    indexDialog.close();
    destination.setAttribute('tabindex', '-1');
    destination.focus({preventScroll:true});
    destination.scrollIntoView({behavior:paused ? 'instant' : 'smooth', block:'start'});
    history.replaceState(null, '', link.getAttribute('href'));
  }));
  document.getElementById('copy-email').addEventListener('click', async () => {
    const status = document.getElementById('copy-status');
    try { await navigator.clipboard.writeText('batcontact.help@gmail.com'); status.textContent = 'Email copied. See you in the inbox.'; }
    catch (_) { status.textContent = 'Copy this address: batcontact.help@gmail.com'; }
  });
  const geneCopy = {
    APOE: 'Follow a gene to its protein, related findings, and original studies.',
    TREM2: 'Explore source-linked findings with the study context and limitations attached.',
    ABCA1: 'Trace connections across genes, proteins, and pathways in the evidence explorer.'
  };
  document.querySelectorAll('[data-gene]').forEach(button => button.addEventListener('click', () => {
    document.querySelectorAll('[data-gene]').forEach(node => { const selected = node === button; node.classList.toggle('active', selected); node.setAttribute('aria-pressed', String(selected)); });
    const description = document.getElementById('gene-description');
    const strong = document.createElement('strong'); strong.textContent = button.dataset.gene;
    description.replaceChildren(strong, document.createTextNode(` · ${geneCopy[button.dataset.gene]}`));
  }));
  let proofRun = 0;
  document.getElementById('run-proof').addEventListener('click', async event => {
    const button = event.currentTarget;
    if (button.disabled) return;
    const id = ++proofRun;
    const lines = [...document.querySelectorAll('[data-check]')];
    const status = document.getElementById('proof-status');
    button.disabled = true;
    button.firstChild.textContent = 'Playing example ';
    lines.forEach(line => { line.classList.remove('passed','running'); line.querySelector('.check-symbol').textContent = '○'; line.querySelector('.check-result').textContent = 'READY'; });
    status.textContent = 'Example verification in progress…';
    for (const line of lines) {
      if (id !== proofRun) return;
      line.classList.add('running'); line.querySelector('.check-symbol').textContent = '◌'; line.querySelector('.check-result').textContent = 'RUN';
      if (!paused) await new Promise(resolve => setTimeout(resolve, 620));
      line.classList.remove('running'); line.classList.add('passed'); line.querySelector('.check-symbol').textContent = '✓'; line.querySelector('.check-result').textContent = 'PASS';
    }
    status.textContent = 'Example complete. Checks, screenshots, and logs—kept together.';
    button.disabled = false;
    button.firstChild.textContent = 'Replay example ';
  });
  applyMotion();
  measure();
  document.fonts?.ready.then(measure);
  window.addEventListener('load', measure, {once:true});
})();
