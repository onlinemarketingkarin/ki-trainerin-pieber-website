export function escapeHtml(s) {
  return String(s ?? '').replace(/[&<>"']/g, (c) =>
    ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
}
export const escapeAttr = escapeHtml;

/** Markiert Zeichenketten, die schon sicher sind. */
export const raw = (v) => ({ __raw: true, value: v ?? '' });

/** html`…` escaped alles Eingesetzte, außer es ist raw(). */
export function html(teile, ...werte) {
  let out = '';
  teile.forEach((t, i) => {
    out += t;
    const v = werte[i];
    if (v == null) return;
    out += v && typeof v === 'object' && v.__raw ? v.value : escapeHtml(v);
  });
  return raw(out);
}

/**
 * Ziele: site-relativ, https, Anker, mailto, tel. Nie javascript: oder data:.
 * Ein {{facts.…}}-Platzhalter ist erlaubt; das Fakten-Tor löst ihn beim Rendern auf.
 */
export const ziel = (href) => {
  const h = String(href ?? '').trim();
  return /^(\/(?![/\\])|https:\/\/|#|mailto:|tel:|\{\{facts\.[\w.]+\}\})/i.test(h) ? h : '';
};

/** Inline-Markdown: **fett**, *kursiv*, [Text](Ziel). Alles wird zuerst escaped. */
export function inlineMd(text) {
  let s = escapeHtml(text);
  s = s.replace(/\[([^\]]+)\]\(([^)\s*]+)\)/g, (_m, label, href) => {
    const z = ziel(href);
    return z ? `<a href="${z}">${label}</a>` : label;
  });
  return s.replace(/\*\*(.+?)\*\*/g, '<strong>$1</strong>').replace(/\*(.+?)\*/g, '<em>$1</em>');
}

/**
 * Ein Bild aus einem Basispfad (/uploads/<hash>-<name>) mit srcset für drei Breiten.
 * Nur Pfade unter /uploads/ werden akzeptiert, alles andere ergibt kein Bild.
 */
export function bildSet(basis, { alt = '', sizes = '100vw', eager = false } = {}) {
  const b = String(basis ?? '').trim();
  if (!/^\/uploads\/[\w-]+$/.test(b)) return raw('');
  const srcset = [480, 800, 1200].map((w) => `${b}-${w}.webp ${w}w`).join(', ');
  return raw(`<img src="${b}-800.webp" srcset="${srcset}" sizes="${escapeAttr(sizes)}" alt="${escapeAttr(alt)}" ` +
    `${eager ? 'loading="eager" fetchpriority="high"' : 'loading="lazy"'} decoding="async">`);
}

/**
 * Absätze, "- "-Listen, "1. "-Listen und Zwischenüberschriften ("## " → h3, "### " → h4).
 * Leerzeile trennt Blöcke. Liefert sicheres HTML.
 */
export function markdownBloecke(text) {
  return raw(String(text ?? '').split(/\n{2,}/).map((b) => b.trim()).filter(Boolean).map((block) => {
    const zeilen = block.split('\n').map((z) => z.trim());
    const kopf = zeilen.length === 1 && zeilen[0].match(/^(#{2,3})\s+(.+)$/);
    if (kopf) return `<h${kopf[1].length + 1}>${inlineMd(kopf[2])}</h${kopf[1].length + 1}>`;
    if (zeilen.every((z) => /^[-•]\s+/.test(z))) {
      return `<ul>${zeilen.map((z) => `<li>${inlineMd(z.replace(/^[-•]\s+/, ''))}</li>`).join('')}</ul>`;
    }
    if (zeilen.every((z) => /^\d+\.\s+/.test(z))) {
      return `<ol>${zeilen.map((z) => `<li>${inlineMd(z.replace(/^\d+\.\s+/, ''))}</li>`).join('')}</ol>`;
    }
    return `<p>${zeilen.map(inlineMd).join('<br>')}</p>`;
  }).join(''));
}
