import { randomUUID } from 'node:crypto';
import { rm } from 'node:fs/promises';
import { join } from 'node:path';
import sharp from 'sharp';
import { query, queryOne } from './db.js';
import { verarbeiteBild, BREITEN } from './media.js';
import { UPLOADS } from './paths.js';
import { Fehler } from './fehler.js';

const FORMATE = new Set(['jpeg', 'png', 'webp', 'gif', 'avif']);   // bewusst kein SVG: darin kann Skript stecken
const MAX_BREITE = 8000;

export const listeMedien = () => query('SELECT id, file_path, alt, bytes, created_at FROM media ORDER BY created_at DESC');

const altPruefen = (alt) => {
  const s = String(alt ?? '').trim();
  if (s.length < 3) throw new Fehler(400, 'Bitte beschreiben Sie das Bild in einem Satz (Alt-Text). Ohne Beschreibung ist ein Bild für Vorlesegeräte nicht vorhanden.');
  return s.slice(0, 300);
};

/** Bild hochladen: prüfen, zu WebP verarbeiten, eintragen. Derselbe Inhalt ergibt denselben Namen und wird nicht doppelt gespeichert. */
export async function speichereMedium(buffer, dateiname, alt) {
  const beschreibung = altPruefen(alt);
  let meta;
  try { meta = await sharp(buffer).metadata(); } catch { throw new Fehler(400, 'Diese Datei ist kein Bild, das ich lesen kann.'); }
  if (!FORMATE.has(meta.format)) throw new Fehler(400, 'Erlaubt sind JPEG, PNG, WebP, GIF und AVIF.');
  if ((meta.width || 0) > MAX_BREITE || (meta.height || 0) > MAX_BREITE) throw new Fehler(400, `Das Bild ist größer als ${MAX_BREITE} Pixel.`);

  const { base } = await verarbeiteBild(buffer, dateiname);
  const vorhanden = await queryOne('SELECT id FROM media WHERE file_path = $1', [base]);
  if (vorhanden) {
    await query('UPDATE media SET alt = $1 WHERE id = $2', [beschreibung, vorhanden.id]);
    return queryOne('SELECT id, file_path, alt, bytes, created_at FROM media WHERE id = $1', [vorhanden.id]);
  }
  const id = randomUUID();
  await query('INSERT INTO media (id, file_path, alt, bytes, created_at) VALUES ($1, $2, $3, $4, $5)',
    [id, base, beschreibung, buffer.length, new Date().toISOString()]);
  return queryOne('SELECT id, file_path, alt, bytes, created_at FROM media WHERE id = $1', [id]);
}

export async function aendereAlt(id, alt) {
  const beschreibung = altPruefen(alt);
  const zeile = await queryOne('SELECT id FROM media WHERE id = $1', [id]);
  if (!zeile) throw new Fehler(404, 'Bild nicht gefunden.');
  await query('UPDATE media SET alt = $1 WHERE id = $2', [beschreibung, id]);
  return queryOne('SELECT id, file_path, alt, bytes, created_at FROM media WHERE id = $1', [id]);
}

/** Wo wird dieses Bild benutzt? Seiten (in Bausteinen und als Vorschaubild). */
export async function bildVerwendung(base) {
  const seiten = await query('SELECT id, slug, title, content_json, og_image FROM pages');
  return seiten.filter((s) => s.og_image === base || String(s.content_json).includes(`"${base}"`))
    .map((s) => ({ id: s.id, slug: s.slug, title: s.title }));
}

export async function loescheMedium(id) {
  const zeile = await queryOne('SELECT id, file_path FROM media WHERE id = $1', [id]);
  if (!zeile) throw new Fehler(404, 'Bild nicht gefunden.');
  const verwendet = await bildVerwendung(zeile.file_path);
  if (verwendet.length) throw new Fehler(409, 'Dieses Bild wird noch benutzt. Erst dort ein anderes Bild einsetzen.', verwendet.map((s) => s.title || s.slug));
  for (const breite of BREITEN) await rm(join(UPLOADS, `${zeile.file_path.split('/').pop()}-${breite}.webp`), { force: true });
  await query('DELETE FROM media WHERE id = $1', [id]);
}
