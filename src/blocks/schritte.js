import { html, raw, markdownBloecke } from './_util.js';

export default {
  name: 'schritte',
  label: 'Schritte',
  schema: {
    kicker: { type: 'text',     default: '', label: 'Kleine Zeile darüber' },
    titel:  { type: 'text',     default: '', label: 'Überschrift' },
    intro:  { type: 'longtext', default: '', label: 'Einleitung' },
    items: {
      type: 'list', default: [], label: 'Schritte',
      item: {
        titel: { type: 'text',     default: '', label: 'Titel' },
        text:  { type: 'longtext', default: '', label: 'Text' },
      },
    },
  },
  css: `
    .schritte__raster{display:grid;gap:28px}
    .schritte__kopf .eyebrow{margin-bottom:14px}
    .schritte__kopf h2{max-width:14ch}
    .schritte__intro{margin-top:16px;max-width:44ch}
    .schritte__liste{list-style:none;margin:0;padding:0;counter-reset:schritt}
    .schritt{position:relative;margin:0;padding:26px 0 28px 64px;counter-increment:schritt}
    .schritt::before{content:"";position:absolute;top:0;left:0;right:0;height:2px;border-radius:2px;
      background:linear-gradient(to right,var(--signal),var(--signal-hell),transparent)}
    .schritt::after{content:counter(schritt);position:absolute;top:18px;left:0;font:600 46px/1 var(--font-display);
      color:var(--signal);font-variant-numeric:lining-nums}
    .schritt h3{font-size:26px;margin:0 0 8px}
    .schritt p{margin:0;max-width:52ch}
    @media(min-width:900px){.schritte__raster{grid-template-columns:minmax(0,5fr) minmax(0,7fr);gap:56px}
      .schritt{padding-left:76px}.schritt::after{font-size:54px}}
  `,
  render(data) {
    const schritte = (data.items || []).map((s) => html`
      <li class="schritt"><h3>${s.titel}</h3>${markdownBloecke(s.text)}</li>`.value);
    return html`
      <section class="section schritte"><div class="container"><div class="schritte__raster">
        <div class="schritte__kopf">
          ${data.kicker ? html`<p class="eyebrow">${data.kicker}</p>` : ''}
          ${data.titel ? html`<h2>${data.titel}</h2>` : ''}
          ${data.intro ? html`<div class="schritte__intro">${markdownBloecke(data.intro)}</div>` : ''}
        </div>
        <ol class="schritte__liste">${raw(schritte.join(''))}</ol>
      </div></div></section>`;
  },
};
