import { html, raw, escapeAttr, ziel, markdownBloecke } from './_util.js';

export default {
  name: 'cards',
  label: 'Karten',
  schema: {
    kicker: { type: 'text',     default: '', label: 'Kleine Zeile darüber' },
    titel:  { type: 'text',     default: '', label: 'Überschrift' },
    intro:  { type: 'longtext', default: '', label: 'Einleitung' },
    items: {
      type: 'list', default: [], label: 'Karten',
      item: {
        titel:     { type: 'text',     default: '', label: 'Titel' },
        text:      { type: 'longtext', default: '', label: 'Text' },
        linkLabel: { type: 'text',     default: '', label: 'Link- oder Knopf-Beschriftung (optional)' },
        href:      { type: 'text',     default: '', label: 'Ziel' },
        stil:      { type: 'select',   default: 'link', options: ['link', 'knopf'], optionLabels: { link: 'Textlink', knopf: 'Knopf' }, label: 'Darstellung des Ziels' },
      },
    },
  },
  css: `
    .cards__kopf{max-width:60ch;margin-bottom:36px}
    .cards__kopf .eyebrow{margin-bottom:14px}
    .cards__kopf h2{max-width:18ch}
    .cards__intro{margin-top:16px}
    .cards__intro p{margin:0 0 1em}
    .cards__raster{display:grid;gap:16px;grid-template-columns:1fr}
    .karte{display:flex;flex-direction:column;background:var(--flaeche);border:1px solid var(--linie);
      border-radius:var(--radius-karte);padding:28px 26px 30px}
    .karte h3{margin:0 0 14px}
    .karte p{margin:0 0 1em}
    .karte ul{margin-bottom:0}
    .karte__fuss{margin-top:auto;padding-top:22px}
    .karte__fuss p{margin:0}
    @media(min-width:800px){.cards__raster{grid-template-columns:repeat(auto-fit,minmax(290px,1fr));gap:24px}
      .karte{padding:34px 32px 36px}}
  `,
  render(data) {
    const karten = (data.items || []).map((k) => {
      const ok = k.linkLabel && ziel(k.href);
      const ziele = ok ? raw(escapeAttr(ziel(k.href))) : null;
      return html`
        <article class="karte">
          <h3>${k.titel}</h3>
          ${markdownBloecke(k.text)}
          ${ok ? html`<div class="karte__fuss"><p>${k.stil === 'knopf'
            ? html`<a class="btn btn--zweit" href="${ziele}">${k.linkLabel}</a>`
            : html`<a class="link" href="${ziele}">${k.linkLabel}</a>`}</p></div>` : ''}
        </article>`.value;
    });
    return html`
      <section class="section cards"><div class="container">
        ${data.titel || data.kicker || data.intro ? html`<div class="cards__kopf">
          ${data.kicker ? html`<p class="eyebrow">${data.kicker}</p>` : ''}
          ${data.titel ? html`<h2>${data.titel}</h2>` : ''}
          ${data.intro ? html`<div class="cards__intro">${markdownBloecke(data.intro)}</div>` : ''}
        </div>` : ''}
        <div class="cards__raster">${raw(karten.join(''))}</div>
      </div></section>`;
  },
};
