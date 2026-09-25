/**
 * Seiten, Navigation und Bilder aus content/ in die Datenbank laden.
 * Die Quelle sind content/pages/*.json, content/navigation.json und content/media.json.
 * Eine Seite darf "status" (Vorgabe: published) und "noindex" tragen.
 * P5: ohne `force` wird nichts überschrieben, was schon da ist.
 */
import { randomUUID } from 'node:crypto';
import { readdirSync, readFileSync } from 'node:fs';
import { basename, join } from 'node:path';
import { query, queryOne } from './db.js';
import { validateContent } from './archetypes.js';
import { verarbeiteBild } from './media.js';
import { ROOT } from './paths.js';

const lies = (pfad) => JSON.parse(readFileSync(join(ROOT, pfad), 'utf8'));

export async function seedeInhalte({ force = false, log = () => {} } = {}) {
  for (const datei of readdirSync(join(ROOT, 'content/pages')).filter((f) => f.endsWith('.json')).sort()) {
    const s = lies(`content/pages/${datei}`);
    const inhalt = { blocks: s.blocks };
    const pruefung = validateContent(s.page_type, inhalt);
    if (!pruefung.ok) throw new Error(`${s.slug}: ${pruefung.fehler.join(' · ')}`);

    const vorhanden = await queryOne('SELECT status FROM pages WHERE slug = $1', [s.slug]);
    if (vorhanden && !force) { log(`${s.slug}: existiert schon (${vorhanden.status}), übersprungen`); continue; }

    const jetzt = new Date().toISOString();
    await query(
      `INSERT INTO pages (id, slug, page_type, status, title, description, content_json, noindex, created_at, updated_at)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $9)
       ON CONFLICT (slug) DO UPDATE SET page_type = excluded.page_type, status = excluded.status,
         title = excluded.title, description = excluded.description, noindex = excluded.noindex,
         content_json = excluded.content_json, updated_at = excluded.updated_at`,
      [randomUUID(), s.slug, s.page_type, s.status || 'published', s.title, s.description, JSON.stringify(inhalt), s.noindex ? 1 : 0, jetzt]);
    log(`${s.slug}: gespeichert`);
  }

  const anzahl = (await queryOne('SELECT COUNT(*) AS n FROM navigation')).n;
  if (Number(anzahl) === 0 || force) {
    await query('DELETE FROM navigation');
    for (const [i, n] of lies('content/navigation.json').entries()) {
      await query(
        'INSERT INTO navigation (id, parent_id, label, href, sort, visible, bereich) VALUES ($1, NULL, $2, $3, $4, 1, $5)',
        [randomUUID(), n.label, n.href, (i + 1) * 10, n.bereich || 'beide']);
    }
    log('Navigation: gespeichert');
  } else log('Navigation: existiert schon, übersprungen');

  // Bilder aus material/ aufbereiten und eintragen. Vorhandenes (samt Alt-Text) bleibt.
  for (const m of lies('content/media.json')) {
    const daten = readFileSync(join(ROOT, m.quelle));
    const { base } = await verarbeiteBild(daten, basename(m.quelle));
    if (await queryOne('SELECT id FROM media WHERE file_path = $1', [base])) { log(`Bild ${base}: existiert schon, übersprungen`); continue; }
    await query('INSERT INTO media (id, file_path, alt, bytes, created_at) VALUES ($1, $2, $3, $4, $5)',
      [randomUUID(), base, m.alt, daten.length, new Date().toISOString()]);
    log(`Bild ${base}: gespeichert`);
  }
}
