import { jsonrepair } from 'jsonrepair';

/**
 * Modelle liefern gelegentlich Text um das JSON herum, Markdown-Zäune, abgeschnittene
 * Antworten oder ein fehlendes Komma. Kette: säubern → JSON.parse → aus dem Text
 * herausschneiden → reparieren. Ein Generator, der an einem Komma scheitert, wird
 * nicht benutzt (Stufe 4 im Motor-Dokument).
 */
// Wir erwarten immer {"blocks": [...]}. Prosa lässt sich von jsonrepair klaglos in einen
// JSON-*String* verpacken ("Tut mir leid" → "\"Tut mir leid\"") — das ist technisch gültiges
// JSON, aber kein Inhalt. Nur ein echtes Objekt zählt als Treffer.
const istObjekt = (v) => v !== null && typeof v === 'object' && !Array.isArray(v);

export function parseModellJson(text) {
  const roh = String(text ?? '');
  // 1. säubern: Markdown-Codeblock-Zäune, falls das Modell sie trotz Anweisung setzt
  const bereinigt = roh.trim().replace(/^```(?:json)?\s*/i, '').replace(/```\s*$/, '').trim();

  const versuche = [bereinigt];
  // 2. aus umgebendem Text herausschneiden: erstes { bis letztes }
  const start = bereinigt.indexOf('{');
  const ende = bereinigt.lastIndexOf('}');
  if (start >= 0 && ende > start) versuche.push(bereinigt.slice(start, ende + 1));

  for (const stufe of versuche) {
    try { const r = JSON.parse(stufe); if (istObjekt(r)) return r; } catch { /* nächste Stufe */ }
  }
  // 3. reparieren (fehlendes Komma, abgeschnittene Antwort, einfache Anführungszeichen …)
  for (const stufe of versuche) {
    try { const r = JSON.parse(jsonrepair(stufe)); if (istObjekt(r)) return r; } catch { /* nächste Stufe */ }
  }
  throw new Error('Die Antwort des Modells ist kein (reparierbares) JSON-Objekt.');
}
