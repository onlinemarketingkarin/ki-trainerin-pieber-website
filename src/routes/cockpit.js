import express from 'express';
import { readFileSync, readdirSync, statSync } from 'node:fs';
import { join } from 'node:path';
import { ROOT } from '../paths.js';

const ordner = join(ROOT, 'admin');
const VERSION = JSON.parse(readFileSync(join(ROOT, 'package.json'), 'utf8')).version;

/** Die Version ändert sich mit jeder Änderung an einer Cockpit-Datei. So sieht niemand nach einem Bau die alte Oberfläche. */
const versionsStempel = () => {
  const neuester = Math.max(...readdirSync(ordner).map((f) => statSync(join(ordner, f)).mtimeMs));
  return `${VERSION}.${Math.floor(neuester / 1000).toString(36)}`;
};

const KOPF = { 'Cache-Control': 'no-cache', 'X-Robots-Tag': 'noindex' };

export function cockpitRouter() {
  const r = express.Router();
  // Das HTML nie cachen; jeder Skript- und Stil-Verweis trägt die Version.
  const seite = (_req, res) => {
    const html = readFileSync(join(ordner, 'index.html'), 'utf8').replace(/__VERSION__/g, versionsStempel());
    res.set({ ...KOPF, 'Cache-Control': 'no-store' }).type('html').send(html);
  };
  r.get(['/cockpit', '/cockpit/'], seite);
  r.use('/cockpit', express.static(ordner, { index: false, etag: true, maxAge: 0, setHeaders: (res) => res.set(KOPF) }));
  return r;
}
