/*
 * SchedulePoint marketing site — the only script on the page.
 *
 * Two jobs: remember the reader's theme choice, and mark the nav link for the
 * section they are currently reading. Everything else is HTML and CSS.
 */

(function () {
  'use strict';

  /* Flag JS availability: reveal-on-scroll only hides content under `.js`,
     so with scripts off (or broken) everything is simply visible. */
  document.documentElement.classList.add('js');

  /* ── Theme toggle ─────────────────────────────────────────────────
     The initial theme is applied by the inline script in <head> so there is no
     flash; this only handles the click and persists the choice. */

  var root = document.documentElement;
  var toggle = document.getElementById('theme-toggle');

  function labelFor(theme) {
    return theme === 'dark' ? 'Switch to light theme' : 'Switch to dark theme';
  }

  var themeAnimTimer = null;

  if (toggle) {
    toggle.setAttribute('aria-label', labelFor(root.dataset.theme));

    toggle.addEventListener('click', function () {
      var next = root.dataset.theme === 'dark' ? 'light' : 'dark';
      /* Cross-fade the flip: the transition class lives only as long as the
         change, so the rest of the time nothing carries transition cost. */
      root.classList.add('theme-anim');
      clearTimeout(themeAnimTimer);
      themeAnimTimer = setTimeout(function () {
        root.classList.remove('theme-anim');
      }, 450);
      root.dataset.theme = next;
      toggle.setAttribute('aria-label', labelFor(next));
      try {
        localStorage.setItem('sp-theme', next);
      } catch (e) {
        /* storage blocked — the choice simply does not persist */
      }
    });
  }

  /* Follow the OS if the reader has never made an explicit choice. */
  var media = window.matchMedia('(prefers-color-scheme: dark)');
  var onSchemeChange = function (event) {
    var stored = null;
    try {
      stored = localStorage.getItem('sp-theme');
    } catch (e) {
      /* ignore */
    }
    if (stored) return;
    var next = event.matches ? 'dark' : 'light';
    root.dataset.theme = next;
    if (toggle) toggle.setAttribute('aria-label', labelFor(next));
  };

  if (typeof media.addEventListener === 'function') {
    media.addEventListener('change', onSchemeChange);
  } else if (typeof media.addListener === 'function') {
    media.addListener(onSchemeChange);
  }

  /* ── Current-section highlighting ─────────────────────────────────
     Purely decorative: if IntersectionObserver is missing, the nav still works. */

  if (!('IntersectionObserver' in window)) return;

  var links = Array.prototype.slice.call(document.querySelectorAll('.site-nav a[href^="#"]'));
  if (links.length === 0) return;

  var byId = {};
  var sections = [];

  links.forEach(function (link) {
    var id = link.getAttribute('href').slice(1);
    var section = document.getElementById(id);
    if (!section) return;
    byId[id] = link;
    sections.push(section);
  });

  var visible = new Set();

  var observer = new IntersectionObserver(
    function (entries) {
      entries.forEach(function (entry) {
        if (entry.isIntersecting) visible.add(entry.target.id);
        else visible.delete(entry.target.id);
      });

      /* The topmost visible section wins, so the marker never lags behind. */
      var current = null;
      for (var i = 0; i < sections.length; i += 1) {
        if (visible.has(sections[i].id)) {
          current = sections[i].id;
          break;
        }
      }

      links.forEach(function (link) {
        link.removeAttribute('aria-current');
      });
      if (current && byId[current]) byId[current].setAttribute('aria-current', 'true');
    },
    { rootMargin: '-30% 0px -55% 0px', threshold: 0 }
  );

  sections.forEach(function (section) {
    observer.observe(section);
  });

  /* ── Reveal on scroll ─────────────────────────────────────────────
     Cards, steps and section headers ease in as they enter the viewport.
     Purely decorative; prefers-reduced-motion collapses it in CSS. */

  var revealTargets = document.querySelectorAll(
    '.section-head, .card, .step, .benefit, .versus-card, .faq details, .stat-strip li, .table-scroll, .aside'
  );

  var revealObserver = new IntersectionObserver(
    function (entries) {
      entries.forEach(function (entry) {
        if (!entry.isIntersecting) return;
        entry.target.classList.add('is-visible');
        revealObserver.unobserve(entry.target);
      });
    },
    { rootMargin: '0px 0px -8% 0px', threshold: 0.05 }
  );

  revealTargets.forEach(function (el, i) {
    el.classList.add('reveal');
    /* Stagger siblings slightly so grids cascade rather than pop. */
    var siblingIndex = Array.prototype.indexOf.call(el.parentElement.children, el);
    el.style.setProperty('--reveal-delay', Math.min(siblingIndex, 5) * 60 + 'ms');
    revealObserver.observe(el);
  });

  /* ── Header elevation ─────────────────────────────────────────────
     A shadow appears once the page has scrolled under the header. */

  var header = document.querySelector('.site-header');
  if (header) {
    var onScroll = function () {
      header.classList.toggle('scrolled', window.scrollY > 8);
    };
    window.addEventListener('scroll', onScroll, { passive: true });
    onScroll();
  }

  /* ── Stat count-up ────────────────────────────────────────────────
     Numbers in the stat strip count up the first time they scroll into
     view. Skipped entirely under prefers-reduced-motion. */

  var reduceMotion = window.matchMedia('(prefers-reduced-motion: reduce)');
  var stats = document.querySelectorAll('.stat-strip strong');

  if (stats.length && !reduceMotion.matches) {
    var easeOut = function (t) {
      return 1 - Math.pow(1 - t, 3);
    };

    var runCounter = function (el) {
      var raw = el.textContent;
      var match = raw.match(/^([^0-9]*)([\d,]+)(.*)$/);
      if (!match) return;
      var target = parseInt(match[2].replace(/,/g, ''), 10);
      if (!isFinite(target) || target === 0) return;
      var prefix = match[1];
      var suffix = match[3];
      var t0 = null;
      var dur = 900;
      var frame = function (ts) {
        if (t0 === null) t0 = ts;
        var t = Math.min(1, (ts - t0) / dur);
        var value = Math.round(target * easeOut(t));
        el.textContent = prefix + value.toLocaleString('en-GB') + suffix;
        if (t < 1) requestAnimationFrame(frame);
        else el.textContent = raw;
      };
      requestAnimationFrame(frame);
    };

    var statObserver = new IntersectionObserver(
      function (entries) {
        entries.forEach(function (entry) {
          if (!entry.isIntersecting) return;
          runCounter(entry.target);
          statObserver.unobserve(entry.target);
        });
      },
      { threshold: 0.6 }
    );

    stats.forEach(function (el) {
      statObserver.observe(el);
    });
  }
})();
