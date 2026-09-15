/* GR DARBI — kustība (tikai GSAP). Siena tiek „pabeigta“: apmetums → špaktele joslās → līmlente gar joslu → rullītis → lentes noplēšana.
   Plats ekrāns: ScrollTrigger scrub, siena ir sticky garā sliedē (augstums ielikts CSS pirms pirmā kadra, bez pin-spacer lēciena).
   Telefons un planšete: īsa secība laikā (≈2,4 s). Bez GSAP vai ar reduced-motion — gatava siena uzreiz; saites nekad netiek aizturētas. */
(function () {
  'use strict';
  var d = document.documentElement, G = window.gsap, ST = window.ScrollTrigger;
  var q = function (s, r) { return (r || document).querySelector(s); };
  var qa = function (s, r) { return Array.prototype.slice.call((r || document).querySelectorAll(s)); };
  var reduce = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  var started = d.classList.contains('wall-start');

  function finish() {
    d.classList.remove('wall-start');
    if ((window.scrollY || 0) < 8) d.classList.remove('wall-scrub');
    d.classList.add('wall-done');
  }
  if (!(G && ST)) { if (started) { clearTimeout(window.GR_FALLBACK); finish(); } return; }
  window.GR_WALL = true;
  clearTimeout(window.GR_FALLBACK);
  G.registerPlugin(ST);
  ST.config({ ignoreMobileResize: true });
  if (reduce) return;
  d.classList.add('gs');

  var wall = q('#wall'), track = q('#wallTrack');
  var bands = qa('.band', wall), strips = bands.map(function (b) { return q('.strip', b); });
  var rails = bands.map(function (b) { return q('.rail', b); }), faces = bands.map(function (b) { return q('.face', b); });
  var trowel = q('#trowel'), blade = q('#trowel svg'), roller = q('#roller'), nap = q('.nap', roller), cyl = q('.roller__cyl', roller);
  var lanes = [q('#lane'), q('#laneTop')], laneFaces = lanes.map(function (l) { return q('.lane__face', l); });
  var laneStreaks = q('#lane .streaks'), patch = q('#patch'), patchStreaks = q('.streaks', patch);
  var mtapes = qa('.mtape', wall), mclips = mtapes.map(function (m) { return q('.mtape__clip', m); }), mpaint = mtapes.map(function (m) { return q('.mtape__paint', m); });
  var stages = qa('.stage span', wall);

  var W = function () { return wall.clientWidth; };
  var H = function () { return wall.clientHeight; };

  function stageAt(tl, k, t) {
    tl.to(stages, { autoAlpha: function (i) { return i === k ? 1 : 0; }, duration: 0.14, ease: 'none' }, t);
  }

  /* viena josla: špaktele izlīdzina, lāpstiņa brauc pa priekšējo malu */
  function band(tl, i, at, dur, n, trowelSize, regionH) {
    var dir = i % 2 ? -1 : 1;
    var bh = function () { return (regionH ? regionH() : H()) / n; };
    var T = function () { return trowelSize(); };
    var at0 = at + 0.001; /* ne tieši 0: ritinot atpakaļ līdz sākumam, set tiek atcelts */
    tl.set(rails[i], { autoAlpha: 1 }, at0);
    tl.fromTo([strips[i], rails[i]], { xPercent: -100 * dir, x: 0 }, { xPercent: 0, duration: dur, ease: 'power1.inOut' }, at);
    tl.fromTo(faces[i], { xPercent: 100 * dir, x: 0 }, { xPercent: 0, duration: dur, ease: 'power1.inOut' }, at);
    tl.set(trowel, {
      autoAlpha: 1, scaleX: dir, rotation: dir * 7, transformOrigin: '50% 50%',
      y: function () { return bh() * i + bh() / 2 - T() / 2; },
      width: T, height: T
    }, at0);
    /* darba mala: SVG x=190/200 → 95 % platuma; spoguļotā — 5 % */
    tl.fromTo(trowel,
      { x: function () { return dir === 1 ? -0.95 * T() + 4 : W() - 0.05 * T() - 4; } },
      { x: function () { return dir === 1 ? W() - 0.95 * T() + 4 : -0.05 * T() - 4; }, duration: dur, ease: 'power1.inOut' }, at);
    tl.to(blade, { keyframes: { y: [0, -5, 1, 0], ease: 'sine.inOut' }, duration: dur, ease: 'none' }, at);
    tl.set(rails[i], { autoAlpha: 0 }, at + dur);
  }

  var mm = G.matchMedia();

  /* ---------- plats ekrāns: scroll-scrub ---------- */
  mm.add('(min-width: 1024px) and (min-height: 620px)', function () {
    if (!d.classList.contains('wall-start')) return;
    d.classList.add('wall-scrub');
    var N = 5;
    var patchH = function () { return patch.offsetHeight; };
    var D = function () { return H() - patchH(); };
    var laneL = function () { return lanes[0].offsetLeft; };
    var cylH = function () { return cyl.offsetHeight; };
    var trowelSize = function () { return Math.round(H() / N * 1.12); };

    G.set(rails, { autoAlpha: 0 });
    G.set(trowel, { autoAlpha: 0 });
    G.set(roller, { autoAlpha: 0 });
    G.set(stages, { autoAlpha: function (i) { return i === 0 ? 1 : 0; } });
    G.set(mtapes, { autoAlpha: 0, scaleY: 0, transformOrigin: '50% 100%' });

    var tl = G.timeline({
      defaults: { ease: 'none' },
      scrollTrigger: {
        trigger: track, start: 'top top', end: 'bottom bottom', scrub: 0.6, invalidateOnRefresh: true,
        onToggle: function (s) { wall.classList.toggle('is-live', s.isActive); }
      }
    });
    tl.set({}, {}, 0);
    for (var i = 0; i < N; i++) band(tl, i, i, 1, N, trowelSize);
    stageAt(tl, 1, 0.12);
    tl.to(trowel, { autoAlpha: 0, duration: 0.3 }, N - 0.05);

    /* 3 — lente: no parauga augšmalas līdz griestiem */
    tl.set(mtapes, { autoAlpha: 1 }, 5.25);
    tl.to(mtapes[0], { scaleY: 1, duration: 0.6, ease: 'power1.inOut' }, 5.25);
    tl.to(mtapes[1], { scaleY: 1, duration: 0.6, ease: 'power1.inOut' }, 5.5);
    tl.set(mclips, { y: D }, 5.25);
    tl.set(mpaint, { y: function () { return -D(); } }, 5.25);
    stageAt(tl, 2, 5.3);

    /* 4 — krāsa: rullītis veļ joslu uz augšu */
    tl.set(roller, { x: function () { return laneL() - 6; }, y: function () { return D() - cylH() / 2; }, rotation: 0 }, 6.1);
    tl.to(roller, { autoAlpha: 1, duration: 0.3 }, 6.1);
    stageAt(tl, 3, 6.2);
    tl.fromTo(lanes.concat(mclips), { y: D }, { y: 0, duration: 2.5, ease: 'power1.inOut' }, 6.45);
    tl.fromTo(laneFaces.concat(mpaint), { y: function () { return -D(); } }, { y: 0, duration: 2.5, ease: 'power1.inOut' }, 6.45);
    tl.fromTo(roller, { y: function () { return D() - cylH() / 2; } }, { y: function () { return -cylH() / 2; }, duration: 2.5, ease: 'power1.inOut' }, 6.45);
    tl.fromTo(nap, { y: 0 }, {
      y: function () { return -D() * 0.8; }, duration: 2.5, ease: 'power1.inOut',
      modifiers: { y: function (v) { return (((parseFloat(v) % 9) + 9) % 9 - 9).toFixed(2) + 'px'; } }
    }, 6.45);
    /* otrā kārta uz leju: sausās svītras pazūd */
    tl.to(roller, { y: function () { return H() * 0.42; }, duration: 0.8, ease: 'power1.inOut' }, 9);
    tl.to(nap, { y: '+=' + 60, duration: 0.8, ease: 'power1.inOut', modifiers: { y: function (v) { return (((parseFloat(v) % 9) + 9) % 9 - 9).toFixed(2) + 'px'; } } }, 9);
    tl.fromTo(laneStreaks, { autoAlpha: 1 }, { autoAlpha: 0, duration: 0.8 }, 9);
    tl.to(roller, { autoAlpha: 0, y: '-=50', rotation: -8, duration: 0.4 }, 9.8);

    /* lentes noplēšana — paliek taisna mala */
    tl.to(mtapes[0], { scaleY: 0, x: -10, rotation: 4, duration: 0.6, ease: 'power2.in' }, 10.2);
    tl.to(mtapes[1], { scaleY: 0, x: 10, rotation: -4, duration: 0.6, ease: 'power2.in' }, 10.4);
    tl.set(mtapes, { autoAlpha: 0 }, 11);
    stageAt(tl, 4, 10.75);
    tl.set({}, {}, 11.5);

    window.GR_TL = tl;
    return function () { d.classList.remove('wall-scrub'); wall.classList.remove('is-live'); };
  });

  /* ---------- telefons un planšete: īsa secība laikā ---------- */
  mm.add('(max-width: 1023.98px), (max-height: 619.98px)', function () {
    if (!d.classList.contains('wall-start')) return;
    var N = 3, bandsEl = q('.bands', wall);
    /* joslas tikai virs parauga: zemāk tās tik un tā sedz teksta laukums */
    var regionH = function () { return Math.round(patch.getBoundingClientRect().top - wall.getBoundingClientRect().top); };
    var setRegion = function () { bandsEl.style.setProperty('--bands-h', regionH() + 'px'); };
    bandsEl.style.setProperty('--n', N);
    setRegion();
    G.set(bands.slice(N), { display: 'none' });
    G.set(rails, { autoAlpha: 0 });
    G.set([trowel, roller], { autoAlpha: 0 });
    var trowelSize = function () { return Math.round(Math.min(regionH() / N * 1.1, 170)); };
    var tl = G.timeline({ paused: true, defaults: { ease: 'none' } });
    for (var i = 0; i < N; i++) band(tl, i, i * 0.4, 0.5, N, trowelSize, regionH);
    ST.addEventListener('refreshInit', setRegion);
    var t2 = N * 0.4 + 0.2;
    tl.to(trowel, { autoAlpha: 0, duration: 0.2 }, t2 - 0.1);
    /* rullītis pāri paraugam no augšas uz leju */
    var pr = function () { var a = patch.getBoundingClientRect(), b = wall.getBoundingClientRect(); return { x: a.left - b.left, y: a.top - b.top, w: a.width, h: a.height }; };
    tl.set(roller, { width: function () { return pr().w - 24; }, x: function () { return pr().x + 12; }, y: function () { return pr().y - 22; }, rotation: 0 }, t2);
    tl.to(roller, { autoAlpha: 1, duration: 0.18 }, t2);
    tl.to(roller, { y: function () { return pr().y + pr().h - 22; }, duration: 0.6, ease: 'power1.inOut' }, t2 + 0.12);
    tl.fromTo(nap, { y: 0 }, { y: 54, duration: 0.6, ease: 'power1.inOut', modifiers: { y: function (v) { return (((parseFloat(v) % 9) + 9) % 9 - 9).toFixed(2) + 'px'; } } }, t2 + 0.12);
    tl.fromTo(patchStreaks, { autoAlpha: 1 }, { autoAlpha: 0, duration: 0.6 }, t2 + 0.12);
    tl.to(roller, { autoAlpha: 0, y: '+=24', duration: 0.25 }, t2 + 0.72);

    window.GR_TL = tl;
    var go = function () { if (tl.progress() === 0 && !tl.isActive()) tl.play(); };
    var img = new Image(); img.src = 'img/putty.webp';
    var ready = Promise.all([img.decode ? img.decode().catch(function () {}) : Promise.resolve(), document.fonts ? document.fonts.ready : Promise.resolve()]);
    var cap = new Promise(function (r) { setTimeout(r, 1500); });
    Promise.race([ready, cap]).then(function () {
      if (wall.getBoundingClientRect().bottom < 80) { tl.progress(1); return; }
      setTimeout(go, 250);
    });
    var st = ST.create({ trigger: wall, start: 'bottom 60px', onEnter: function () { tl.progress(1); } });
    return function () { st.kill(); ST.removeEventListener('refreshInit', setRegion); bandsEl.style.removeProperty('--bands-h'); bandsEl.style.removeProperty('--n'); };
  });

  /* ---------- atklāšana zemāk: špakteles vilciens virsrakstiem, līmlentes pielīp ---------- */
  G.utils.toArray('.rv-wipe').forEach(function (el) {
    G.fromTo(el, { clipPath: 'inset(0% 100% 0% 0%)' }, {
      clipPath: 'inset(0% 0% 0% 0%)', duration: 0.7, ease: 'power2.out',
      scrollTrigger: { trigger: el, start: 'top 88%', once: true }
    });
  });
  G.utils.toArray('.ridge.rv').forEach(function (el) {
    G.fromTo(el, { scaleX: 0 }, { scaleX: 1, duration: 0.9, ease: 'power3.inOut', scrollTrigger: { trigger: el, start: 'top 92%', once: true } });
  });
  ST.batch('.chips .tape, .work__no, .ptape, .contacts__tape', {
    start: 'top 92%', once: true,
    onEnter: function (els) { G.from(els, { autoAlpha: 0, scale: 1.1, y: -6, duration: 0.36, ease: 'back.out(1.7)', stagger: 0.05, overwrite: true }); }
  });
  ST.batch('.print', {
    start: 'top 90%', once: true,
    onEnter: function (els) { G.from(els, { autoAlpha: 0, y: 16, duration: 0.55, ease: 'power2.out', stagger: 0.12, overwrite: true }); }
  });
  var big = q('.bigtel');
  if (big) G.from(big, { autoAlpha: 0, scale: 1.03, transformOrigin: '0% 60%', duration: 0.45, ease: 'power2.out', scrollTrigger: { trigger: big, start: 'top 90%', once: true } });

  window.addEventListener('load', function () { ST.refresh(); });
})();
