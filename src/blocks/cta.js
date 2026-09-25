import { html, raw, escapeAttr, ziel, markdownBloecke } from './_util.js';

export default {
  name: 'cta',
  label: 'Handlungsaufruf',
  schema: {
    titel:    { type: 'text',     default: '', label: 'Überschrift' },
    text:     { type: 'longtext', default: '', label: 'Text' },
    ctaLabel: { type: 'text',     default: '', label: 'Knopf-Beschriftung' },
    ctaHref:  { type: 'text',     default: '', label: 'Knopf-Ziel' },
  },
  css: `
    .cta{text-align:center}
    .cta__innen{max-width:640px;margin:0 auto}
    .cta h2{margin:0 0 18px}
    .cta p{margin:0 0 1em}
    .cta__knopf{margin-top:28px}
  `,
  render(data) {
    return html`
      <section class="section cta band-creme"><div class="container"><div class="cta__innen">
        ${data.titel ? html`<h2>${data.titel}</h2>` : ''}
        ${markdownBloecke(data.text)}
        ${data.ctaLabel && ziel(data.ctaHref)
          ? html`<p class="cta__knopf"><a class="btn" href="${raw(escapeAttr(ziel(data.ctaHref)))}">${data.ctaLabel}</a></p>`
          : ''}
      </div></div></section>`;
  },
};
