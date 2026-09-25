import { html, raw, escapeAttr, ziel } from './_util.js';
import { logoIcon } from './_logo.js';

const eintrag = (l) => html`<li><a href="${raw(escapeAttr(ziel(l.href)))}">${l.label}</a></li>`.value;
const links = (liste) => raw((liste || []).filter((l) => l.label && ziel(l.href)).map(eintrag).join(''));
/** Navigationsbaum: Untermenüs erscheinen als eingerückte Liste unter ihrem Punkt. */
const baumLinks = (baum) => raw((baum || []).filter((p) => p.label).map((p) => {
  const kinder = (p.kinder || []).filter((k) => k.label && ziel(k.href));
  const kopf = ziel(p.href) ? eintrag(p).replace(/<\/li>$/, '') : `<li>${html`${p.label}`.value}`;
  return `${kopf}${kinder.length ? `<ul class="fuss__unter">${kinder.map(eintrag).join('')}</ul>` : ''}</li>`;
}).join(''));

export default {
  name: 'footer',
  label: 'Fußzeile',
  rahmen: true,
  schema: {
    claim: { type: 'text', default: 'Menschen · Technologie · Gesundheit · Für eine lebenswerte Zukunft', label: 'Leitsatz' },
    rechtsLinks: {
      type: 'list', label: 'Rechtliches',
      default: [{ label: 'Impressum', href: '/impressum' }, { label: 'Datenschutz', href: '/datenschutz' }],
      item: { label: { type: 'text', default: '' }, href: { type: 'text', default: '' } },
    },
  },
  css: `
    .fuss{background:var(--text);color:var(--flaeche);padding:56px 0 32px;font-size:15px}
    .fuss a{color:var(--flaeche)}
    .fuss a:hover{color:var(--signal-hell)}
    .fuss__raster{display:grid;gap:32px;grid-template-columns:1fr}
    .fuss__marke{display:inline-flex;align-items:center;gap:10px;color:var(--signal-hell)!important;text-decoration:none;
      font:600 26px/1 var(--font-display)}
    .fuss__icon{width:30px;height:30px;flex:none}
    .fuss__zeile{margin:16px 0 4px}
    .fuss__claim{margin:0;color:color-mix(in srgb,var(--flaeche) 72%,transparent);font-size:14px}
    .fuss__kopf{margin:0 0 12px;font:400 12px/1.4 var(--font-body);letter-spacing:.15em;text-transform:uppercase;
      color:color-mix(in srgb,var(--flaeche) 72%,transparent)}
    .fuss ul{list-style:none;margin:0;padding:0}
    .fuss li{margin:8px 0}
    .fuss li::marker{content:""}
    .fuss__unter{margin:4px 0 0 14px!important}
    .fuss__unter li{margin:4px 0!important;font-size:14px}
    .fuss__unten{display:flex;flex-wrap:wrap;gap:12px 24px;justify-content:space-between;margin-top:40px;padding-top:20px;
      border-top:1px solid color-mix(in srgb,var(--flaeche) 20%,transparent);font-size:14px;
      color:color-mix(in srgb,var(--flaeche) 72%,transparent)}
    .fuss__unten ul{display:flex;gap:20px}
    @media(min-width:800px){.fuss__raster{grid-template-columns:1.4fr 1fr 1fr}}
  `,
  render(data) {
    const baum = data.baum || [];
    return html`
      <footer class="fuss"><div class="container">
        <div class="fuss__raster">
          <div>
            <a class="fuss__marke" href="/">${logoIcon('fuss__icon')}<span>{{facts.marke}}</span></a>
            <p class="fuss__zeile">{{facts.titel}}</p>
            <p class="fuss__claim">${data.claim}</p>
          </div>
          ${baum.length ? html`<nav aria-label="Seiten"><p class="fuss__kopf">Seiten</p><ul>${baumLinks(baum)}</ul></nav>` : ''}
          <div>
            <p class="fuss__kopf">Kontakt</p>
            <ul>
              <li><a href="mailto:{{facts.email}}">{{facts.email}}</a></li>
              <li><a href="tel:{{facts.abgeleitet.telefon_link}}">{{facts.telefon}}</a></li>
              <li><a href="{{facts.linkedin}}" rel="noopener">LinkedIn</a></li>
              <li>{{facts.orte}} · {{facts.sprachen}}</li>
            </ul>
          </div>
        </div>
        <div class="fuss__unten">
          <span>© {{facts.name}}</span>
          <ul>${links(data.rechtsLinks)}</ul>
        </div>
      </div></footer>`;
  },
};
