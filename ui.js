/* GR DARBI — ziņas sastādīšana (SMS / e-pasts / kopēšana) un piesaistītā zvana josla.
   Nestrādā ar GSAP un neko negaida: bez šī faila saites tik un tā atver tukšu veidni. */
(function () {
  'use strict';
  var TEL = '+37127160478', MAIL = 'ggghirts51@inbox.lv';
  var q = function (s, r) { return (r || document).querySelector(s); };
  var qa = function (s, r) { return Array.prototype.slice.call((r || document).querySelectorAll(s)); };

  /* ---------- ziņa ---------- */
  var picks = qa('#pick button'), fWhat = q('#fWhat'), fWhere = q('#fWhere'), fArea = q('#fArea');
  var out = q('#msgOut'), status = q('#status'), levelTxt = q('#levelTxt'), bubble = q('#bubble'), copyBtn = q('#copyBtn');

  function clean(v) { return (v || '').replace(/\s+/g, ' ').trim(); }
  function state() {
    var kas = picks.filter(function (b) { return b.getAttribute('aria-pressed') === 'true'; }).map(function (b) { return b.getAttribute('data-v'); });
    return { kas: kas, what: clean(fWhat && fWhat.value), where: clean(fWhere && fWhere.value), area: clean(fArea && fArea.value).replace(/\s*m(2|²)$/i, '') };
  }
  function text(st) {
    var kas = st.kas.join(', ');
    if (st.what) kas = kas ? kas + ' — ' + st.what : st.what;
    return 'Labdien!\nKas jādara: ' + kas + '\nKur' + (st.where ? ': ' + st.where : ' (pilsēta vai pagasts): ') + '\nAptuvenā platība, m²: ' + st.area;
  }
  function subject(st) {
    var bits = [st.kas.join(', '), st.where].filter(Boolean);
    return bits.length ? 'Pieteikums: ' + bits.join(' — ') : 'Pieteikums apdares darbiem';
  }
  function update() {
    var st = state(), t = text(st);
    if (out) out.textContent = t;
    var sms = 'sms:' + TEL + '?&body=' + encodeURIComponent(t);
    var mail = 'mailto:' + MAIL + '?subject=' + encodeURIComponent(subject(st)) + '&body=' + encodeURIComponent(t.replace(/\n/g, '\r\n'));
    qa('a[data-sms]').forEach(function (a) { a.href = sms; });
    qa('a[data-mail]').forEach(function (a) { a.href = mail; });
    var n = (st.kas.length || st.what ? 1 : 0) + (st.where ? 1 : 0) + (st.area ? 1 : 0);
    if (bubble) bubble.style.transform = 'translateX(' + [34, 22, 10, 0][n] + 'px)';
    if (levelTxt) levelTxt.textContent = ['Aizpildiet, cik zināt. Vai vienkārši zvaniet.', 'Vēl divas rindas, un būs līmenī.', 'Vēl viena rinda, un būs līmenī.', 'Līmenī. Var sūtīt.'][n];
    document.dispatchEvent(new CustomEvent('gr:msg', { detail: { filled: n } }));
  }
  picks.forEach(function (b) {
    b.addEventListener('click', function () {
      b.setAttribute('aria-pressed', b.getAttribute('aria-pressed') === 'true' ? 'false' : 'true');
      update();
    });
  });
  [fWhat, fWhere, fArea].forEach(function (f) { if (f) f.addEventListener('input', update); });
  update();

  /* kopēšana: noder datorā, kur sms: saite neko neatver */
  if (copyBtn && (navigator.clipboard || document.queryCommandSupported)) {
    copyBtn.hidden = false;
    var lbl = copyBtn.querySelector('span'), tm;
    copyBtn.addEventListener('click', function () {
      var t = out ? out.textContent : text(state());
      var done = function () {
        lbl.textContent = 'Nokopēts';
        if (status) status.textContent = 'Teksts nokopēts. Ielīmējiet to īsziņā uz 27160478 vai e-pastā uz ' + MAIL + '.';
        clearTimeout(tm); tm = setTimeout(function () { lbl.textContent = 'Kopēt tekstu'; }, 2400);
      };
      var legacy = function () {
        var ta = document.createElement('textarea'), ok = false;
        ta.value = t; ta.setAttribute('readonly', ''); ta.style.cssText = 'position:fixed;top:0;left:0;opacity:0';
        document.body.appendChild(ta); ta.select(); ta.setSelectionRange(0, t.length);
        try { ok = document.execCommand('copy'); } catch (e) {}
        document.body.removeChild(ta);
        copyBtn.focus({ preventScroll: true });
        if (ok) done(); else if (status) status.textContent = 'Neizdevās nokopēt — iezīmējiet tekstu un nokopējiet to.';
      };
      if (navigator.clipboard && window.isSecureContext) navigator.clipboard.writeText(t).then(done, legacy); else legacy();
    });
  }

  /* dators bez skārienekrāna: SMS poga parasti neko neatver */
  var hint = q('#hint');
  if (hint && window.matchMedia('(hover: hover) and (pointer: fine)').matches) {
    hint.textContent = 'Datorā ērtāk rakstīt e-pastu vai nokopēt tekstu. Telefonā SMS poga atvērs īsziņu ar gatavu tekstu.';
  }

  /* ---------- foto skatītājs: viss foto uz ekrāna, bez ritināšanas; bez JS saite atver failu ---------- */
  var lb = q('#lb'), links = qa('a[data-lb]');
  if (lb && typeof lb.showModal === 'function' && links.length) {
    var lbImg = q('#lbImg'), lbCap = q('#lbCap'), lbCount = q('#lbCount'), full = q('.lb__full', lb);
    var cur = 0, opener = null, sx = null;
    var show = function (i) {
      cur = (i + links.length) % links.length;
      var a = links[cur], img = a.querySelector('img'), fc = a.parentNode.querySelector('figcaption');
      lbImg.src = a.getAttribute('href');
      lbImg.alt = img ? img.alt : '';
      lbCap.textContent = fc ? fc.textContent.trim() : '';
      lbCap.hidden = !lbCap.textContent;
      lbCount.textContent = (cur + 1) + ' / ' + links.length;
      /* kaimiņu foto ielādējam iepriekš, lai pārslēgšana būtu bez gaidīšanas */
      [cur + 1, cur - 1].forEach(function (k) { var n = links[(k + links.length) % links.length]; (new Image()).src = n.getAttribute('href'); });
    };
    links.forEach(function (a, i) {
      a.addEventListener('click', function (e) {
        if (e.metaKey || e.ctrlKey || e.shiftKey || e.button === 1) return;
        e.preventDefault(); opener = a; show(i); lb.showModal();
      });
    });
    q('.lb__close', lb).addEventListener('click', function () { lb.close(); });
    q('.lb__prev', lb).addEventListener('click', function () { show(cur - 1); });
    q('.lb__next', lb).addEventListener('click', function () { show(cur + 1); });
    lb.addEventListener('keydown', function (e) {
      if (e.key === 'ArrowRight') { e.preventDefault(); show(cur + 1); }
      if (e.key === 'ArrowLeft') { e.preventDefault(); show(cur - 1); }
    });
    lb.addEventListener('click', function (e) { if (e.target === lb || e.target.classList.contains('lb__fig')) lb.close(); });
    lb.addEventListener('pointerdown', function (e) { sx = e.pointerType === 'mouse' ? null : e.clientX; });
    lb.addEventListener('pointerup', function (e) {
      if (sx === null) return;
      var dx = e.clientX - sx; sx = null;
      if (Math.abs(dx) > 50) show(cur + (dx < 0 ? 1 : -1));
    });
    lb.addEventListener('close', function () {
      if (document.fullscreenElement) document.exitFullscreen().catch(function () {});
      lbImg.src = 'data:,';
      if (opener) opener.focus({ preventScroll: true });
    });
    if (full && lb.requestFullscreen) {
      full.hidden = false;
      full.addEventListener('click', function () {
        if (document.fullscreenElement) document.exitFullscreen().catch(function () {});
        else lb.requestFullscreen().catch(function () {});
      });
    }
  }

  /* ---------- zvana josla: parādās, kad sienas zvana poga pazudusi, un paslēpjas pie kontaktiem ---------- */
  var bar = q('#callbar'), heroCall = q('#heroCall'), contacts = q('#kontakti');
  if (bar && heroCall && contacts && 'IntersectionObserver' in window) {
    var heroGone = false, contactsIn = false, footIn = false;
    var set = function () {
      var on = heroGone && !contactsIn && !footIn;
      bar.classList.toggle('show', on);
      qa('a', bar).forEach(function (a) { if (on) a.removeAttribute('tabindex'); else a.setAttribute('tabindex', '-1'); });
      document.body.style.paddingBottom = on && window.innerWidth < 1024 ? '56px' : '';
    };
    new IntersectionObserver(function (e) {
      heroGone = !e[0].isIntersecting && e[0].boundingClientRect.top < 0; set();
    }).observe(heroCall);
    new IntersectionObserver(function (e) { contactsIn = e[0].isIntersecting; set(); }, { rootMargin: '0px 0px -30% 0px' }).observe(contacts);
    window.addEventListener('resize', set);
    var foot = q('.foot');
    if (foot) new IntersectionObserver(function (e) { footIn = e[0].isIntersecting; set(); }).observe(foot);
  }
})();
