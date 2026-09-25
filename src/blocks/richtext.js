import { html, raw, escapeAttr, ziel, markdownBloecke } from './_util.js';

const wahl = (wert, erlaubt, vorgabe) => (erlaubt.includes(wert) ? wert : vorgabe);

export default {
  name: 'richtext',
  label: 'Textabschnitt',
  schema: {
    kicker:   { type: 'text',     default: '', label: 'Kleine Zeile darüber' },
    titel:    { type: 'text',     default: '', label: 'Überschrift' },
    ebene:    { type: 'select',   default: '2', options: ['2', '1'], optionLabels: { 2: 'Zwischenüberschrift', 1: 'Hauptüberschrift der Seite (nur eine pro Seite)' }, label: 'Art der Überschrift' },
    text:     { type: 'longtext', default: '', label: 'Text (Leerzeile = neuer Absatz, "- " = Liste, "## " = Zwischenüberschrift)' },
    layout:   { type: 'select',   default: 'geteilt', options: ['geteilt', 'schmal'], optionLabels: { geteilt: 'Überschrift links, Text rechts', schmal: 'Eine schmale Spalte' }, label: 'Layout' },
    flaeche:  { type: 'select',   default: 'grund', options: ['grund', 'creme', 'mint'], optionLabels: { grund: 'Hell (Seitengrund)', creme: 'Creme', mint: 'Mint (Vertrauen, Sicherheit)' }, label: 'Hintergrund' },
    ctaLabel: { type: 'text',     default: '', label: 'Knopf-Beschriftung (optional, nachrangig)' },
    ctaHref:  { type: 'text',     default: '', label: 'Knopf-Ziel' },
  },
  css: `
    .rt__raster{display:grid;gap:20px}
    .rt__kopf{min-width:0}
    .rt__kicker{margin:0 0 14px}
    .rt__kopf h1,.rt__kopf h2{max-width:14ch}
    .rt__kopf h1{font-size:clamp(38px,5vw,60px);max-width:16ch}
    .rt__text{min-width:0;max-width:64ch}
    .rt__text>*:first-child{margin-top:0}
    .rt__text p{margin:0 0 1em}
    .rt__text h3{font-size:28px;margin:1.6em 0 .5em}
    .rt__text h4{margin:1.4em 0 .4em}
    .rt__knopf{margin:28px 0 0}
    .rt--schmal .rt__raster{max-width:64ch}
    .rt--schmal .rt__kopf h1,.rt--schmal .rt__kopf h2{max-width:none;margin-bottom:8px}
    .band-mint .rt__kopf h1,.band-mint .rt__kopf h2,.band-mint .eyebrow{color:var(--akzent)}
    .band-mint li::marker{color:var(--akzent)}
    @media(min-width:900px){
      .rt--geteilt .rt__raster{grid-template-columns:minmax(0,5fr) minmax(0,7fr);gap:56px}
    }
  `,
  render(data) {
    const flaeche = wahl(data.flaeche, ['creme', 'mint'], 'grund');
    const kopf = Boolean(data.kicker || data.titel);
    const layout = kopf ? wahl(data.layout, ['geteilt', 'schmal'], 'geteilt') : 'schmal';
    const h = data.ebene === '1' ? 'h1' : 'h2';
    const titel = data.titel ? (h === 'h1' ? html`<h1>${data.titel}</h1>` : html`<h2>${data.titel}</h2>`) : '';
    return html`
      <section class="section rt rt--${layout} band-${flaeche}"><div class="container"><div class="rt__raster">
        ${kopf ? html`<div class="rt__kopf">
          ${data.kicker ? html`<p class="eyebrow rt__kicker">${data.kicker}</p>` : ''}${titel}</div>` : ''}
        <div class="rt__text">
          ${markdownBloecke(data.text)}
          ${data.ctaLabel && ziel(data.ctaHref)
            ? html`<p class="rt__knopf"><a class="btn btn--zweit" href="${raw(escapeAttr(ziel(data.ctaHref)))}">${data.ctaLabel}</a></p>` : ''}
        </div>
      </div></div></section>`;
  },
};
