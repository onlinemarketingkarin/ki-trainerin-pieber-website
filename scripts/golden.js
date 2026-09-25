/**
 * Die Goldreferenz (P4) einer Seite erzeugen: das gerenderte HTML und der Inhalt als JSON.
 * Der Generator (Stufe 4) bekommt beides als Beispiel und wird daran abgenommen.
 *   npm run golden           Startseite → page-types/home/golden.html + golden.json
 */
import { readFileSync, writeFileSync } from 'node:fs';
import { join } from 'node:path';
import { renderPage } from '../src/renderer.js';
import { navigationDaten } from '../src/navigation.js';
import { ROOT } from '../src/paths.js';

const lies = (pfad) => JSON.parse(readFileSync(join(ROOT, pfad), 'utf8'));
const seite = lies('content/pages/start.json');
const zeilen = lies('content/navigation.json').map((n, i) => ({ id: String(i), parent_id: null, sort: (i + 1) * 10, bereich: 'beide', ...n }));

const html = renderPage({ ...seite, status: 'published', content_json: { blocks: seite.blocks } }, { dynamicData: navigationDaten(zeilen) });
writeFileSync(join(ROOT, 'page-types/home/golden.html'), html);
writeFileSync(join(ROOT, 'page-types/home/golden.json'), JSON.stringify({ blocks: seite.blocks }, null, 2) + '\n');
console.log(`[Golden] page-types/home/golden.html (${(html.length / 1024).toFixed(1)} KB) und golden.json`);
