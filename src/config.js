import { readFileSync } from 'node:fs';
import { join } from 'node:path';
import { ROOT } from './paths.js';

const lies = (datei) => JSON.parse(readFileSync(join(ROOT, 'config', datei), 'utf8'));

export const loadSite = () => lies('site.json');
export const loadTheme = () => lies('theme.json');
export const leseFaktenDatei = () => lies('facts.json');

/**
 * Fakten-SSOT (P2). Zahlen, die sich aus anderen Fakten ergeben, werden hier
 * gerechnet und nie getippt (P3): {{facts.abgeleitet.jahre_sozialversicherung}}.
 */
export function berechneFakten(fakten) {
  const seit = Number(fakten.beruf?.sozialversicherung_seit);
  const abgeleitet = {
    telefon_link: String(fakten.telefon || '').replace(/[^\d+]/g, ''),
  };
  if (seit) abgeleitet.jahre_sozialversicherung = new Date().getFullYear() - seit;
  return { ...fakten, abgeleitet };
}

/** Nur die Datei. Was jemand im Cockpit geändert hat, kommt über ladeFakten() in src/facts.js dazu. */
export const loadFacts = () => berechneFakten(leseFaktenDatei());
