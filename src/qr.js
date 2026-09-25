import qrcode from 'qrcode-generator';
import { escapeHtml } from './blocks/_util.js';

// Die Bibliothek schneidet jedes Zeichen auf ein Byte ab (Latin-1). Ein Telefon liest die Daten aber
// als UTF-8, und aus „TÜV" würde Zeichensalat. Deshalb kodieren wir selbst.
qrcode.stringToBytes = (text) => [...new TextEncoder().encode(text)];

/**
 * QR-Code als Inline-SVG. Deterministisch: gleicher Text, gleiches SVG.
 * Farbe kommt aus currentColor, die Ruhezone von vier Modulen ist eingebaut.
 */
export function qrSvg(text, { klasse = 'qr', beschreibung = '' } = {}) {
  const qr = qrcode(0, 'L');
  qr.addData(text, 'Byte');
  qr.make();
  const n = qr.getModuleCount();
  const rand = 4;
  let d = '';
  for (let zeile = 0; zeile < n; zeile++) {
    for (let spalte = 0; spalte < n;) {
      if (!qr.isDark(zeile, spalte)) { spalte++; continue; }
      let laenge = 1;
      while (spalte + laenge < n && qr.isDark(zeile, spalte + laenge)) laenge++;
      d += `M${spalte + rand} ${zeile + rand}h${laenge}v1h-${laenge}z`;
      spalte += laenge;
    }
  }
  const seite = n + 2 * rand;
  return `<svg class="${escapeHtml(klasse)}" viewBox="0 0 ${seite} ${seite}" role="img" aria-label="${escapeHtml(beschreibung)}" shape-rendering="crispEdges"><path d="${d}" fill="currentColor"/></svg>`;
}
