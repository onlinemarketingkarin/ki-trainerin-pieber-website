/** Pfad der Kontaktdatei. Ein Ort, damit Baustein und Route nicht auseinanderlaufen. */
export const VCARD_PFAD = '/Karin-Pieber.vcf';

const esc = (s) => String(s ?? '').replace(/\\/g, '\\\\').replace(/\n/g, '\\n').replace(/;/g, '\\;').replace(/,/g, '\\,');

/**
 * vCard 3.0 aus den Fakten (P2). Die Kurzform steckt im QR-Code: je weniger
 * Zeichen, desto gröber die Module und desto sicherer der Scan.
 */
export function baueVcard(f, { voll = false } = {}) {
  const p = f.person || {};
  const zeilen = [
    'BEGIN:VCARD',
    'VERSION:3.0',
    `N:${esc(p.nachname)};${esc(p.vorname)};;${esc(p.titel_vor)};`,
    `FN:${esc(f.name)}`,
    `ORG:${esc(f.marke)}`,
    `TITLE:${esc(f.titel)}`,
    `TEL;TYPE=CELL:${esc(f.abgeleitet?.telefon_link || f.telefon)}`,
    `EMAIL;TYPE=INTERNET:${esc(f.email)}`,
    `URL:${f.web}`,
  ];
  if (voll) {
    zeilen.push(`URL:${f.linkedin}`, `ADR;TYPE=WORK:;;;${esc(f.anschrift?.ort)};;;${esc(f.anschrift?.land)}`);
  }
  zeilen.push('END:VCARD');
  return zeilen.join('\r\n') + '\r\n';
}
