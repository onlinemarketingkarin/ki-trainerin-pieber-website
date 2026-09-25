/**
 * Aus den flachen Zeilen der Tabelle `navigation` den Baum für Kopf oder Fuß bauen.
 * Jede Zeile sagt mit `bereich` ('kopf', 'fuss', 'beide'), wo sie erscheint.
 */
export function baumFuer(zeilen, bereich) {
  const z = zeilen.filter((r) => r.bereich === 'beide' || r.bereich === bereich);
  return z.filter((r) => !r.parent_id).map((r) => ({ ...r, kinder: z.filter((k) => k.parent_id === r.id) }));
}

export const navigationDaten = (zeilen) => ({ nav: { baum: baumFuer(zeilen, 'kopf') }, footer: { baum: baumFuer(zeilen, 'fuss') } });
