(function () {
  // Filtre qui rend le blanc du logo transparent (alpha = 3·A − R − G − B, couleurs et transparence d'origine conservées)
  var kn = document.createElementNS('http://www.w3.org/2000/svg', 'svg');
  kn.setAttribute('width', '0'); kn.setAttribute('height', '0'); kn.setAttribute('aria-hidden', 'true');
  kn.style.position = 'absolute';
  kn.innerHTML = '<filter id="lb-knockout" color-interpolation-filters="sRGB"><feColorMatrix type="matrix" values="1 0 0 0 0  0 1 0 0 0  0 0 1 0 0  -1 -1 -1 3 0"/></filter>';
  document.body.appendChild(kn);

  // Année du pied de page
  var y = document.getElementById('y'); if (y) y.textContent = new Date().getFullYear();

  // Menu déroulant : sur mobile, le premier appui sur un menu l'ouvre
  document.querySelectorAll('.has-drop > a').forEach(function (a) {
    a.addEventListener('click', function (e) {
      if (window.innerWidth <= 1180) {
        var li = a.parentElement;
        if (!li.classList.contains('open')) { e.preventDefault(); li.classList.add('open'); }
      }
    });
  });

  // Menu mobile : état annoncé, fermeture par Échap, clic extérieur ou choix d'un lien
  var burger = document.querySelector('.burger'), navUl = document.querySelector('.nav>ul');
  if (burger && navUl) {
    burger.setAttribute('aria-expanded', 'false');
    burger.addEventListener('click', function () {
      var open = navUl.classList.contains('open');
      burger.setAttribute('aria-expanded', String(open)); burger.textContent = open ? '✕' : '☰';
    });
    function closeNav(focusBack) {
      if (!navUl.classList.contains('open')) return;
      navUl.classList.remove('open'); burger.setAttribute('aria-expanded', 'false'); burger.textContent = '☰';
      document.querySelectorAll('.has-drop.open').forEach(function (li) { li.classList.remove('open'); });
      if (focusBack) burger.focus();
    }
    document.addEventListener('keydown', function (e) { if (e.key === 'Escape') closeNav(true); });
    document.addEventListener('click', function (e) { if (!e.target.closest('.nav')) closeNav(false); });
    navUl.addEventListener('click', function (e) { var a = e.target.closest('a'); if (a && !e.defaultPrevented) closeNav(false); });
  }

  // Barre de progression de lecture + en-tête compact + bouton "haut de page"
  var bar = document.createElement('div'); bar.className = 'progress'; document.body.appendChild(bar);
  var onIndex = !!document.getElementById('contact');
  var devisHref = onIndex ? '#contact' : 'index.html#contact';
  var fab = document.createElement('div'); fab.className = 'fab';
  fab.innerHTML =
    '<button class="fab-top" aria-label="Revenir en haut"><svg viewBox="0 0 24 24"><path d="M12 19V5M5 12l7-7 7 7"/></svg></button>' +
    '<a class="fab-tel" href="tel:+33143424192" aria-label="Appeler le 01 43 42 41 92"><svg viewBox="0 0 24 24"><path d="M22 16.9v3a2 2 0 0 1-2.2 2 19.8 19.8 0 0 1-8.6-3.1 19.5 19.5 0 0 1-6-6A19.8 19.8 0 0 1 2.1 4.2 2 2 0 0 1 4.1 2h3a2 2 0 0 1 2 1.7c.1.9.4 1.8.7 2.7a2 2 0 0 1-.5 2.1L8 9.8a16 16 0 0 0 6 6l1.3-1.3a2 2 0 0 1 2.1-.4c.9.3 1.8.6 2.7.7a2 2 0 0 1 1.7 2z"/></svg></a>' +
    '<a class="fab-devis" href="' + devisHref + '" data-tab="devis"><svg viewBox="0 0 24 24"><path d="M14 3H6a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V9z"/><path d="M14 3v6h6M8 13h8M8 17h5"/></svg><span>Devis gratuit</span></a>';
  document.body.appendChild(fab);
  fab.querySelector('.fab-top').addEventListener('click', function () { window.scrollTo({ top: 0, behavior: 'smooth' }); });
  var header = document.querySelector('header');
  function onScroll() {
    var h = document.documentElement, max = h.scrollHeight - h.clientHeight;
    bar.style.width = (max > 0 ? (h.scrollTop / max) * 100 : 0) + '%';
    if (header) header.classList.toggle('scrolled', h.scrollTop > 40);
    fab.classList.toggle('show-top', h.scrollTop > 600);
  }
  window.addEventListener('scroll', onScroll, { passive: true }); onScroll();

  // Animations d'apparition (avec repli : tout s'affiche si l'animation n'est pas prise en charge)
  var els = document.querySelectorAll('.reveal');
  if (!('IntersectionObserver' in window)) { els.forEach(function (el) { el.classList.add('visible'); }); return; }
  var obs = new IntersectionObserver(function (es) {
    es.forEach(function (e) { if (e.isIntersecting) { e.target.classList.add('visible'); obs.unobserve(e.target); } });
  }, { threshold: .12 });
  els.forEach(function (el) { obs.observe(el); });
  setTimeout(function () { els.forEach(function (el) { el.classList.add('visible'); }); }, 2000);
})();

// Univers immersif : travelling caméra vers la bulle, traversée, puis arrivée dans une scène 3D avec les produits
(function () {
  if (!document.querySelector('.hexes') && !document.querySelector('.bubble')) return;
  var reduce = window.matchMedia && matchMedia('(prefers-reduced-motion: reduce)').matches;
  if (!Element.prototype.animate) return;
  var DOLLY = 'cubic-bezier(.55,0,.75,.2)';  // la caméra s'élance (accélération)
  var LAND = 'cubic-bezier(.16,1,.3,1)';     // la caméra se pose (longue décélération)
  var P = 1200;                               // distance focale de la perspective
  var SEL = '.hexes a.hex, .hexes a.hex-label, .bubble a.hexbig';
  var cache = {};
  // Univers disposant d'un travelling 3D rendu dans Blender (outils-3d/univers.py) : assets/univers/<nom>.mp4 + .jpg
  var VIDEOS = { 'securite': 5, 'solutions-it': 3.5, 'telephonie-reseaux': 3.5, 'impression-ged': 3.5, 'multimedia': 3.5, 'point-de-vente': 3.5, 'communication': 3.5 };   // durée en secondes
  function slug(href) { return (href || '').split('/').pop().replace(/\.html.*$/, ''); }

  function txt(root, sel) { var n = root.querySelector(sel); return n ? n.textContent.trim() : ''; }
  function load(href) {
    if (!cache[href]) cache[href] = fetch(href).then(function (r) { if (!r.ok) throw 0; return r.text(); }).then(function (html) {
      var d = new DOMParser().parseFromString(html, 'text/html'), ph = d.querySelector('.photo-hero');
      var m = ph && (ph.getAttribute('style') || '').match(/url\(['"]?([^'")]+)/);
      return { bg: m && m[1], sub: txt(d, '.photo-hero .sub'), lead: txt(d, '.photo-hero .lead'),
        items: [].map.call(d.querySelectorAll('.sol-card'), function (c) { var im = c.querySelector('img'); return { href: c.getAttribute('href'), img: im && im.getAttribute('src'), t: txt(c, 'h3'), p: txt(c, 'p') }; }) };
    }).catch(function () { return null; });
    return cache[href];
  }
  // Préchargement dès le survol : la scène est prête avant que la caméra n'arrive
  document.addEventListener('pointerover', function (e) { var a = e.target.closest && e.target.closest(SEL); if (a) load(a.getAttribute('href')); });

  var cur = null;
  document.addEventListener('click', function (e) {
    var a = e.target.closest && e.target.closest(SEL);
    if (!a || cur || e.button !== 0 || e.metaKey || e.ctrlKey || e.shiftKey || e.altKey) return;
    e.preventDefault();
    var shape = a.classList.contains('hex-label') ? a.parentElement.querySelector('a.hex') : a;
    var wrap = shape.closest('.hex-wrap') || shape.closest('.bubble');
    var lab = wrap && (wrap.querySelector('.hex-label') || wrap.querySelector('h3'));
    var img = shape.querySelector('img');
    var fallback = [].map.call(wrap ? wrap.querySelectorAll('.hex-menu a, .bubble-menu a') : [], function (l) { return { href: l.getAttribute('href'), t: l.textContent.trim(), p: '' }; });
    open({ a: a, shape: shape, wrap: wrap, href: a.getAttribute('href'), title: lab ? lab.textContent.trim() : (img && img.alt) || '', img: img && (img.currentSrc || img.src), fallback: fallback });
  });

  function open(o) {
    var vw = innerWidth, vh = innerHeight, r = o.shape.getBoundingClientRect();
    var cx = r.left + r.width / 2, cy = r.top + r.height / 2;
    var D = reduce ? 0 : 1000, t0 = performance.now();
    var dep = [], uni = [];
    cur = { o: o, dep: dep, uni: uni, closing: false };

    // --- La scène d'arrivée ---
    var u = document.createElement('div'); u.className = 'uni';
    u.setAttribute('role', 'dialog'); u.setAttribute('aria-modal', 'true'); u.setAttribute('aria-label', 'Univers ' + o.title);
    u.innerHTML =
      '<div class="uni-world"><div class="uni-cam">' +
        '<div class="uni-bg"></div><div class="uni-floor"></div>' +
        '<div class="uni-scene"><div class="uni-head"><small>Univers</small><h2></h2><p class="uni-sub"></p><p class="uni-lead"></p></div>' +
        '<div class="uni-cards"></div>' +
        '<div class="uni-actions"><a class="btn btn-primary uni-page"></a><a class="btn btn-outline light" href="#contact" data-tab="devis">Demander un devis</a></div></div>' +
      '</div></div>' +
      '<div class="uni-bars" aria-hidden="true"><i></i><i></i></div>' +
      '<button class="uni-close" type="button" aria-label="Revenir à l\'accueil"><svg viewBox="0 0 24 24"><path d="M15 18l-6-6 6-6"/></svg><span>Retour</span></button>';
    var world = u.querySelector('.uni-world'), cam = u.querySelector('.uni-cam'), scene = u.querySelector('.uni-scene'),
        bg = u.querySelector('.uni-bg'), floor = u.querySelector('.uni-floor'), bars = u.querySelectorAll('.uni-bars i'),
        btn = u.querySelector('.uni-close'), box = u.querySelector('.uni-cards');
    u.querySelector('h2').textContent = o.title;
    var pg = u.querySelector('.uni-page'); pg.href = o.href; pg.textContent = 'Tout l\'univers ' + o.title + ' →';
    bg.style.backgroundImage = 'url("' + o.img + '")';
    // Travelling vidéo de l'univers, s'il existe
    var nom = slug(o.href), vdur = VIDEOS[nom] || 0, vid = null;
    if (vdur) {
      bg.classList.add('has-video'); bg.style.backgroundImage = 'url("assets/univers/' + nom + '.jpg")';
      u.querySelector('.uni-floor').style.display = 'none';
      if (!reduce) {
        vid = document.createElement('video');
        vid.muted = true; vid.playsInline = true; vid.preload = 'auto'; vid.setAttribute('aria-hidden', 'true');
        vid.src = 'assets/univers/' + nom + '.mp4';
        bg.appendChild(vid);
      } else bg.classList.add('settled');
    }
    // Le fond vidéo sort de l'espace 3D : toujours derrière le contenu, jamais au même plan
    if (vdur) { u.insertBefore(bg, world); world.classList.add('over-video'); }
    document.body.appendChild(u);
    document.documentElement.classList.add('uni-open');
    cur.u = u;

    function an(list, el, kf, opt) { if (!el) return null; var x = el.animate(kf, Object.assign({ fill: 'both' }, opt)); list.push(x); return x; }

    // --- Départ : la caméra fonce vers la bulle ---
    var stage = o.shape.closest('.hero') || o.shape.closest('section') || document.body;
    cur.stage = stage;
    if (!reduce) {
      var sr = stage.getBoundingClientRect(), dx = vw / 2 - cx, dy = vh / 2 - cy, tilt = (cx - vw / 2) / vw * 16;
      stage.style.transformOrigin = (cx - sr.left) + 'px ' + (cy - sr.top) + 'px';
      stage.style.position = 'relative'; stage.style.zIndex = '60';
      // Décalage compensé par la perspective : la bulle glisse vers le centre de l'écran pendant l'approche
      function k(z, f) { var s = (P - z) / P; return 'perspective(' + P + 'px) translate3d(' + dx * f * s + 'px,' + dy * f * s + 'px,' + z + 'px) rotateY(' + (-tilt * (f < 1 ? Math.sin(f * Math.PI) : 0)) + 'deg)'; }
      // Le grossissement perspectif (P / (P − z)) accélère déjà de lui-même : courbe douce, la caméra est « dans » la bulle à ~60 %
      an(dep, stage, [{ transform: k(0, 0) }, { transform: k(420, .55), offset: .35 }, { transform: k(1140, 1) }], { duration: D, easing: 'cubic-bezier(.45,0,.2,1)' });
      // Les autres bulles filent sur les côtés, floues (profondeur de champ)
      [].forEach.call(stage.querySelectorAll('.hex-wrap, .bubble'), function (w) {
        if (w === o.wrap) return;
        var q = w.getBoundingClientRect(), vx = q.left + q.width / 2 - cx, vy = q.top + q.height / 2 - cy, l = Math.hypot(vx, vy) || 1;
        an(dep, w, [{ transform: 'translate(0,0)', filter: 'blur(0px)', opacity: 1 }, { transform: 'translate(' + vx / l * 280 + 'px,' + vy / l * 280 + 'px)', filter: 'blur(12px)', opacity: 0 }], { duration: D * .75, easing: DOLLY });
      });
      [].forEach.call(stage.querySelectorAll('.hero-grid > *, .section-head, .orbits, .slogan'), function (el) {
        if (el.contains(o.shape)) return;
        an(dep, el, [{ filter: 'blur(0px)', opacity: 1 }, { filter: 'blur(14px)', opacity: 0 }], { duration: D * .6, easing: 'ease-in' });
      });
      // On traverse la bulle comme une vitre
      an(dep, o.shape, [{ opacity: 1, filter: 'blur(0px)' }, { opacity: 1, filter: 'blur(0px)', offset: .5 }, { opacity: 0, filter: 'blur(18px)', offset: .8 }, { opacity: 0, filter: 'blur(18px)' }], { duration: D, easing: 'linear' });
      if (o.wrap) [].forEach.call(o.wrap.querySelectorAll('.hex-label, h3, p, .go, .num'), function (el) { an(dep, el, [{ opacity: 1 }, { opacity: 0 }], { duration: D * .3 }); });
      [].forEach.call(document.querySelectorAll('header, .topband'), function (el) { an(dep, el, [{ opacity: 1, transform: 'none' }, { opacity: 0, transform: 'translateY(-20px)' }], { duration: D * .5, easing: 'ease-in' }); });
      // Bandes cinéma
      [].forEach.call(bars, function (b) { an(uni, b, [{ transform: 'scaleY(0)' }, { transform: 'scaleY(1)' }], { duration: 500, easing: LAND }); });
    }

    // --- Arrivée : la caméra se pose dans l'univers ---
    var A = reduce ? 0 : D * .58;
    // Avec une vidéo, le contenu arrive pendant que la caméra filmée se pose (vers 70 % du trajet)
    var S = vid ? A + vdur * 1000 * .7 : A;
    an(uni, world, [{ opacity: 0 }, { opacity: 1 }], { duration: reduce ? 250 : 520, delay: A, easing: 'ease-out' });
    if (vdur) an(uni, bg, [{ opacity: 0 }, { opacity: 1 }], { duration: reduce ? 250 : 520, delay: A, easing: 'ease-out' });
    if (vid) {
      vid.addEventListener('error', function () {
        // Vidéo absente ou illisible : on retombe sur l'image de rendu, ou à défaut la photo de la bulle
        var t = new Image(); t.onerror = function () { bg.style.backgroundImage = 'url("' + o.img + '")'; }; t.src = 'assets/univers/' + nom + '.jpg';
        vid.remove(); bg.classList.add('settled');
      });
      setTimeout(function () { if (cur && cur.u === u) { var p = vid.play(); if (p && p.catch) p.catch(function () { bg.classList.add('settled'); }); } }, A);
      vid.addEventListener('ended', function () { bg.classList.add('settled'); });
      setTimeout(function () { bg.classList.add('settled'); }, S);
    }
    if (!reduce) {
      an(uni, scene, [{ transform: 'translateZ(-1700px)', filter: 'blur(14px)', opacity: 0 }, { opacity: 1, offset: .25 }, { transform: 'translateZ(0px)', filter: 'blur(0px)', opacity: 1 }], { duration: 1500, delay: S, easing: LAND });
      if (!vid) {
        an(uni, bg, [{ transform: 'translateZ(-1300px) scale(2.5)' }, { transform: 'translateZ(-600px) scale(1.75)' }], { duration: 1700, delay: A, easing: LAND });
        an(uni, floor, [{ backgroundPosition: '0 -720px' }, { backgroundPosition: '0 0px' }], { duration: 1700, delay: A, easing: LAND });
      }
      [].forEach.call(bars, function (b) { an(uni, b, [{ transform: 'scaleY(1)' }, { transform: 'scaleY(0)' }], { duration: 700, delay: S + 1100, easing: LAND }); });
    }
    an(uni, btn, [{ opacity: 0, transform: 'translateX(-10px)' }, { opacity: 1, transform: 'none' }], { duration: 400, delay: A + (reduce ? 0 : 900), easing: LAND });
    var arriveAt = t0 + S + (reduce ? 0 : 420);

    // --- Produits : en arc autour du spectateur, arrivent depuis la profondeur ---
    function fill(d) {
      if (!cur || cur.u !== u) return;
      if (d) {
        if (d.bg && !vdur) bg.style.backgroundImage = 'url("' + d.bg + '")';
        u.querySelector('.uni-sub').textContent = d.sub; u.querySelector('.uni-lead').textContent = d.lead;
      }
      var items = d && d.items.length ? d.items : o.fallback;
      var w = innerWidth, n = items.length;
      var cols = w < 760 ? 1 : w < 1100 ? Math.min(n, 2) : Math.min(n, n === 4 ? 4 : 3);
      box.style.setProperty('--cols', cols);
      var wait = Math.max(0, arriveAt - performance.now());
      items.forEach(function (it, i) {
        var c = document.createElement('a'); c.className = 'uc'; c.href = it.href;
        var off = cols > 1 ? (i % cols) - (cols - 1) / 2 : 0;
        c.style.transform = 'translateZ(' + Math.abs(off) * 60 + 'px) rotateY(' + (-off * 10) + 'deg)';
        c.innerHTML = '<div class="uc-in">' + (it.img ? '<div class="uc-img"><img alt=""></div>' : '') + '<div class="uc-body"><b></b><p></p><span>Découvrir →</span></div></div>';
        if (it.img) c.querySelector('img').src = it.img;
        c.querySelector('b').textContent = it.t; c.querySelector('p').textContent = it.p || '';
        box.appendChild(c);
        if (!reduce) an(uni, c.firstChild, [{ opacity: 0, transform: 'translateZ(-600px) translateY(40px)' }, { opacity: 1, transform: 'none' }], { duration: 1000, delay: wait + 380 + i * 90, easing: LAND, fill: 'backwards' });
      });
    }
    load(o.href).then(fill);

    // --- Caméra à l'épaule : suit doucement la souris ---
    var tx = 0, ty = 0, rx = 0, ry = 0, raf = 0;
    function loop() { rx += (tx - rx) * .06; ry += (ty - ry) * .06; cam.style.transform = 'rotateX(' + rx.toFixed(3) + 'deg) rotateY(' + ry.toFixed(3) + 'deg)'; raf = Math.abs(tx - rx) + Math.abs(ty - ry) > .01 ? requestAnimationFrame(loop) : 0; }
    if (!reduce) u.addEventListener('pointermove', function (e) {
      if (e.pointerType !== 'mouse') return;
      ty = (e.clientX / innerWidth - .5) * 5; tx = -(e.clientY / innerHeight - .5) * 3.5;
      if (!raf) raf = requestAnimationFrame(loop);
    });

    btn.addEventListener('click', function () { requestClose(); });
    u.addEventListener('click', function (e) {
      var l = e.target.closest('a[href^="#"]'); if (!l) return;
      e.preventDefault(); var h = l.getAttribute('href'); requestClose(function () { var t = document.querySelector(h); if (t) t.scrollIntoView({ behavior: reduce ? 'auto' : 'smooth' }); });
    });
    history.pushState({ uni: 1 }, '', '#univers');
    setTimeout(function () { if (cur && cur.u === u) btn.focus({ preventScroll: true }); }, A + 400);
  }

  // Le bouton « précédent » du navigateur ferme aussi l'univers
  var after = null;
  function requestClose(fn) { after = fn || null; if (history.state && history.state.uni) history.back(); else doClose(); }
  addEventListener('popstate', function () { if (cur) doClose(); });
  document.addEventListener('keydown', function (e) { if (e.key === 'Escape' && cur && !cur.closing) requestClose(); });

  function doClose() {
    if (!cur || cur.closing) return;
    var c = cur, u = c.u; c.closing = true;
    var scene = u.querySelector('.uni-scene'), world = u.querySelector('.uni-world');
    // Repart de la position affichée (interruptible), puis la caméra recule par le même chemin
    c.uni.forEach(function (a) { try { a.commitStyles(); } catch (err) {} a.cancel(); });
    var out = reduce ? 0 : 650;
    if (!reduce) scene.animate([{ transform: 'translateZ(-1700px)', filter: 'blur(14px)' }], { duration: out, easing: DOLLY, fill: 'forwards' });
    [world, u.querySelector('.uni-bg')].forEach(function (el) { if (el) el.animate([{ opacity: 0 }], { duration: reduce ? 200 : 420, delay: reduce ? 0 : 260, easing: 'ease-in', fill: 'forwards' }); });
    var v = u.querySelector('video'); if (v) v.pause();
    u.querySelector('.uni-close').animate([{ opacity: 0 }], { duration: 200, fill: 'forwards' });
    setTimeout(function () { c.dep.forEach(function (a) { a.reverse(); }); }, reduce ? 0 : 320);
    var total = reduce ? 220 : 320 + 1000;
    setTimeout(function () {
      c.dep.forEach(function (a) { a.cancel(); });
      if (c.stage) { c.stage.style.transformOrigin = ''; c.stage.style.position = ''; c.stage.style.zIndex = ''; }
      u.remove(); document.documentElement.classList.remove('uni-open');
      cur = null; c.o.a.focus({ preventScroll: true });
      if (after) { var f = after; after = null; f(); }
    }, total);
  }
})();

// Vidéos de "Notre méthode" : lecture uniquement quand elles sont à l'écran
(function () {
  var vids = document.querySelectorAll('.step-media video');
  if (!vids.length || !('IntersectionObserver' in window)) { vids.forEach(function (v) { v.play && v.play(); }); return; }
  var io2 = new IntersectionObserver(function (es) {
    es.forEach(function (e) { if (e.isIntersecting) { var p = e.target.play(); if (p && p.catch) p.catch(function () {}); } else { e.target.pause(); } });
  }, { threshold: .25 });
  vids.forEach(function (v) { io2.observe(v); });
})();
// Vitrine des métiers : rotation automatique, clic, pause au survol, vidéo active uniquement
(function () {
  var wrap = document.querySelector('.metiers-wrap'); if (!wrap) return;
  var tabs = wrap.querySelectorAll('.mt'), panels = wrap.querySelectorAll('.mp');
  var DUR = 7000, cur = 0, timer = null, start = 0, left = DUR, visible = false;
  wrap.style.setProperty('--dur', DUR / 1000 + 's');
  function vid(i) { var v = panels[i].querySelector('video'); if (v && !v.getAttribute('src') && v.dataset.src) v.src = v.dataset.src; return v; }
  function show(i) {
    tabs[cur].classList.remove('active'); tabs[cur].setAttribute('aria-selected', 'false');
    panels[cur].classList.remove('active'); var old = vid(cur); if (old) old.pause();
    cur = i;
    var t = tabs[cur]; t.classList.add('active'); t.setAttribute('aria-selected', 'true');
    if (window.innerWidth <= 1000) { var l = t.parentElement; l.scrollTo({ left: t.offsetLeft - 16, behavior: 'smooth' }); }
    var bar = t.querySelector('.mt-bar'); bar.style.animation = 'none'; void bar.offsetWidth; bar.style.animation = '';
    panels[cur].classList.add('active');
    var v = vid(cur); if (v && visible) { v.currentTime = 0; var p = v.play(); if (p && p.catch) p.catch(function () {}); }
    vid((cur + 1) % panels.length); // précharge la suivante
    schedule(DUR);
  }
  function schedule(ms) { clearTimeout(timer); left = ms; start = Date.now(); if (visible && !wrap.classList.contains('paused')) timer = setTimeout(function () { show((cur + 1) % tabs.length); }, ms); }
  tabs.forEach(function (t, i) { t.addEventListener('click', function () { if (i !== cur) show(i); else schedule(DUR); }); });
  wrap.addEventListener('mouseenter', function () { wrap.classList.add('paused'); clearTimeout(timer); left -= Date.now() - start; });
  wrap.addEventListener('mouseleave', function () { wrap.classList.remove('paused'); schedule(Math.max(left, 800)); });
  if ('IntersectionObserver' in window) {
    new IntersectionObserver(function (es) {
      visible = es[0].isIntersecting; var v = vid(cur);
      if (visible) { if (v) { var p = v.play(); if (p && p.catch) p.catch(function () {}); } schedule(DUR); }
      else { if (v) v.pause(); clearTimeout(timer); }
    }, { threshold: .3 }).observe(wrap);
  } else { visible = true; show(0); }
})();

// Agrandissement des photos (galerie des installations)
(function () {
  var lb = document.querySelector('.lightbox'); if (!lb) return;
  var img = lb.querySelector('img');
  document.querySelectorAll('.gallery a').forEach(function (a) {
    a.addEventListener('click', function (e) { e.preventDefault(); img.src = a.getAttribute('href'); img.alt = a.querySelector('img').alt; lb.hidden = false; });
  });
  function close() { lb.hidden = true; }
  lb.addEventListener('click', function (e) { if (e.target !== img) close(); });
  document.addEventListener('keydown', function (e) { if (e.key === 'Escape') close(); });
})();
// Recherche sur le site (Ctrl+K ou bouton loupe)
(function () {
  var data = window.SEARCH_INDEX || []; var btns = document.querySelectorAll('.search-btn'); if (!btns.length) return;
  var box = document.createElement('div'); box.className = 'sbox'; box.hidden = true;
  box.innerHTML = '<div class="sbox-panel" role="dialog" aria-label="Recherche"><label class="sbox-field"><svg viewBox="0 0 24 24"><circle cx="11" cy="11" r="7"/><path d="m20 20-3.5-3.5"/></svg><input id="sbox-q" type="search" placeholder="Rechercher une solution : caisse, caméra, Wi-Fi, copieur…" autocomplete="off"><kbd>Échap</kbd></label><div class="sbox-list" role="listbox"></div></div>';
  document.body.appendChild(box);
  var input = box.querySelector('input'), list = box.querySelector('.sbox-list'), sel = 0, links = [];
  function norm(s) { return (s || '').toLowerCase().normalize('NFD').replace(/[̀-ͯ]/g, ''); }
  data.forEach(function (d) { d._t = norm(d.t); d._all = norm(d.t + ' ' + d.d + ' ' + d.g + ' ' + d.k); });
  function hl(text, words) { var out = text; words.forEach(function (w) { if (!w) return; var n = norm(out), i = n.indexOf(w); if (i > -1) out = out.slice(0, i) + '<mark>' + out.slice(i, i + w.length) + '</mark>' + out.slice(i + w.length); }); return out; }
  var tips = ['Caisse enregistreuse', 'Vidéosurveillance', 'Wi-Fi', 'Photocopieur', 'Location', 'Infogérance'];
  function render() {
    var q = norm(input.value.trim()); list.innerHTML = ''; links = []; sel = 0;
    if (!q) { list.innerHTML = '<div class="sbox-hint">Suggestions : ' + tips.map(function (t) { return '<button type="button">' + t + '</button>'; }).join('') + '</div>';
      list.querySelectorAll('button').forEach(function (b) { b.onclick = function () { input.value = b.textContent; render(); input.focus(); }; }); return; }
    var words = q.split(/\s+/);
    var res = data.map(function (d) { var s = 0; for (var i = 0; i < words.length; i++) { var w = words[i]; if (d._all.indexOf(w) < 0) return null; s += d._t.indexOf(w) === 0 ? 10 : d._t.indexOf(w) > -1 ? 6 : 1; } return { d: d, s: s }; })
      .filter(Boolean).sort(function (a, b) { return b.s - a.s; }).slice(0, 10);
    if (!res.length) { list.innerHTML = '<div class="sbox-empty">Aucun résultat pour « ' + input.value.replace(/</g, '&lt;') + ' ». Essayez un autre mot, ou <a href="' + (document.getElementById('contact') ? '#contact' : 'index.html#contact') + '" style="color:var(--blue);font-weight:700">demandez-nous directement</a>.</div>'; return; }
    res.forEach(function (r, i) { var a = document.createElement('a'); a.href = r.d.u; a.className = i === 0 ? 'on' : ''; a.setAttribute('role', 'option');
      a.innerHTML = '<span><b>' + hl(r.d.t, words) + '</b><small>' + r.d.d + '</small></span><span class="sg">' + r.d.g + '</span>';
      a.addEventListener('click', close); list.appendChild(a); links.push(a); });
  }
  function move(k) { if (!links.length) return; links[sel].className = ''; sel = (sel + k + links.length) % links.length; links[sel].className = 'on'; links[sel].scrollIntoView({ block: 'nearest' }); }
  function open() { box.hidden = false; document.body.style.overflow = 'hidden'; input.value = ''; render(); setTimeout(function () { input.focus(); }, 30); }
  function close() { box.hidden = true; document.body.style.overflow = ''; }
  btns.forEach(function (b) { b.addEventListener('click', open); });
  input.addEventListener('input', render);
  input.addEventListener('keydown', function (e) { if (e.key === 'ArrowDown') { e.preventDefault(); move(1); } else if (e.key === 'ArrowUp') { e.preventDefault(); move(-1); } else if (e.key === 'Enter' && links[sel]) { e.preventDefault(); close(); location.href = links[sel].href; } });
  box.addEventListener('click', function (e) { if (e.target === box || e.target.tagName === 'KBD') close(); });
  document.addEventListener('keydown', function (e) { if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === 'k') { e.preventDefault(); box.hidden ? open() : close(); } else if (e.key === 'Escape' && !box.hidden) close(); });
})();
// Mots-clés tapés automatiquement dans les barres de recherche
(function () {
  var els = document.querySelectorAll('.tw'); if (!els.length) return;
  var words = ['caisse enregistreuse', 'vidéosurveillance', 'Wi-Fi pour mon restaurant', 'photocopieur en location', 'standard téléphonique', 'contrôle d\'accès par badge', 'borne de commande', 'infogérance', 'écran interactif'];
  if (window.matchMedia && matchMedia('(prefers-reduced-motion: reduce)').matches) { els.forEach(function (e) { e.textContent = words[0]; }); return; }
  var w = 0, i = 0, del = false;
  function tick() {
    var word = words[w];
    i += del ? -1 : 1;
    els.forEach(function (e) { e.textContent = word.slice(0, i); });
    var wait = del ? 35 : 75;
    if (!del && i === word.length) { del = true; wait = 1600; }
    else if (del && i === 0) { del = false; w = (w + 1) % words.length; wait = 350; }
    setTimeout(tick, wait);
  }
  tick();
})();
