import { readFileSync } from 'node:fs';
import { join } from 'node:path';
import { getType, validateContent } from './archetypes.js';
import { blocks } from './blocks/index.js';
import { queryOne } from './db.js';
import { rufeModell } from './ai.js';
import { parseModellJson } from './json-repair.js';
import { Fehler } from './fehler.js';
import { ROOT } from './paths.js';
import { INTERESSEN_SCHLUESSEL } from './mail.js';

const MAX_QUELLE = 20000;

const stimme = () => { try { return readFileSync(join(ROOT, 'knowledge/voice.md'), 'utf8'); } catch { return ''; } };

/** Die Goldreferenz (P4), falls es eine gibt — sonst eine echte veröffentlichte Seite desselben Typs als Vorbild. */
async function holeBeispiel(typName) {
  try { return JSON.parse(readFileSync(join(ROOT, `page-types/${typName}/golden.json`), 'utf8')); } catch { /* keine Goldreferenz */ }
  const zeile = await queryOne("SELECT content_json FROM pages WHERE page_type = $1 AND status = 'published' LIMIT 1", [typName]);
  return zeile ? JSON.parse(zeile.content_json) : null;
}

/** Nur die erlaubten Bausteine mit ihren Feldnamen, kompakt fürs Prompt. Kommt direkt aus dem echten Schema. */
function schemaKompakt(typ) {
  const pflicht = new Set(typ.schema.requiredBlocks || []);
  return (typ.schema.allowedBlocks || []).map((name) => {
    const block = blocks[name];
    if (!block) return null;
    const feld = ([k, d]) => {
      if (d.type === 'list') return `  ${k}: Liste von { ${Object.keys(d.item || {}).join(', ')} }`;
      const wahl = d.type === 'select' ? ` (${(d.options || []).join('|')})` : '';
      return `  ${k}: ${d.type}${wahl}${d.label ? ` — ${d.label}` : ''}`;
    };
    return `${name}${pflicht.has(name) ? ' [Pflicht]' : ''}\n${Object.entries(block.schema).map(feld).join('\n')}`;
  }).filter(Boolean).join('\n\n');
}

export function baueSystemPrompt(typ) {
  return [
    'Du bist der Redaktions-Generator einer KI-nativen Website. Du lieferst AUSSCHLIESSLICH ein JSON-Objekt, kein Fließtext davor oder danach, keine Markdown-Codeblock-Zäune.',
    'Form ist Code, Inhalt kommt von dir: du erfindest kein Layout und keine neuen Felder, du füllst ausschließlich die Bausteindaten gegen das folgende Schema.',
    '',
    `Erlaubte Bausteine für den Seitentyp „${typ.name}" (Pflichtbausteine sind markiert, mindestens diese müssen vorkommen):`,
    schemaKompakt(typ),
    '',
    'Fakten (Preise, Adressen, Zertifikate, Kontaktdaten, Zeiträume, Berufsbezeichnungen) darfst du NIEMALS als ausgeschriebenen Wert nennen, auch nicht, wenn er dir aus dem Vorbild oder dem Zusammenhang bekannt vorkommt. Verweist ein Text auf einen Fakt, benutze ausschließlich den Platzhalter {{facts.<pfad>}}, niemals eine erfundene oder abgeschriebene Angabe. Beispiele: {{facts.email}}, {{facts.telefon}}, {{facts.titel}} (Berufsbezeichnung, z. B. in einer Vertrauenszeile), {{facts.preise.starter}}, {{facts.zertifikat.gueltig_bis}}. Gibt es für eine Aussage keinen passenden Pfad, formuliere allgemein statt etwas zu erfinden.',
    '',
    `Knöpfe und Links zur Kontaktseite dürfen das Interesse vorbelegen: /kontakt?interesse=<schluessel>. Erlaubt sind ausschließlich diese Schlüssel: ${INTERESSEN_SCHLUESSEL.join(', ')}. Kein anderer Wert, auch kein naheliegend wirkender.`,
    '',
    'Sprache und Ton (unbedingt einhalten):',
    stimme() || '(keine Stimme hinterlegt, siehe knowledge/voice.md)',
    '',
    'Antworte mit genau einem JSON-Objekt der Form {"blocks":[{"type":"...","data":{...}}, …]}. Sonst nichts.',
  ].filter(Boolean).join('\n');
}

export function baueBenutzerPrompt({ quelle, beispiel }) {
  const teile = [`Erstelle den Inhalt für diese Seite aus den folgenden Notizen, Stichworten oder diesem Transkript:\n\n${quelle}`];
  if (beispiel) {
    teile.push(`Zum Ton und Aufbau, als Vorbild für Stil und Struktur (nicht den Inhalt kopieren, nur die Machart):\n\n${JSON.stringify(beispiel)}`);
  }
  return teile.join('\n\n');
}

/**
 * Der Generator (Stufe 4). Liefert ausschließlich validiertes JSON gegen den Vertrag.
 * `aufrufen` ist einspeisbar (Tests laufen ohne API-Schlüssel und ohne Netz).
 * Setzt NIE den Status — das entscheidet, wer das Ergebnis speichert (immer 'generated', nie 'published': P5).
 */
export async function generiere({ typ: typName, quelle, aufrufen = rufeModell }) {
  const typ = getType(typName);
  if (!typ) throw new Fehler(400, `Unbekannter Seitentyp: ${typName}`);
  const text = String(quelle ?? '').trim();
  if (!text) throw new Fehler(400, 'Bitte Notizen, Stichworte oder ein Transkript angeben.');
  if (text.length > MAX_QUELLE) throw new Fehler(400, `Die Notizen sind zu lang (mehr als ${MAX_QUELLE} Zeichen).`);

  const beispiel = await holeBeispiel(typName);
  const system = baueSystemPrompt(typ);
  const prompt = baueBenutzerPrompt({ quelle: text, beispiel });

  let antwortText;
  try { antwortText = await aufrufen({ system, prompt }); }
  catch (err) { throw new Fehler(502, `Der Aufruf des Modells ist fehlgeschlagen: ${err.message}`); }

  let inhalt;
  try { inhalt = parseModellJson(antwortText); }
  catch (err) { throw new Fehler(502, `Die Antwort des Modells ließ sich nicht lesen: ${err.message}`); }

  // 1. Vertrag (P1). 2. Fakten: der Prompt verbietet erfundene Werte, das Fakten-Tor im
  // Renderer fängt beim Rendern ab, was trotzdem als {{facts.…}} auf einen falschen Pfad zeigt.
  const pruefung = validateContent(typName, inhalt);
  if (!pruefung.ok) throw new Fehler(422, 'Der generierte Inhalt passt nicht zum Vertrag dieses Seitentyps.', pruefung.fehler);

  return inhalt;
}
