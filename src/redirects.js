import { query, queryOne } from './db.js';
import { Fehler } from './fehler.js';

/** Vorne ein Schrägstrich, hinten keiner (außer bei "/"), ohne Query. Unsere kanonischen URLs haben keinen. */
export function normalisierePfad(p) {
  let s = String(p ?? '').trim();
  if (!s.startsWith('/')) return '';
  s = s.split(/[?#]/)[0].replace(/\/{2,}/g, '/');
  if (s.length > 1) s = s.replace(/\/+$/, '');
  return s;
}

const GESPERRT = ['/cockpit', '/api', '/uploads', '/fonts', '/logo', '/form'];
const istGesperrt = (pfad) => pfad === '/' || GESPERRT.some((g) => pfad === g || pfad.startsWith(`${g}/`));

export async function findeUmleitung(pfad) {
  const p = normalisierePfad(pfad);
  if (!p || p === '/') return null;
  return queryOne('SELECT from_path, to_path, code FROM redirects WHERE from_path = $1', [p]);
}

export const listeUmleitungen = () => query('SELECT from_path, to_path, code, created_at FROM redirects ORDER BY created_at DESC');

/**
 * Eine Umleitung anlegen. Regeln, die Ärger ersparen:
 * - keine Umleitung von einer Adresse, unter der eine Seite liegt (sie wäre nicht mehr erreichbar)
 * - keine Kette: was auf `von` zeigte, zeigt danach direkt auf `nach`
 * - keine Schleife
 */
export async function setzeUmleitung(von, nach, code = 301) {
  const vonPfad = normalisierePfad(von);
  const extern = /^https:\/\//i.test(String(nach ?? '').trim());
  const nachPfad = extern ? String(nach).trim() : normalisierePfad(nach);
  if (!vonPfad || istGesperrt(vonPfad)) throw new Fehler(400, `Von dieser Adresse kann nicht umgeleitet werden: ${von || '(leer)'}`);
  if (!nachPfad) throw new Fehler(400, 'Das Ziel muss mit / oder https:// beginnen.');
  if (![301, 302].includes(Number(code))) throw new Fehler(400, 'Nur 301 oder 302 sind erlaubt.');
  if (nachPfad === vonPfad) throw new Fehler(400, 'Von und Nach sind gleich.');

  const seite = await queryOne('SELECT status FROM pages WHERE slug = $1', [vonPfad.slice(1)]);
  if (seite) throw new Fehler(409, `Unter ${vonPfad} liegt eine Seite. Zuerst umbenennen oder löschen.`);

  let ziel = nachPfad;
  if (!extern) {
    const weiter = await queryOne('SELECT to_path FROM redirects WHERE from_path = $1', [nachPfad]);
    if (weiter) ziel = weiter.to_path;
    if (ziel === vonPfad) throw new Fehler(409, 'Diese Umleitung würde eine Schleife bilden.');
  }
  await query('UPDATE redirects SET to_path = $1 WHERE to_path = $2', [ziel, vonPfad]);
  await query('DELETE FROM redirects WHERE from_path = $1', [vonPfad]);
  await query('INSERT INTO redirects (from_path, to_path, code, created_at) VALUES ($1, $2, $3, $4)',
    [vonPfad, ziel, Number(code), new Date().toISOString()]);
  return { from_path: vonPfad, to_path: ziel, code: Number(code) };
}

export async function entferneUmleitung(von) {
  await query('DELETE FROM redirects WHERE from_path = $1', [normalisierePfad(von)]);
}

/** Middleware: vor allen Seitenrouten, nach den statischen Dateien. */
export async function umleitungsMiddleware(req, res, next) {
  try {
    if (req.method !== 'GET' && req.method !== 'HEAD') return next();
    const ziel = await findeUmleitung(req.path);
    if (!ziel) return next();
    const abfrage = req.url.includes('?') && !/^https:/i.test(ziel.to_path) ? req.url.slice(req.url.indexOf('?')) : '';
    res.redirect(ziel.code || 301, ziel.to_path + abfrage);
  } catch (err) { next(err); }
}
