import { html, raw, markdownBloecke } from './_util.js';

export default {
  name: 'faq',
  label: 'Häufige Fragen',
  schema: {
    kicker: { type: 'text', default: '', label: 'Kleine Zeile darüber' },
    titel:  { type: 'text', default: 'Häufige Fragen', label: 'Überschrift' },
    items: {
      type: 'list', default: [], label: 'Fragen',
      item: {
        frage:   { type: 'text',     default: '', label: 'Frage' },
        antwort: { type: 'longtext', default: '', label: 'Antwort' },
      },
    },
  },
  css: `
    .faq__raster{display:grid;gap:28px}
    .faq__kopf .eyebrow{margin-bottom:14px}
    .faq__kopf h2{max-width:12ch}
    .faq__liste{border-bottom:1px solid var(--linie)}
    .faq__punkt{border-top:1px solid var(--linie)}
    .faq__punkt summary{display:flex;justify-content:space-between;align-items:center;gap:20px;padding:22px 0;cursor:pointer;
      list-style:none;font:600 24px/1.2 var(--font-display);color:var(--text)}
    .faq__punkt summary::-webkit-details-marker{display:none}
    .faq__punkt summary::after{content:"+";flex:none;width:32px;height:32px;display:grid;place-items:center;border-radius:50%;
      border:1px solid var(--linie);font:400 20px/1 var(--font-body);color:var(--signal)}
    .faq__punkt[open] summary::after{content:"\\2212"}
    .faq__punkt summary:hover{color:var(--signal)}
    .faq__antwort{padding:0 52px 24px 0;max-width:60ch}
    .faq__antwort p{margin:0 0 1em}
    @media(min-width:900px){.faq__raster{grid-template-columns:minmax(0,5fr) minmax(0,7fr);gap:56px}}
  `,
  render(data) {
    const fragen = (data.items || []).map((f) => html`
      <details class="faq__punkt"><summary>${f.frage}</summary>
        <div class="faq__antwort">${markdownBloecke(f.antwort)}</div></details>`.value);
    return html`
      <section class="section faq"><div class="container"><div class="faq__raster">
        <div class="faq__kopf">
          ${data.kicker ? html`<p class="eyebrow">${data.kicker}</p>` : ''}
          ${data.titel ? html`<h2>${data.titel}</h2>` : ''}
        </div>
        <div class="faq__liste">${raw(fragen.join(''))}</div>
      </div></div></section>`;
  },
};
