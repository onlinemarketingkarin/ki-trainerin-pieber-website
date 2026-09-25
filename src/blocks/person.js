import { html, raw, escapeAttr, ziel, markdownBloecke, bildSet } from './_util.js';

export default {
  name: 'person',
  label: 'Person',
  schema: {
    kicker:   { type: 'text',     default: '', label: 'Kleine Zeile darüber' },
    titel:    { type: 'text',     default: '', label: 'Überschrift' },
    ebene:    { type: 'select',   default: '2', options: ['2', '1'], optionLabels: { 2: 'Zwischenüberschrift', 1: 'Hauptüberschrift der Seite (nur eine pro Seite)' }, label: 'Art der Überschrift' },
    text:     { type: 'longtext', default: '', label: 'Text' },
    bild:     { type: 'image',    default: '', label: 'Portrait (optional)' },
    bildAlt:  { type: 'text',     default: '', label: 'Bildbeschreibung (Pflicht, wenn ein Bild gesetzt ist)' },
    ctaLabel: { type: 'text',     default: '', label: 'Knopf-Beschriftung (nachrangig)' },
    ctaHref:  { type: 'text',     default: '', label: 'Knopf-Ziel' },
  },
  css: `
    .person__raster{display:grid;gap:44px}
    .person__text{min-width:0}
    .person__kopf .eyebrow{margin-bottom:14px}
    .person__kopf h1,.person__kopf h2{margin-bottom:24px;max-width:20ch}
    .person__body{max-width:62ch}
    .person__body p{margin:0 0 1em}
    .person__knopf{margin:28px 0 0}
    .person__portrait{width:min(78%,360px);justify-self:center}
    @media(min-width:900px){
      .person:not(.person--bild) .person__text{display:grid;grid-template-columns:minmax(0,5fr) minmax(0,7fr);gap:56px}
      .person:not(.person--bild) .person__kopf h1,.person:not(.person--bild) .person__kopf h2{max-width:14ch}
      .person--bild .person__raster{grid-template-columns:minmax(0,5fr) minmax(0,7fr);gap:80px;align-items:center}
      .person--bild .person__portrait{width:100%;max-width:420px;justify-self:start;order:-1}
    }
  `,
  render(data, ctx = {}) {
    const bild = bildSet(data.bild, { alt: data.bildAlt || ctx.medienAlt?.[data.bild], sizes: '(min-width:900px) 420px, 80vw', eager: data.ebene === '1' });
    const titel = data.titel ? (data.ebene === '1' ? html`<h1>${data.titel}</h1>` : html`<h2>${data.titel}</h2>`) : '';
    return html`
      <section class="section person${bild.value ? ' person--bild' : ''}"><div class="container person__raster">
        <div class="person__text">
          <div class="person__kopf">${data.kicker ? html`<p class="eyebrow">${data.kicker}</p>` : ''}${titel}</div>
          <div class="person__body">
            ${markdownBloecke(data.text)}
            ${data.ctaLabel && ziel(data.ctaHref)
              ? html`<p class="person__knopf"><a class="btn btn--zweit" href="${raw(escapeAttr(ziel(data.ctaHref)))}">${data.ctaLabel}</a></p>` : ''}
          </div>
        </div>
        ${bild.value ? html`<div class="person__portrait portrait"><div class="portrait__bild">${bild}</div></div>` : ''}
      </div></section>`;
  },
};
