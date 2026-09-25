/**
 * Ein Bild für die Website aufbereiten (WebP in drei Breiten, Hash im Namen).
 *   npm run bild -- material/portrait-karin-pieber.webp
 * Ausgabe: der Basispfad, der in ein Bildfeld (z. B. hero.bild) gehört.
 * Ab Stufe 3 macht das Cockpit beim Hochladen genau dasselbe.
 */
import { readFile } from 'node:fs/promises';
import { basename } from 'node:path';
import { verarbeiteBild } from '../src/media.js';

const datei = process.argv[2];
if (!datei) { console.error('Aufruf: npm run bild -- <datei>'); process.exit(1); }
const { base, breiten } = await verarbeiteBild(await readFile(datei), basename(datei));
console.log(`[Bild] ${base}  (${breiten.join(', ')} px)`);
