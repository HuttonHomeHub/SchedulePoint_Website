/*
 * The hero's live sample — a working miniature of SchedulePoint's canvas.
 *
 * A real (tiny) CPM engine runs in the page: forward and backward pass,
 * total float, critical path, driving-logic detection. Drag a bar and the
 * network re-flows; drag it left of where its logic allows and the logic
 * wins — exactly the honesty the product sells.
 *
 * Progressive enhancement: without JavaScript the static SVG diagram in the
 * HTML stands. With it, this module replaces that SVG with the interactive
 * one. Bars are keyboard-operable sliders (arrow keys move a day at a time),
 * and changes are announced through a polite live region.
 */

(function () {
  'use strict';

  var host = document.querySelector('.hero-figure .app-body');
  var staticSvg = host && host.querySelector('svg.tsld');
  if (!host || !staticSvg || typeof window.PointerEvent === 'undefined') return;

  var reducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)');

  /* ── Model ──────────────────────────────────────────────────────── */

  var PPD = 8; // pixels per day — bar width IS duration; the axis never lies
  var X0 = 10; // x of day zero
  var MAX_DAY = 88; // last draggable day
  var ROWS = [84, 128, 172, 216, 260, 304];
  var BAR_H = 24;
  var TODAY = 30;

  var ACTS = [
    { id: 'A100', name: 'Mobilise', dur: 12, lane: 0 },
    { id: 'A200', name: 'Piling', dur: 15, lane: 1 },
    { id: 'A300', name: 'Substructure', dur: 16, lane: 2 },
    { id: 'A400', name: 'Frame', dur: 12, lane: 3 },
    { id: 'A210', name: 'Service diversions', dur: 24, lane: 4 },
    { id: 'A220', name: 'Survey', dur: 11, lane: 5 },
  ];

  var LINKS = [
    { from: 'A100', to: 'A200', lag: 2 },
    { from: 'A200', to: 'A300', lag: 3 },
    { from: 'A300', to: 'A400', lag: 6 },
    { from: 'A100', to: 'A210', lag: 8 },
    { from: 'A220', to: 'A210', lag: 2 },
    { from: 'A210', to: 'A400', lag: 0 },
  ];

  var byId = {};
  ACTS.forEach(function (a) {
    byId[a.id] = a;
    a.pin = null; // planner-imposed "start no earlier than", set by dragging
    a.homeLane = a.lane;
  });

  /* ── The engine ─────────────────────────────────────────────────── */

  function solve() {
    var preds = {};
    var succs = {};
    ACTS.forEach(function (a) {
      preds[a.id] = [];
      succs[a.id] = [];
    });
    LINKS.forEach(function (l) {
      preds[l.to].push(l);
      succs[l.from].push(l);
    });

    // Forward pass. The link list is not guaranteed topological, so iterate
    // to a fixed point — with six activities that converges immediately.
    ACTS.forEach(function (a) {
      a.es = a.pin || 0;
    });
    for (var pass = 0; pass < ACTS.length; pass += 1) {
      var changed = false;
      ACTS.forEach(function (a) {
        var es = a.pin || 0;
        preds[a.id].forEach(function (l) {
          var p = byId[l.from];
          es = Math.max(es, p.es + p.dur + l.lag);
        });
        if (es !== a.es) {
          a.es = es;
          changed = true;
        }
      });
      if (!changed) break;
    }

    var end = 0;
    ACTS.forEach(function (a) {
      end = Math.max(end, a.es + a.dur);
    });

    // Backward pass → total float → critical. Initialise every activity at
    // the project end, then relax to a fixed point — monotone decreasing, so
    // it converges regardless of declaration order.
    ACTS.forEach(function (a) {
      a.lf = end;
      a.ls = end - a.dur;
    });
    for (var bp = 0; bp < ACTS.length; bp += 1) {
      var moved = false;
      ACTS.forEach(function (a) {
        var lf = end;
        succs[a.id].forEach(function (l) {
          var s = byId[l.to];
          lf = Math.min(lf, s.ls - l.lag);
        });
        if (lf < a.lf) {
          a.lf = lf;
          a.ls = lf - a.dur;
          moved = true;
        }
      });
      if (!moved) break;
    }
    ACTS.forEach(function (a) {
      a.float = a.ls - a.es;
      a.critical = a.float <= 0;
    });
    LINKS.forEach(function (l) {
      var p = byId[l.from];
      var s = byId[l.to];
      l.driving = p.es + p.dur + l.lag === s.es;
      l.critical = l.driving && p.critical && s.critical;
    });

    return end;
  }

  /* Logic-only earliest start, ignoring this activity's own pin — the floor
     a leftward drag snaps back to. */
  function logicStart(act) {
    var pin = act.pin;
    act.pin = null;
    solve();
    var es = act.es;
    act.pin = pin;
    solve();
    return es;
  }

  /* ── Dates for announcements ────────────────────────────────────── */

  var MONTHS = ['Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug'];
  var MLEN = [31, 30, 31, 30, 31, 31];

  function dayLabel(day) {
    var m = 0;
    var d = day;
    while (m < MLEN.length - 1 && d >= MLEN[m]) {
      d -= MLEN[m];
      m += 1;
    }
    return d + 1 + ' ' + MONTHS[m];
  }

  /* ── Build the interactive SVG ──────────────────────────────────── */

  var NS = 'http://www.w3.org/2000/svg';

  function el(name, attrs, parent) {
    var node = document.createElementNS(NS, name);
    for (var k in attrs) node.setAttribute(k, attrs[k]);
    if (parent) parent.appendChild(node);
    return node;
  }

  var svg = el('svg', { viewBox: '0 0 760 380', class: 'tsld tsld-live' });

  var decor = el('g', { 'aria-hidden': 'true' }, svg);

  // Weekend shading — every 7th and 6th day, faint.
  var shade = el('g', { class: 'tsld-nonworking', opacity: '0.55' }, decor);
  for (var d = 0; d <= MAX_DAY + 4; d += 7) {
    el('rect', { x: X0 + (d + 5) * PPD, y: 46, width: PPD * 2, height: 316 }, shade);
  }

  // Ruler.
  var ruler = el('g', { class: 'tsld-ruler' }, decor);
  el('line', { x1: X0, y1: 46, x2: 750, y2: 46 }, ruler);
  var cum = 0;
  MONTHS.forEach(function (m, i) {
    var x = X0 + cum * PPD;
    if (x < 720) {
      var t = el('text', { x: x + 4, y: 30 }, ruler);
      t.textContent = m.toUpperCase();
      el('line', { x1: x, y1: 36, x2: x, y2: 46 }, ruler);
    }
    cum += MLEN[i];
  });

  // Today.
  var todayX = X0 + TODAY * PPD;
  var today = el('g', { class: 'tsld-today' }, decor);
  el('line', { x1: todayX, y1: 46, x2: todayX, y2: 362 }, today);
  el('rect', { x: todayX - 32, y: 52, width: 64, height: 18, rx: 9 }, today);
  var todayText = el('text', { x: todayX, y: 65 }, today);
  todayText.textContent = 'TODAY';

  // Links under bars.
  var linkLayer = el('g', { class: 'tsld-links', 'aria-hidden': 'true' }, svg);
  LINKS.forEach(function (l) {
    l.el = el('path', {}, linkLayer);
  });

  // Bars.
  var barLayer = el('g', { class: 'tsld-bars' }, svg);
  ACTS.forEach(function (a) {
    var g = el('g', {
      class: 'bar',
      tabindex: '0',
      role: 'slider',
      'aria-orientation': 'horizontal',
      'aria-valuemin': '0',
      'aria-valuemax': String(MAX_DAY),
      'aria-label': a.name + ', duration ' + a.dur + ' days. Arrow keys move it a day at a time.',
    });
    el('rect', { x: 0, y: 0, width: a.dur * PPD, height: BAR_H, rx: 6 }, g);
    var label = el('text', { x: 10, y: 17 }, g);
    label.textContent = a.name + ' · ' + a.dur + 'd';
    barLayer.appendChild(g);
    a.el = g;
    a.x = null; // animated position, in days (float)
    a.y = null; // animated lane (float)
  });

  // Legend.
  var legend = el('g', { class: 'tsld-legend', 'aria-hidden': 'true' }, decor);
  el('rect', { x: 34, y: 344, width: 14, height: 10, rx: 3, class: 'swatch-critical' }, legend);
  var lg1 = el('text', { x: 56, y: 353 }, legend);
  lg1.textContent = 'Critical path';
  el('rect', { x: 150, y: 344, width: 14, height: 10, rx: 3, class: 'swatch-normal' }, legend);
  var lg2 = el('text', { x: 172, y: 353 }, legend);
  lg2.textContent = 'Float available';
  el('line', { x1: 292, y1: 349, x2: 322, y2: 349, class: 'legend-line' }, legend);
  var lg3 = el('text', { x: 330, y: 353 }, legend);
  lg3.textContent = 'Driving';
  el('line', { x1: 400, y1: 349, x2: 430, y2: 349, class: 'legend-line dashed' }, legend);
  var lg4 = el('text', { x: 438, y: 353 }, legend);
  lg4.textContent = 'Non-driving';

  /* ── Chrome around the sample ───────────────────────────────────── */

  var hint = document.createElement('p');
  hint.className = 'demo-hint';
  hint.innerHTML = '<span aria-hidden="true">✋</span> Try it — drag a bar and the logic re-flows';
  var reset = document.createElement('button');
  reset.type = 'button';
  reset.className = 'demo-reset';
  reset.textContent = 'Reset the plan';
  reset.hidden = true;

  var live = document.createElement('p');
  live.className = 'visually-hidden';
  live.setAttribute('aria-live', 'polite');

  var caption = document.createElement('p');
  caption.className = 'demo-caption';
  caption.id = 'demo-caption';
  caption.textContent =
    'A live sample of the canvas. Drag any bar — or focus one and use the arrow keys — ' +
    'and the schedule recomputes: successors move, the critical path re-highlights.';
  svg.setAttribute('aria-describedby', 'demo-caption');

  var figure = host.closest('.hero-figure');
  var chrome = figure.querySelector('.app-chrome');
  figure.removeAttribute('role');
  figure.removeAttribute('aria-label');
  staticSvg.remove();
  host.appendChild(svg);
  host.appendChild(hint);
  if (chrome) chrome.appendChild(reset);
  else host.appendChild(reset);
  figure.appendChild(caption);
  figure.appendChild(live);

  /* ── Rendering & animation ──────────────────────────────────────── */

  var rafId = null;

  function targets() {
    solve();
    ACTS.forEach(function (a) {
      a.tx = a.es;
      a.ty = a.lane;
      if (a.x === null) {
        a.x = a.tx;
        a.y = a.ty;
      }
    });
  }

  function paint() {
    // Bars.
    ACTS.forEach(function (a) {
      var px = X0 + a.x * PPD;
      var py = 84 + a.y * 44;
      a.el.setAttribute('transform', 'translate(' + px + ',' + py + ')');
      a.el.classList.toggle('critical', !!a.critical);
      a.el.classList.toggle('pinned', a.pin !== null);
    });
    // Links: exit the predecessor's right edge mid-height, elbow to the
    // successor's left edge mid-height.
    LINKS.forEach(function (l) {
      var p = byId[l.from];
      var s = byId[l.to];
      var x1 = X0 + p.x * PPD + p.dur * PPD;
      var y1 = 84 + p.y * 44 + BAR_H / 2;
      var x2 = X0 + s.x * PPD;
      var y2 = 84 + s.y * 44 + BAR_H / 2;
      var stub = Math.min(10, Math.max(4, (x2 - x1) / 2));
      l.el.setAttribute('d', 'M' + x1 + ' ' + y1 + 'h' + stub + 'V' + y2 + 'H' + (x2 - 6));
      l.el.setAttribute('class', (l.critical ? 'critical' : '') + (l.driving ? '' : ' dashed'));
      l.el.setAttribute('marker-end', l.critical ? 'url(#arrow-live-critical)' : 'url(#arrow-live)');
    });
  }

  // Arrowheads.
  var defs = el('defs', {}, svg);
  [
    { id: 'arrow-live', cls: 'head' },
    { id: 'arrow-live-critical', cls: 'head-critical' },
  ].forEach(function (m) {
    var marker = el(
      'marker',
      {
        id: m.id,
        viewBox: '0 0 10 10',
        refX: '8',
        refY: '5',
        markerWidth: '6',
        markerHeight: '6',
        orient: 'auto-start-reverse',
      },
      defs
    );
    el('path', { d: 'M0 0 10 5 0 10Z', class: m.cls }, marker);
  });

  function tick() {
    var settled = true;
    var ease = reducedMotion.matches ? 1 : 0.22;
    ACTS.forEach(function (a) {
      a.x += (a.tx - a.x) * ease;
      a.y += (a.ty - a.y) * ease;
      if (Math.abs(a.tx - a.x) > 0.01 || Math.abs(a.ty - a.y) > 0.005) settled = false;
      else {
        a.x = a.tx;
        a.y = a.ty;
      }
    });
    paint();
    rafId = settled ? null : requestAnimationFrame(tick);
  }

  function schedule() {
    targets();
    if (rafId === null) rafId = requestAnimationFrame(tick);
  }

  /* ── Announcements ──────────────────────────────────────────────── */

  var announceTimer = null;

  function announce(act) {
    clearTimeout(announceTimer);
    announceTimer = setTimeout(function () {
      var end = solve();
      var path = ACTS.filter(function (a) {
        return a.critical;
      })
        .sort(function (a, b) {
          return a.es - b.es;
        })
        .map(function (a) {
          return a.name;
        })
        .join(', ');
      live.textContent =
        act.name +
        ' now starts ' +
        dayLabel(act.es) +
        '. The project finishes ' +
        dayLabel(end) +
        '. Critical path: ' +
        path +
        '.';
    }, 350);
  }

  function markDirty() {
    var dirty = ACTS.some(function (a) {
      return a.pin !== null || a.lane !== a.homeLane;
    });
    reset.hidden = !dirty;
  }

  function updateAria(act) {
    act.el.setAttribute('aria-valuenow', String(act.es));
    act.el.setAttribute(
      'aria-valuetext',
      'starts ' + dayLabel(act.es) + (act.critical ? ', on the critical path' : ', ' + act.float + ' days float')
    );
  }

  function refreshAria() {
    ACTS.forEach(updateAria);
  }

  /* ── Pointer interaction ────────────────────────────────────────── */

  var drag = null;

  ACTS.forEach(function (a) {
    a.el.addEventListener('pointerdown', function (ev) {
      ev.preventDefault();
      a.el.setPointerCapture(ev.pointerId);
      var scale = svg.getBoundingClientRect().width / 760;
      drag = {
        act: a,
        startX: ev.clientX,
        startY: ev.clientY,
        baseDay: a.es,
        baseLane: a.lane,
        scale: scale,
      };
      hint.classList.add('is-done');
      a.el.classList.add('dragging');
    });

    a.el.addEventListener('pointermove', function (ev) {
      if (!drag || drag.act !== a) return;
      var days = (ev.clientX - drag.startX) / (PPD * drag.scale);
      var lanes = (ev.clientY - drag.startY) / (44 * drag.scale);
      var want = Math.round(drag.baseDay + days);
      a.pin = Math.max(0, Math.min(MAX_DAY - a.dur, want));
      a.lane = Math.max(0, Math.min(ROWS.length - 1, Math.round(drag.baseLane + lanes)));
      schedule();
    });

    function endDrag() {
      if (!drag || drag.act !== a) return;
      a.el.classList.remove('dragging');
      // A pin at or left of what logic dictates does nothing — clear it, and
      // the bar springs back to its logic-driven start. Logic wins.
      if (a.pin !== null && a.pin <= logicStart(a)) a.pin = null;
      drag = null;
      schedule();
      refreshAria();
      announce(a);
      markDirty();
    }

    a.el.addEventListener('pointerup', endDrag);
    a.el.addEventListener('pointercancel', endDrag);

    /* Keyboard: a day at a time; Home clears the pin. */
    a.el.addEventListener('keydown', function (ev) {
      var handled = true;
      if (ev.key === 'ArrowRight') {
        a.pin = Math.min(MAX_DAY - a.dur, (a.pin === null ? a.es : a.pin) + 1);
      } else if (ev.key === 'ArrowLeft') {
        var next = (a.pin === null ? a.es : a.pin) - 1;
        a.pin = next <= logicStart(a) ? null : next;
      } else if (ev.key === 'ArrowDown') {
        a.lane = Math.min(ROWS.length - 1, a.lane + 1);
      } else if (ev.key === 'ArrowUp') {
        a.lane = Math.max(0, a.lane - 1);
      } else if (ev.key === 'Home') {
        a.pin = null;
        a.lane = a.homeLane;
      } else {
        handled = false;
      }
      if (handled) {
        ev.preventDefault();
        hint.classList.add('is-done');
        schedule();
        refreshAria();
        announce(a);
        markDirty();
      }
    });
  });

  reset.addEventListener('click', function () {
    ACTS.forEach(function (a) {
      a.pin = null;
      a.lane = a.homeLane;
    });
    schedule();
    refreshAria();
    markDirty();
    live.textContent = 'Plan reset to the original schedule.';
  });

  /* ── First paint ────────────────────────────────────────────────── */

  schedule();
  refreshAria();

  // Draw the logic on with a dash sweep once, then leave clean lines.
  if (!reducedMotion.matches) {
    svg.classList.add('draw-on');
    setTimeout(function () {
      svg.classList.remove('draw-on');
    }, 1400);
  }
})();
