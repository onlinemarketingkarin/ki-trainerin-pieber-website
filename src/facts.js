import { query } from './db.js';
import { leseFaktenDatei, berechneFakten } from './config.js';

const istObjekt = (v) => v && typeof v === 'object' && !Array.isArray(v);

/**
 * Tief mischen: die Datei ist der Grundstock, der Override gewinnt nur dort, wo er etwas sagt.
 * Damit verschwindet die Falle, dass ein neues Feld in der Datei live nicht erscheint,
 * weil ein alter Override das ganze Objekt überschattet.
 */
export function tiefMischen(grund, ueber) {
  const aus = { ...grund };
  for (const [k, v] of Object.entries(ueber || {})) {
    aus[k] = istObjekt(v) && istObjekt(grund?.[k]) ? tiefMischen(grund[k], v) : v;
  }
  return aus;
}

/** Nur das, was von der Datei abweicht. Was gleich ist, wird nicht als Override gespeichert. */
export function unterschied(datei, neu) {
  const diff = {};
  for (const [k, v] of Object.entries(datei)) {
    if (istObjekt(v)) {
      const d = unterschied(v, neu?.[k] ?? {});
      if (Object.keys(d).length) diff[k] = d;
    } else if (neu?.[k] !== undefined && neu[k] !== v) diff[k] = neu[k];
  }
  return diff;
}

/** Eingabe auf die Struktur der Datei zurechtstutzen: nur bekannte Felder, Typ bleibt Text oder Zahl. */
export function passeAn(datei, eingabe) {
  const aus = {};
  for (const [k, v] of Object.entries(datei)) {
    const e = eingabe?.[k];
    if (istObjekt(v)) aus[k] = passeAn(v, istObjekt(e) ? e : {});
    else if (typeof v === 'number') aus[k] = Number.isFinite(Number(e)) && e !== '' && e != null ? Number(e) : v;
    else aus[k] = e == null ? v : String(e).slice(0, 500);
  }
  return aus;
}

async function leseOverride() {
  const zeile = (await query("SELECT wert FROM config_overrides WHERE schluessel = 'facts'"))[0];
  if (!zeile) return {};
  try { return JSON.parse(zeile.wert); } catch { return {}; }
}

/** Datei = Grundstock, Datenbank = das, was jemand im Cockpit geändert hat. */
export async function ladeFakten() {
  return berechneFakten(tiefMischen(leseFaktenDatei(), await leseOverride()));
}

export async function faktenStand() {
  const datei = leseFaktenDatei();
  const override = await leseOverride();
  return { datei, override, aktuell: tiefMischen(datei, override) };
}

export async function speichereFakten(eingabe) {
  const datei = leseFaktenDatei();
  const diff = unterschied(datei, passeAn(datei, eingabe));
  if (!Object.keys(diff).length) {
    await query("DELETE FROM config_overrides WHERE schluessel = 'facts'");
  } else {
    await query(
      `INSERT INTO config_overrides (schluessel, wert, updated_at) VALUES ('facts', $1, $2)
       ON CONFLICT (schluessel) DO UPDATE SET wert = excluded.wert, updated_at = excluded.updated_at`,
      [JSON.stringify(diff), new Date().toISOString()]);
  }
  return faktenStand();
}
