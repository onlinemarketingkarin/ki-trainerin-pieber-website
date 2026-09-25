import { readFileSync, readdirSync, existsSync } from 'node:fs';
import { join } from 'node:path';
import { ROOT } from './paths.js';

const ordner = join(ROOT, 'page-types');
const lies = (pfad) => JSON.parse(readFileSync(pfad, 'utf8'));

const typen = Object.fromEntries(
  readdirSync(ordner, { withFileTypes: true })
    .filter((d) => d.isDirectory())
    .map((d) => {
      const schema = join(ordner, d.name, 'schema.json');
      return [d.name, {
        name: d.name,
        ...lies(join(ordner, d.name, 'type.json')),
        schema: existsSync(schema) ? lies(schema) : {},
      }];
    }));

export const getType = (name) => typen[name] || null;
export const listTypes = () => Object.values(typen);

/** Der Vertrag. Hier scheitert ein Modell-Ergebnis, nicht auf der Seite. */
export function validateContent(typName, inhalt) {
  const fehler = [];
  const typ = getType(typName);
  if (!typ) return { ok: false, fehler: [`Unbekannter Seitentyp: ${typName}`] };
  if (!Array.isArray(inhalt?.blocks)) return { ok: false, fehler: ['blocks muss ein Array sein'] };

  const erlaubt = new Set(typ.schema.allowedBlocks || []);
  const vorhanden = new Set(inhalt.blocks.map((b) => b?.type).filter(Boolean));
  for (const b of inhalt.blocks) {
    if (!b?.type) fehler.push('Baustein ohne type');
    else if (erlaubt.size && !erlaubt.has(b.type)) fehler.push(`Baustein nicht erlaubt für ${typName}: ${b.type}`);
  }
  for (const pflicht of typ.schema.requiredBlocks || []) {
    if (!vorhanden.has(pflicht)) fehler.push(`Pflicht-Baustein fehlt: ${pflicht}`);
  }
  return { ok: fehler.length === 0, fehler };
}
