import { blocks } from './blocks/index.js';
import { themeCss, VORLADEN } from './blocks/_theme.js';
import { escapeHtml } from './blocks/_util.js';
import { loadSite, loadFacts, loadTheme } from './config.js';

/**
 * Fakten-Tor (P2): {{facts.email}} → Wert, fehlend → sichtbares […].
 * Der Wert wird escaped, denn er landet in Text und in Attributen.
 * Wer wissen will, was fehlt (etwa vor dem Veröffentlichen), übergibt ein Array als `fehlend`.
 */
export function stempleFakten(text, facts, fehlend) {
  return String(text).replace(/\{\{facts\.([\w.]+)\}\}/g, (_, pfad) => {
    const wert = pfad.split('.').reduce(
      (o, k) => (o && typeof o === 'object' && Object.hasOwn(o, k) ? o[k] : undefined), facts);
    if (wert == null || wert === '' || typeof wert === 'object') {
      console.warn(`[Motor] [WARN] Fakt fehlt: ${pfad}`);
      if (fehlend && !fehlend.includes(pfad)) fehlend.push(pfad);
      return '[…]';
    }
    return escapeHtml(wert);
  });
}

/** Reine Funktion: gleiche Daten, gleiches HTML. Fakten, Site, Theme und Bild-Alt-Texte sind einspeisbar. */
export function renderPage(page, {
  dynamicData = {}, facts = loadFacts(), site = loadSite(), theme = loadTheme(), fehlend, medienAlt = {},
} = {}) {
  const inhalt = typeof page.content_json === 'string'
    ? JSON.parse(page.content_json) : page.content_json;
  const liste = inhalt.blocks || [];

  const benutzt = [...new Set(liste.map((b) => b.type))];
  const css = benutzt.map((t) => blocks[t]?.css || '').join('\n');
  const js = benutzt.map((t) => blocks[t]?.js || '').join('\n').trim();

  // nav und footer bilden den Rahmen, alles dazwischen gehört in <main>.
  let koerper = '';
  let inMain = false;
  for (const eintrag of liste) {
    const block = blocks[eintrag.type];
    if (!block) {
      // Laut sein: ein unbekannter Baustein verschwindet sonst stumm und
      // die Seite bleibt 200, aber leer. Das ist die fieseste Fehlerart.
      console.warn(`[Motor] [WARN] Unbekannter Baustein: ${eintrag.type}`);
      continue;
    }
    const vorgaben = Object.fromEntries(
      Object.entries(block.schema).map(([k, v]) => [k, v.default]));
    const daten = { ...vorgaben, ...eintrag.data, ...(dynamicData[eintrag.type] || {}) };
    const out = block.render(daten, { facts, site, medienAlt });
    if (!block.rahmen && !inMain) { koerper += '<main id="inhalt">'; inMain = true; }
    if (block.rahmen && inMain) { koerper += '</main>'; inMain = false; }
    koerper += out?.__raw ? out.value : String(out);
  }
  if (inMain) koerper += '</main>';

  const titel = page.title || site.name;
  const vollTitel = titel + (titel.includes(site.name) ? '' : (site.titleSuffix || ''));
  const pfad = page.slug && page.slug !== 'start' ? `/${page.slug}` : '/';
  const veroeffentlicht = page.status === 'published';
  const sichtbar = veroeffentlicht && !Number(page.noindex);
  const kanonisch = site.domain ? escapeHtml(site.domain + pfad) : '';
  const ogBild = site.domain && /^\/uploads\/[\w-]+$/.test(page.og_image || '') ? escapeHtml(`${site.domain}${page.og_image}-1200.webp`) : '';
  const beschreibung = page.description ? escapeHtml(page.description) : '';

  return stempleFakten(`<!doctype html>
<html lang="${escapeHtml(site.locale || 'de')}">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1">
<title>${escapeHtml(vollTitel)}</title>
${beschreibung ? `<meta name="description" content="${beschreibung}">` : ''}
${sichtbar ? '' : '<meta name="robots" content="noindex">'}
${veroeffentlicht && kanonisch ? `<link rel="canonical" href="${kanonisch}">` : ''}
${sichtbar && kanonisch ? `<meta property="og:type" content="website">
<meta property="og:site_name" content="${escapeHtml(site.name)}">
<meta property="og:title" content="${escapeHtml(vollTitel)}">
${beschreibung ? `<meta property="og:description" content="${beschreibung}">` : ''}
<meta property="og:url" content="${kanonisch}">
${ogBild ? `<meta property="og:image" content="${ogBild}">` : ''}
<meta name="twitter:card" content="${ogBild ? 'summary_large_image' : 'summary'}">` : ''}
<meta name="theme-color" content="${escapeHtml(theme.farben.grund)}">
<link rel="icon" href="/favicon.svg" type="image/svg+xml">
<link rel="apple-touch-icon" href="/apple-touch-icon.png">
${VORLADEN.map((f) => `<link rel="preload" href="${f}" as="font" type="font/woff2" crossorigin>`).join('\n')}
${js ? '<script>document.documentElement.classList.add("js")</script>' : ''}
<style>${themeCss(theme)}${css}</style>
</head>
<body><a class="skip" href="#inhalt">Zum Inhalt springen</a>${koerper}${js ? `<script>${js}</script>` : ''}</body>
</html>`, facts, fehlend);
}
