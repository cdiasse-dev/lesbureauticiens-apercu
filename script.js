/* Les Bureauticiens — interactions
 *
 * Envoi du formulaire : renseignez FORM_ENDPOINT avec l'URL de votre service
 * de formulaire (celui du site actuel, Formspree, votre propre API…).
 * Tant qu'il est vide, la demande s'ouvre dans la messagerie du visiteur.
 */
const FORM_ENDPOINT = ''; // ex. 'envoi.php' (le script du site actuel)
const CONTACT_EMAIL = 'direction@lesbureauticiens.com';

const $ = (s, r = document) => r.querySelector(s);
const $$ = (s, r = document) => [...r.querySelectorAll(s)];

/* ── Navigation ── */
const nav = $('#nav');
const mbar = $('#mbar');
const quote = $('#devis');
let quoteVisible = true;

const onScroll = () => {
  nav.classList.toggle('is-scrolled', scrollY > 8);
  mbar.classList.toggle('is-on', !quoteVisible);
};
addEventListener('scroll', onScroll, { passive: true });

new IntersectionObserver(([e]) => { quoteVisible = e.isIntersecting; onScroll(); }, { threshold: 0.25 }).observe(quote);

const burger = $('#burger');
const navLinks = $('#navLinks');
const setMenu = (open) => {
  navLinks.classList.toggle('is-open', open);
  burger.setAttribute('aria-expanded', open);
  burger.setAttribute('aria-label', open ? 'Fermer le menu' : 'Ouvrir le menu');
};
burger.addEventListener('click', () => setMenu(burger.getAttribute('aria-expanded') !== 'true'));
navLinks.addEventListener('click', (e) => { if (e.target.closest('a')) setMenu(false); });
addEventListener('keydown', (e) => { if (e.key === 'Escape') setMenu(false); });
document.addEventListener('pointerdown', (e) => { if (!e.target.closest('.nav')) setMenu(false); });

/* Menu « Nos métiers » (bureau) : clic, survol, Échap */
const menu = $('#menu');
const menuBtn = $('#menuBtn');
const fine = matchMedia('(hover: hover) and (pointer: fine)');
let menuTimer;
const setSub = (open) => {
  clearTimeout(menuTimer);
  menu.classList.toggle('is-open', open);
  menuBtn.setAttribute('aria-expanded', open);
};
menuBtn.addEventListener('click', () => setSub(!menu.classList.contains('is-open')));
menu.addEventListener('pointerenter', () => { if (fine.matches) setSub(true); });
menu.addEventListener('pointerleave', () => { if (fine.matches) menuTimer = setTimeout(() => setSub(false), 160); });
menu.addEventListener('focusout', (e) => { if (!menu.contains(e.relatedTarget)) setSub(false); });
addEventListener('keydown', (e) => { if (e.key === 'Escape' && menu.classList.contains('is-open')) { setSub(false); menuBtn.focus(); } });
document.addEventListener('pointerdown', (e) => { if (!e.target.closest('#menu')) setSub(false); });

/* ── Apparition au scroll ── */
const io = new IntersectionObserver((entries) => {
  entries.forEach((e) => {
    if (!e.isIntersecting) return;
    e.target.classList.add('is-in');
    io.unobserve(e.target);
  });
}, { rootMargin: '0px 0px -8% 0px', threshold: 0.08 });
$$('.reveal').forEach((el) => {
  const siblings = $$(':scope > .reveal', el.parentElement);
  const i = siblings.indexOf(el);
  if (i > 0) el.style.setProperty('--d', `${Math.min(i, 5) * 70}ms`);
  io.observe(el);
});

/* ── Devis en 3 étapes ── */
const form = $('#quoteForm');
const steps = $$('.step', form);
const nextBtn = $('#nextBtn');
const prevBtn = $('#prevBtn');
const done = $('#quoteDone');
let current = 0;

const showStep = (i, back = false) => {
  current = i;
  steps.forEach((s, n) => {
    s.classList.toggle('is-active', n === i);
    s.classList.toggle('back', back && n === i);
  });
  $('#quoteTitle').textContent = steps[i].dataset.title;
  $('#quoteCount').textContent = `${i + 1} / ${steps.length}`;
  $('#progressBar').style.transform = `scaleX(${(i + 1) / steps.length})`;
  prevBtn.hidden = i === 0;
  nextBtn.firstChild.textContent = i === steps.length - 1 ? 'Recevoir mon devis ' : 'Continuer ';
};

const needs = () => $$('input[name="besoin"]:checked', form).map((x) => x.value);
const emailOk = (v) => /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(v.trim());

const validate = (i) => {
  if (i === 0) {
    const ok = needs().length > 0;
    $('#err1').hidden = ok;
    return ok;
  }
  if (i === 2) {
    const nom = form.nom, email = form.email;
    const okNom = nom.value.trim().length > 1;
    const okMail = emailOk(email.value);
    nom.classList.toggle('is-invalid', !okNom);
    email.classList.toggle('is-invalid', !okMail);
    $('#err3').hidden = okNom && okMail;
    if (!okNom) nom.focus(); else if (!okMail) email.focus();
    return okNom && okMail;
  }
  return true;
};

form.addEventListener('change', (e) => { if (e.target.name === 'besoin') $('#err1').hidden = true; });
form.addEventListener('input', (e) => {
  if (!e.target.classList.contains('is-invalid')) return;
  const ok = e.target.name === 'email' ? emailOk(e.target.value) : e.target.value.trim().length > 1;
  if (ok) e.target.classList.remove('is-invalid');
});

const summary = () => {
  const d = new FormData(form);
  return [
    `Besoin(s) : ${needs().join(', ')}`,
    `Formule : ${d.get('formule')}`,
    `Taille : ${d.get('taille')}`,
    `Échéance : ${d.get('delai')}`,
    '',
    `Nom : ${d.get('nom')}`,
    `Société : ${d.get('societe') || '—'}`,
    `Email : ${d.get('email')}`,
    `Téléphone : ${d.get('tel') || '—'}`,
    '',
    d.get('message') || '',
  ].join('\n');
};

const submit = async () => {
  if (form._honey.value) return; // robot
  nextBtn.disabled = true;
  let sent = false;
  if (FORM_ENDPOINT) {
    try {
      const body = new FormData(form);
      body.set('besoin', needs().join(', '));
      const res = await fetch(FORM_ENDPOINT, { method: 'POST', body, headers: { Accept: 'application/json' } });
      sent = res.ok;
    } catch { sent = false; }
  }
  if (sent) {
    $('#quoteDone h3').textContent = 'Demande envoyée';
    $('#doneText').textContent = `Merci ${form.nom.value.trim().split(' ')[0]}. Nous étudions votre besoin et revenons vers vous sous 24h.`;
  } else {
    const subject = `Demande de devis — ${needs().join(', ')}`;
    location.href = `mailto:${CONTACT_EMAIL}?subject=${encodeURIComponent(subject)}&body=${encodeURIComponent(summary())}`;
  }
  nextBtn.disabled = false;
  form.hidden = true;
  done.hidden = false;
  done.focus({ preventScroll: true });
};

nextBtn.addEventListener('click', () => {
  if (!validate(current)) return;
  if (current < steps.length - 1) {
    showStep(current + 1);
    if (current === steps.length - 1 && matchMedia('(hover: hover)').matches) form.nom.focus({ preventScroll: true });
  } else submit();
});
prevBtn.addEventListener('click', () => showStep(current - 1, true));
form.addEventListener('submit', (e) => { e.preventDefault(); nextBtn.click(); });
form.addEventListener('keydown', (e) => {
  if (e.key === 'Enter' && e.target.tagName !== 'TEXTAREA' && e.target.tagName !== 'BUTTON') { e.preventDefault(); nextBtn.click(); }
});
$('#restartBtn').addEventListener('click', () => {
  form.reset();
  done.hidden = true;
  form.hidden = false;
  showStep(0, true);
});

/* Pré-remplissage depuis les sections (« Chiffrer mon projet… ») */
$$('[data-need], [data-formule]').forEach((a) => {
  a.addEventListener('click', () => {
    if (!done.hidden) $('#restartBtn').click();
    const { formule } = a.dataset; const need = a.dataset.need;
    if (need) {
      const box = $$('input[name="besoin"]', form).find((x) => x.value === need);
      if (box) box.checked = true;
      $('#err1').hidden = true;
      showStep(1);
    }
    if (formule) {
      const r = $$('input[name="formule"]', form).find((x) => x.value === formule);
      if (r) r.checked = true;
      showStep(needs().length ? 1 : 0);
    }
  });
});

$('#year').textContent = new Date().getFullYear();
onScroll();
