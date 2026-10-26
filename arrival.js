/* A brief loading-style entrance, with skip, reduced-motion, and failure exits. */
(() => {
  'use strict';
  const root = document.documentElement;
  const screen = document.getElementById('arrival-screen');
  if (!screen) return;
  if (!root.classList.contains('intro-pending')) { screen.remove(); return; }

  const skip = document.getElementById('arrival-skip');
  const reduced = window.matchMedia('(prefers-reduced-motion: reduce)');
  const previousFocus = document.activeElement;
  const timers = new Set();
  let ended = false;
  let revealing = false;
  let minimumElapsed = false;
  let contentReady = false;

  function later(callback, duration) {
    const timer = window.setTimeout(() => { timers.delete(timer); callback(); }, duration);
    timers.add(timer);
  }

  function finish() {
    if (ended) return;
    ended = true;
    for (const timer of timers) clearTimeout(timer);
    timers.clear();
    const hadFocus = screen.contains(document.activeElement);
    root.classList.remove('intro-pending', 'intro-running', 'intro-revealing');
    document.removeEventListener('keydown', onKey);
    document.removeEventListener('visibilitychange', onVisibility);
    document.removeEventListener('portfolio:intro-expired', finish);
    reduced.removeEventListener('change', onPreference);
    screen.remove();
    document.dispatchEvent(new Event('portfolio:intro-finished'));
    if (hadFocus) {
      const target = previousFocus && previousFocus !== document.body && previousFocus.isConnected ? previousFocus : document.querySelector('.wordmark');
      target?.focus({preventScroll: true});
    }
  }

  function reveal() {
    if (ended || revealing) return;
    revealing = true;
    root.classList.add('intro-revealing');
    screen.classList.add('is-leaving');
    later(finish, 320);
  }
  function maybeReveal() { if (minimumElapsed && contentReady) reveal(); }
  function onKey(event) {
    if (event.key === 'Escape') { event.preventDefault(); finish(); }
    else if (event.key === 'Tab') { event.preventDefault(); skip?.focus({preventScroll: true}); }
  }
  function onVisibility() { if (document.hidden) finish(); }
  function onPreference() { if (reduced.matches) finish(); }

  skip?.addEventListener('click', finish);
  document.addEventListener('keydown', onKey);
  document.addEventListener('visibilitychange', onVisibility);
  document.addEventListener('portfolio:intro-expired', finish);
  reduced.addEventListener('change', onPreference);
  // Always unblock the page, even if fonts or an animation fail to finish.
  later(finish, 4000);
  if (reduced.matches || root.classList.contains('motion-paused') || document.hidden) { finish(); return; }

  root.classList.add('intro-running');
  skip?.focus({preventScroll: true});
  later(() => { minimumElapsed = true; maybeReveal(); }, 2300);
  Promise.resolve(document.fonts?.ready).then(() => {
    contentReady = true;
    maybeReveal();
  }, () => {
    contentReady = true;
    maybeReveal();
  });
})();
