import { html, raw, escapeHtml, escapeAttr, ziel, markdownBloecke, bildSet } from './_util.js';

/** Ein Zeilenumbruch im Titel ("\n") wird zu <br>: der Mensch bestimmt, wo der Satz atmet. */
const zeilen = (t) => raw(String(t ?? '').split('\n').map(escapeHtml).join('<br>'));

export default {
  name: 'hero',
  label: 'Aufmacher',
  schema: {
    pill:      { type: 'text',     default: '', label: 'Kleine Zeile darüber' },
    titel:     { type: 'text',     default: '', label: 'Überschrift (Zeilenumbruch erlaubt)', mehrzeilig: true },
    sub:       { type: 'longtext', default: '', label: 'Untertitel' },
    ctaLabel:  { type: 'text',     default: '', label: 'Knopf-Beschriftung' },
    ctaHref:   { type: 'text',     default: '', label: 'Knopf-Ziel' },
    links: {
      type: 'list', default: [], label: 'Weitere Wege (Textlinks, keine Knöpfe)',
      item: { label: { type: 'text', default: '' }, href: { type: 'text', default: '' } },
    },
    vertrauen: { type: 'text',     default: '', label: 'Vertrauenszeile' },
    bild:      { type: 'image',    default: '', label: 'Bild (optional)' },
    bildAlt:   { type: 'text',     default: '', label: 'Bildbeschreibung (Pflicht, wenn ein Bild gesetzt ist)' },
  },
  css: `
    .hero{position:relative;overflow:hidden;padding:48px 0 40px}
    .hero:not(.hero--bild)::before{content:"";position:absolute;right:-140px;top:-160px;width:440px;height:440px;border-radius:50%;
      background:color-mix(in srgb,var(--signal) 6%,transparent);pointer-events:none}
    .hero__raster{position:relative;display:grid;gap:44px}
    .hero__strich{display:block;width:24px;height:2px;border-radius:2px;background:var(--signal);margin:0 0 20px}
    .hero__pill{margin:0 0 18px}
    .hero__titel{font-size:clamp(42px,6.2vw,70px);margin:0 0 24px}
    .hero__sub{max-width:54ch}
    .hero__sub p{margin:0 0 1em;font-size:18px;line-height:1.6}
    .hero__cta{margin:32px 0 0}
    .hero__links{display:flex;flex-wrap:wrap;gap:8px 28px;margin:22px 0 0}
    .hero__links .link{font-size:15px}
    .hero__vertrauen{margin:32px 0 0;padding-top:20px;font-size:14px;color:var(--text-gedaempft);max-width:56ch;position:relative}
    .hero__vertrauen::before{content:"";position:absolute;top:0;left:0;width:96px;height:2px;border-radius:2px;
      background:linear-gradient(to right,var(--signal),var(--signal-hell),transparent)}
    .hero__portrait{width:min(78%,360px);justify-self:center}
    @media(min-width:720px){.hero{padding:88px 0 72px}.hero__sub p{font-size:20px}}
    @media(min-width:960px){
      .hero--bild .hero__raster{grid-template-columns:minmax(0,1.25fr) minmax(0,.75fr);align-items:center;gap:72px}
      .hero__portrait{width:100%;max-width:400px;justify-self:end}
    }
  `,
  render(data, ctx = {}) {
    const bild = bildSet(data.bild, { alt: data.bildAlt || ctx.medienAlt?.[data.bild], sizes: '(min-width:960px) 400px, 80vw', eager: true });
    const links = (data.links || []).filter((l) => l.label && ziel(l.href))
      .map((l) => html`<a class="link" href="${raw(escapeAttr(ziel(l.href)))}">${l.label}</a>`.value).join('');
    return html`
      <section class="hero${bild.value ? ' hero--bild' : ''}"><div class="container hero__raster">
        <div class="hero__text">
          <span class="hero__strich" aria-hidden="true"></span>
          ${data.pill ? html`<p class="eyebrow hero__pill">${data.pill}</p>` : ''}
          <h1 class="hero__titel">${zeilen(data.titel)}</h1>
          ${data.sub ? html`<div class="hero__sub">${markdownBloecke(data.sub)}</div>` : ''}
          ${data.ctaLabel && ziel(data.ctaHref)
            ? html`<p class="hero__cta"><a class="btn" href="${raw(escapeAttr(ziel(data.ctaHref)))}">${data.ctaLabel}</a></p>` : ''}
          ${links ? html`<p class="hero__links">${raw(links)}</p>` : ''}
          ${data.vertrauen ? html`<p class="hero__vertrauen">${data.vertrauen}</p>` : ''}
        </div>
        ${bild.value ? html`<div class="hero__portrait portrait"><div class="portrait__bild">${bild}</div></div>` : ''}
      </div></section>`;
  },
};
