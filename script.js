(() => {
  'use strict';

  const init = () => {
    const root = document.documentElement;
    const hero = document.querySelector('#intro');
    const heroName = document.querySelector('.hero-name');
    const introTrack = document.querySelector('.intro-track');
    const introSticky = document.querySelector('.intro-sticky');
    const introDetails = document.querySelector('#intro-details');
    const horizontalIntro = window.matchMedia('(min-width: 900px) and (min-height: 600px)');
    const reducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)');
    const mobileMotion = window.matchMedia('(max-width: 767px), (pointer: coarse)');
    const reveals = [...document.querySelectorAll('.reveal')];
    let revealObserver = null;
    let scrollFrame = 0;
    let heroTop = 0;
    let heroHeight = 1;
    let viewportHeight = window.innerHeight;
    let horizontal = false;
    let measured = false;
    let introRange = 1;
    let introTravel = 0;
    let lastShift = '';
    let lastOpacity = '';
    let entranceTimer = 0;
    let rippleTimer = 0;
    const introLeadIn = 0.12;
    const introSettleAt = 0.88;

    root.classList.add('js');
    const finishOpeningIntro = () => {
      window.clearTimeout(entranceTimer);
      window.clearTimeout(rippleTimer);
      root.classList.add('is-loaded');
      root.classList.remove('is-opening-intro');
    };
    if (reducedMotion.matches) {
      finishOpeningIntro();
    } else {
      root.classList.add('is-opening-intro');
      entranceTimer = window.setTimeout(() => root.classList.add('is-loaded'), 450);
      rippleTimer = window.setTimeout(() => root.classList.remove('is-opening-intro'), 1700);
    }
    // The earlier design's manual motion setting does not apply to this version.
    try { window.localStorage.removeItem('bat-motion-paused'); } catch (_) { /* Storage is optional. */ }

    const listenMedia = (media, listener) => {
      if (media.addEventListener) media.addEventListener('change', listener);
      else if (media.addListener) media.addListener(listener);
    };
    const revealEverything = () => {
      reveals.forEach((element) => element.classList.add('is-visible'));
      revealObserver?.disconnect();
    };

    if ('IntersectionObserver' in window && !reducedMotion.matches) {
      try {
        revealObserver = new IntersectionObserver((entries, observer) => {
          entries.forEach((entry) => {
            if (!entry.isIntersecting) return;
            entry.target.classList.add('is-visible');
            observer.unobserve(entry.target);
          });
        }, { threshold: 0.12 });
        reveals.forEach((element) => {
          const delay = Number(element.dataset.revealDelay);
          if (Number.isFinite(delay) && delay >= 0 && element.hasAttribute('data-reveal-delay')) {
            element.style.setProperty('--delay', `${Math.min(delay, 1000)}ms`);
          }
          revealObserver.observe(element);
        });
        root.classList.add('can-reveal');
      } catch (_) {
        root.classList.remove('can-reveal');
        revealEverything();
      }
    } else {
      revealEverything();
    }

    const settledIntroProgress = (progress) => {
      const value = Math.max(0, Math.min(1, (progress - introLeadIn) / (introSettleAt - introLeadIn)));
      const ramp = 0.15;
      const steadyRange = 1 - ramp;
      // Short quadratic ramps soften the start and finish; the middle follows native scroll steadily.
      if (value < ramp) return (value * value) / (2 * ramp * steadyRange);
      if (value > 1 - ramp) return 1 - ((1 - value) ** 2) / (2 * ramp * steadyRange);
      return (value - ramp / 2) / steadyRange;
    };
    const updateParallax = () => {
      scrollFrame = 0;
      if (reducedMotion.matches) return;
      const distance = Math.max(0, Math.min(heroHeight, window.scrollY - heroTop));
      const intensity = mobileMotion.matches ? 0.7 : 1;
      const scrollProgress = Math.max(0, Math.min(1, (window.scrollY - heroTop) / introRange));
      const progress = horizontal ? settledIntroProgress(scrollProgress) : scrollProgress;
      if (horizontal && introTrack) {
        introTrack.style.transform = `translate3d(${(-progress * introTravel).toFixed(2)}px, 0, 0)`;
      }
      if (!heroName) return;
      const shift = horizontal
        ? `${(-progress * 60).toFixed(2)}px`
        : `${(-Math.min(60, distance * 0.14) * intensity).toFixed(2)}px`;
      const opacity = (horizontal
        ? Math.max(0.55, 1 - progress * 0.45)
        : Math.max(0.55, 1 - (distance / heroHeight) * 0.45)).toFixed(3);
      if (shift !== lastShift) heroName.style.setProperty('--name-shift', shift);
      if (opacity !== lastOpacity) heroName.style.setProperty('--name-opacity', opacity);
      lastShift = shift;
      lastOpacity = opacity;
    };
    const requestParallax = () => {
      if (!scrollFrame && !reducedMotion.matches) scrollFrame = window.requestAnimationFrame(updateParallax);
    };
    const measureHero = (preservePosition = false) => {
      if (!hero) return;
      const oldHeight = heroHeight;
      const oldTop = heroTop;
      const oldRange = Math.max(1, oldHeight - viewportHeight);
      const oldScroll = window.scrollY;
      const previousMode = horizontal;
      horizontal = Boolean(introTrack && introSticky && horizontalIntro.matches && !reducedMotion.matches);
      root.classList.toggle('has-horizontal-intro', horizontal);
      if (horizontal && introDetails) {
        const copy = introDetails.querySelector('.intro-copy');
        const style = window.getComputedStyle(introDetails);
        const availableHeight = window.innerHeight - (parseFloat(style.paddingTop) || 0) - (parseFloat(style.paddingBottom) || 0);
        // Text zoom must never trap content inside the pinned viewport.
        if (copy && Math.ceil(copy.getBoundingClientRect().height) > availableHeight + 1) {
          horizontal = false;
          root.classList.remove('has-horizontal-intro');
        }
      }
      if (!horizontal) introTrack?.style.removeProperty('transform');
      heroTop = hero.getBoundingClientRect().top + window.scrollY;
      heroHeight = Math.max(1, hero.offsetHeight);
      viewportHeight = window.innerHeight;
      introRange = Math.max(1, heroHeight - viewportHeight);
      introTravel = Math.max(0, (introTrack?.scrollWidth || 0) - window.innerWidth);
      const horizontalGeometryChanged = previousMode && horizontal
        && (oldRange !== introRange || oldHeight !== heroHeight || oldTop !== heroTop);
      if (preservePosition && measured && (previousMode !== horizontal || horizontalGeometryChanged) && oldScroll >= oldTop) {
        const top = oldScroll <= oldTop + oldRange
          ? heroTop + Math.max(0, Math.min(1, (oldScroll - oldTop) / oldRange)) * introRange
          : oldScroll + heroHeight - oldHeight;
        window.scrollTo({ top: Math.max(0, top), left: 0, behavior: 'instant' });
      }
      measured = true;
      requestParallax();
    };
    const applyMotionPreference = () => {
      root.classList.toggle('reduced-motion', reducedMotion.matches);
      if (reducedMotion.matches) {
        finishOpeningIntro();
        if (scrollFrame) window.cancelAnimationFrame(scrollFrame);
        scrollFrame = 0;
        heroName?.style.removeProperty('--name-shift');
        heroName?.style.removeProperty('--name-opacity');
        lastShift = '';
        lastOpacity = '';
        revealEverything();
      } else {
        requestParallax();
      }
      measureHero(true);
    };
    window.addEventListener('scroll', requestParallax, { passive: true });
    window.addEventListener('resize', () => measureHero(true), { passive: true });
    listenMedia(reducedMotion, applyMotionPreference);
    listenMedia(mobileMotion, requestParallax);
    listenMedia(horizontalIntro, () => measureHero(true));
    applyMotionPreference();
    measureHero();

    // Font readiness refreshes measurements without delaying the water-drop entrance.
    if (document.fonts?.ready) {
      document.fonts.ready.then(() => measureHero(true), () => {});
    }

    const resetIntroOffset = () => {
      const offset = introSticky?.scrollLeft || 0;
      if (introSticky) introSticky.scrollLeft = 0;
      return offset;
    };
    const scrollToIntroSide = (details, smooth = false) => {
      resetIntroOffset();
      window.scrollTo({
        top: heroTop + (details ? introRange * introSettleAt : 0),
        left: 0,
        behavior: smooth && !reducedMotion.matches ? 'smooth' : 'instant'
      });
      requestParallax();
    };
    let focusingIntroAnchor = false;
    document.querySelectorAll('a[href="#intro-details"], a[href="#about"]').forEach((link) => {
      link.addEventListener('click', (event) => {
        if (!horizontal || event.defaultPrevented || event.button > 0 || event.metaKey || event.ctrlKey || event.shiftKey || event.altKey) return;
        const id = link.getAttribute('href').slice(1);
        const target = document.getElementById(id);
        if (!target || !introDetails?.contains(target)) return;
        event.preventDefault();
        try { window.history.pushState(window.history.state, '', `#${id}`); } catch (_) { /* Optional in restricted previews. */ }
        target.setAttribute('tabindex', '-1');
        focusingIntroAnchor = true;
        target.focus({ preventScroll: true });
        focusingIntroAnchor = false;
        scrollToIntroSide(true, true);
      });
    });
    introTrack?.addEventListener('focusin', (event) => {
      if (!horizontal) return;
      const nativeOffset = resetIntroOffset();
      // Some browsers scroll overflow containers after dispatching focus events.
      window.requestAnimationFrame(resetIntroOffset);
      if (focusingIntroAnchor) return;
      const bounds = event.target.getBoundingClientRect();
      const clipped = bounds.left < -1 || bounds.right > window.innerWidth + 1
        || bounds.top < 0 || bounds.bottom > window.innerHeight;
      if (!nativeOffset && !clipped) return;
      const inDetails = introDetails?.contains(event.target);
      scrollToIntroSide(Boolean(inDetails));
    });

    const legacyHashes = { builds: 'work', beyond: 'intro-details', connect: 'contact' };
    const normalizeLegacyHash = () => {
      let id;
      try { id = decodeURIComponent(window.location.hash.slice(1)); } catch (_) { return; }
      const targetId = legacyHashes[id] || id;
      const target = document.getElementById(targetId);
      if (!target) return;
      if (legacyHashes[id]) {
        try { window.history.replaceState(window.history.state, '', `#${targetId}`); } catch (_) { /* Scrolling still works in restricted previews. */ }
      }
      if (horizontal && introDetails?.contains(target)) {
        window.requestAnimationFrame(() => scrollToIntroSide(true));
      } else if (legacyHashes[id]) {
        window.requestAnimationFrame(() => target.scrollIntoView({ behavior: 'instant', block: 'start' }));
      }
    };
    normalizeLegacyHash();
    window.addEventListener('hashchange', normalizeLegacyHash);

    const experience = document.querySelector('#experience');
    const experienceToggle = document.querySelector('#experience-toggle');
    const experienceDetails = document.querySelector('#experience-details');
    if (experience && experienceToggle && experienceDetails) {
      const setExperienceOpen = (open) => {
        if (!open && experienceDetails.contains(document.activeElement)) {
          experienceToggle.focus({ preventScroll: true });
        }
        experienceToggle.setAttribute('aria-expanded', String(open));
        experienceDetails.setAttribute('aria-hidden', String(!open));
        experienceDetails.inert = !open;
        experience.classList.toggle('is-open', open);
      };
      // The HTML remains expanded without JavaScript; enhancement supplies the disclosure.
      experience.classList.add('is-enhanced');
      setExperienceOpen(false);
      experienceToggle.addEventListener('click', () => {
        setExperienceOpen(experienceToggle.getAttribute('aria-expanded') !== 'true');
      });
    }

    const dialog = document.querySelector('#contact-dialog');
    const openLinks = [...document.querySelectorAll('[data-open-contact]')];
    if (dialog && typeof dialog.showModal === 'function') {
      const title = document.querySelector('#contact-title');
      const description = document.querySelector('#contact-description');
      let returnFocus = null;
      let closeTimer = 0;
      let openingTimer = 0;
      let locked = false;
      let backdropStart = false;

      const finishClose = () => {
        // Ignore a queued close event if this dialog has already reopened.
        if (dialog.open || !locked) return;
        window.clearTimeout(closeTimer);
        window.clearTimeout(openingTimer);
        dialog.classList.remove('is-opening', 'is-closing');
        root.classList.remove('dialog-open');
        locked = false;
        if (returnFocus?.isConnected) returnFocus.focus({ preventScroll: true });
        returnFocus = null;
      };
      const completeClose = () => {
        if (dialog.open) dialog.close();
        finishClose();
      };
      const requestClose = () => {
        if (!dialog.open || dialog.classList.contains('is-closing')) return;
        window.clearTimeout(openingTimer);
        dialog.classList.remove('is-opening');
        if (reducedMotion.matches) completeClose();
        else {
          dialog.classList.add('is-closing');
          closeTimer = window.setTimeout(completeClose, 400);
        }
      };
      openLinks.forEach((link) => {
        link.addEventListener('click', (event) => {
          if (event.defaultPrevented || event.button > 0 || event.metaKey || event.ctrlKey || event.shiftKey || event.altKey) return;
          if (dialog.open) {
            event.preventDefault();
            return;
          }
          const resume = link.dataset.contactReason === 'resume';
          if (title) title.textContent = resume ? 'Want my résumé?' : 'Say hello.';
          if (description) description.textContent = resume
            ? 'Send me a note and I’ll share it with you.'
            : 'An idea, a collaboration, or a good conversation — I’m listening.';
          dialog.classList.remove('is-closing');
          dialog.classList.add('is-opening');
          // If native dialog opening fails, the anchor's original mailto action remains available.
          try { dialog.showModal(); } catch (_) {
            dialog.classList.remove('is-opening');
            return;
          }
          event.preventDefault();
          returnFocus = link;
          locked = true;
          root.classList.add('dialog-open');
          window.clearTimeout(closeTimer);
          window.clearTimeout(openingTimer);
          openingTimer = window.setTimeout(() => dialog.classList.remove('is-opening'), reducedMotion.matches ? 0 : 850);
        });
      });
      dialog.querySelector('#close-contact')?.addEventListener('click', requestClose);
      dialog.addEventListener('cancel', (event) => {
        event.preventDefault();
        requestClose();
      });
      dialog.addEventListener('close', finishClose);
      const isBackdrop = (event) => {
        if (event.target !== dialog) return false;
        const bounds = dialog.getBoundingClientRect();
        return event.clientX < bounds.left || event.clientX > bounds.right || event.clientY < bounds.top || event.clientY > bounds.bottom;
      };
      dialog.addEventListener('pointerdown', (event) => { backdropStart = isBackdrop(event); });
      dialog.addEventListener('click', (event) => {
        if (backdropStart && isBackdrop(event)) requestClose();
        backdropStart = false;
      });
    }

    const copyButton = document.querySelector('#copy-email');
    const emailLink = document.querySelector('#contact-email');
    const copyStatus = document.querySelector('#copy-status');
    copyButton?.addEventListener('click', async () => {
      const email = (emailLink?.getAttribute('href') || 'mailto:batcontact.help@gmail.com').replace(/^mailto:/i, '').split('?')[0];
      let copied = false;
      try {
        if (navigator.clipboard?.writeText) {
          await navigator.clipboard.writeText(email);
          copied = true;
        }
      } catch (_) { /* Continue with the selection fallback. */ }
      if (!copied) {
        const field = document.createElement('textarea');
        field.value = email;
        field.setAttribute('readonly', '');
        field.setAttribute('aria-label', 'Email address to copy');
        field.style.cssText = 'position:fixed;top:0;left:0;width:1px;height:1px;opacity:0;';
        (dialog?.open ? dialog : document.body).appendChild(field);
        field.select();
        try { copied = document.execCommand('copy'); } catch (_) { /* Display the address if copying is unavailable. */ }
        field.remove();
        copyButton.focus({ preventScroll: true });
      }
      if (copyStatus) copyStatus.textContent = copied ? 'Email copied.' : `Copy this address: ${email}`;
    });
  };

  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', init, { once: true });
  else init();
})();
