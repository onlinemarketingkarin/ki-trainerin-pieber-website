import { createHash, createHmac, timingSafeEqual } from 'node:crypto';

/**
 * Anmeldung fürs Cockpit: ein Passwort aus der Umgebung (ADMIN_PASSWORD), nie im Code.
 * Nach der Anmeldung gibt es ein signiertes Cookie. Das Geheimnis dafür wird aus dem Passwort
 * abgeleitet: wer das Passwort ändert, meldet damit alle alten Sitzungen ab.
 */
export const COOKIE = 'motor_session';
const GUELTIG_MS = 12 * 60 * 60 * 1000;
const MIN_LAENGE = 8;

const sha = (s) => createHash('sha256').update(String(s)).digest();
const passwort = () => process.env.ADMIN_PASSWORD || '';

export const anmeldungMoeglich = () => passwort().length >= MIN_LAENGE;

export function passwortStimmt(eingabe) {
  return anmeldungMoeglich() && timingSafeEqual(sha(eingabe ?? ''), sha(passwort()));
}

const signatur = (nutzlast) => createHmac('sha256', sha(`motor-session:${passwort()}`)).update(nutzlast).digest('base64url');

export function erstelleToken(jetzt = Date.now()) {
  const bis = String(jetzt + GUELTIG_MS);
  return `${bis}.${signatur(bis)}`;
}

export function tokenGueltig(token, jetzt = Date.now()) {
  if (!anmeldungMoeglich() || typeof token !== 'string') return false;
  const [bis, sig] = token.split('.');
  if (!bis || !sig) return false;
  const soll = Buffer.from(signatur(bis));
  const ist = Buffer.from(sig);
  return ist.length === soll.length && timingSafeEqual(ist, soll) && Number(bis) > jetzt;
}

export function cookieWert(req) {
  for (const teil of (req.headers.cookie || '').split(';')) {
    const [name, ...rest] = teil.trim().split('=');
    if (name === COOKIE) { try { return decodeURIComponent(rest.join('=')); } catch { return ''; } }
  }
  return '';
}

const attribute = (req) => `HttpOnly; SameSite=Strict; Path=/${req.secure ? '; Secure' : ''}`;
export const setzeCookie = (req, res, token) => res.append('Set-Cookie', `${COOKIE}=${encodeURIComponent(token)}; ${attribute(req)}; Max-Age=${GUELTIG_MS / 1000}`);
export const loescheCookie = (req, res) => res.append('Set-Cookie', `${COOKIE}=; ${attribute(req)}; Max-Age=0`);

/** Fehlversuche je Adresse: acht in fünfzehn Minuten, dann Pause. */
const versuche = new Map();
const FENSTER = 15 * 60 * 1000;
const MAX_VERSUCHE = 8;

export function gesperrt(ip, jetzt = Date.now()) {
  const v = versuche.get(ip);
  if (!v) return false;
  if (jetzt - v.seit > FENSTER) { versuche.delete(ip); return false; }
  return v.n >= MAX_VERSUCHE;
}
export function merkeFehlversuch(ip, jetzt = Date.now()) {
  const v = versuche.get(ip);
  if (!v || jetzt - v.seit > FENSTER) versuche.set(ip, { n: 1, seit: jetzt });
  else v.n += 1;
}
export const vergesseVersuche = (ip) => versuche.delete(ip);

/**
 * Alles unter /api/ (außer Anmeldung) läuft hierdurch. Zusätzlich zum SameSite-Cookie verlangt jede
 * Änderung einen eigenen Header: eine fremde Seite kann ihn ohne Zustimmung des Browsers nicht setzen.
 */
export function verlangeLogin(req, res, next) {
  if (!tokenGueltig(cookieWert(req))) return res.status(401).json({ fehler: 'Nicht angemeldet.' });
  if (req.method !== 'GET' && req.method !== 'HEAD' && req.get('X-Cockpit') !== '1') {
    return res.status(403).json({ fehler: 'Anfrage abgelehnt.' });
  }
  next();
}
