import { h, leere } from './h.js';
import { T } from './labels.js';
import { api, bei401 } from './api.js';
import { seitenAnsicht, seiteAnsicht } from './seiten.js';
import { navigationAnsicht } from './navigation.js';
import { medienAnsicht } from './medien.js';
import { anfragenAnsicht } from './anfragen.js';
import { umleitungenAnsicht } from './umleitungen.js';
import { faktenAnsicht } from './fakten.js';
import { handbuchAnsicht } from './handbuch.js';

const app = document.getElementById('app');

const route = () => location.hash.slice(1) || 'seiten';
const navigiere = (pfad) => { location.hash = pfad; };

async function zeichneRahmen() {
  const stats = await api.get('/stats').catch(() => ({ ungelesen: 0 }));
  const punkte = [
    ['seiten', T.menue.seiten], ['navigation', T.menue.navigation], ['medien', T.menue.medien],
    ['anfragen', stats.ungelesen ? `${T.menue.anfragen} (${stats.ungelesen})` : T.menue.anfragen],
    ['umleitungen', T.menue.umleitungen], ['fakten', T.menue.fakten], ['handbuch', T.menue.handbuch],
  ];
  const aktuell = route().split('/')[0];
  return h('div', { class: 'rahmen' },
    h('header', { class: 'rahmen__kopf' },
      h('span', { class: 'rahmen__marke' }, T.titel),
      h('nav', { class: 'rahmen__nav' }, punkte.map(([pfad, text]) => h('a', { href: `#${pfad}`, class: aktuell === pfad ? 'aktiv' : '' }, text))),
      h('div', { class: 'rahmen__rechts' },
        h('a', { class: 'knopf knopf--leise', href: '/', target: '_blank', rel: 'noopener' }, 'Website ansehen'),
        h('button', { type: 'button', class: 'knopf knopf--leise', onclick: abmelden }, T.abmelden))),
    h('main', { id: 'inhalt', class: 'rahmen__inhalt' }));
}

async function abmelden() { await api.post('/logout').catch(() => {}); zeichneLogin(); }

async function zeichneAnsicht() {
  const inhalt = document.getElementById('inhalt');
  if (!inhalt) return;
  leere(inhalt, h('p', { class: 'laden' }, 'Wird geladen …'));
  const [name, arg] = route().split('/');
  try {
    let knoten;
    if (name === 'seite' && arg) knoten = await seiteAnsicht(arg, navigiere);
    else if (name === 'navigation') knoten = await navigationAnsicht();
    else if (name === 'medien') knoten = await medienAnsicht();
    else if (name === 'anfragen') knoten = await anfragenAnsicht();
    else if (name === 'umleitungen') knoten = await umleitungenAnsicht();
    else if (name === 'fakten') knoten = await faktenAnsicht();
    else if (name === 'handbuch') knoten = await handbuchAnsicht();
    else knoten = await seitenAnsicht(navigiere);
    leere(inhalt, knoten);
  } catch (err) {
    leere(inhalt, h('p', { class: 'hinweis hinweis--fehler' }, err.message || 'Das hat nicht geklappt.'));
  }
}

async function zeichneApp() { leere(app, await zeichneRahmen()); await zeichneAnsicht(); }
window.addEventListener('hashchange', zeichneApp);

function zeichneLogin() {
  const passwort = h('input', { id: 'login-pw', type: 'password', autocomplete: 'current-password', required: true });
  const fehlerbox = h('div', {});
  const knopf = h('button', { type: 'submit', class: 'knopf knopf--primaer' }, T.anmelden);
  const form = h('form', { class: 'login' },
    h('h1', {}, T.titel),
    h('div', { class: 'feld' }, h('label', { for: 'login-pw' }, T.passwort), passwort),
    fehlerbox, knopf);
  form.addEventListener('submit', async (e) => {
    e.preventDefault();
    knopf.disabled = true;
    try { await api.post('/login', { passwort: passwort.value }); await zeichneApp(); }
    catch (err) { leere(fehlerbox, h('p', { class: 'hinweis hinweis--fehler' }, err.message)); }
    finally { knopf.disabled = false; }
  });
  leere(app, h('div', { class: 'login__buehne' }, form));
  passwort.focus();
}

bei401(() => zeichneLogin());

async function start() {
  const status = await api.get('/status').catch(() => ({ eingerichtet: false }));
  if (!status.eingerichtet) {
    leere(app, h('div', { class: 'login__buehne' }, h('div', { class: 'hinweis hinweis--fehler' },
      h('p', {}, 'Das Cockpit ist noch nicht eingerichtet.'),
      h('p', {}, 'Bitte ADMIN_PASSWORD (mindestens 8 Zeichen) in der Umgebung setzen und den Server neu starten.'))));
    return;
  }
  try { await api.get('/me'); await zeichneApp(); }
  catch { zeichneLogin(); }
}
start();
