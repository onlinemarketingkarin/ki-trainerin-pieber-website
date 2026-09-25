import { html, raw, escapeAttr, ziel } from './_util.js';
import { logoIcon } from './_logo.js';

export default {
  name: 'nav',
  label: 'Kopfzeile',
  rahmen: true,
  schema: {
    ctaLabel: { type: 'text', default: 'Erstgespräch anfragen', label: 'Knopf-Beschriftung (leer = kein Knopf)' },
    ctaHref:  { type: 'text', default: '/kontakt', label: 'Knopf-Ziel' },
  },
  css: `
    .nav{position:sticky;top:0;z-index:10;background:color-mix(in srgb,var(--grund) 94%,transparent);
      -webkit-backdrop-filter:blur(8px);backdrop-filter:blur(8px);border-bottom:1px solid var(--linie)}
    .nav__zeile{display:flex;flex-wrap:wrap;align-items:center;gap:0 12px;min-height:64px}
    .nav__marke{display:inline-flex;align-items:center;gap:8px;margin-right:auto;color:var(--signal);text-decoration:none;
      font:600 19px/1 var(--font-display);white-space:nowrap}
    .nav__icon{width:26px;height:26px;flex:none}
    .nav__toggle{display:none;align-items:center;gap:10px;min-height:44px;padding:0 4px 0 12px;border:0;background:none;
      color:var(--text);font:500 15px/1 var(--font-body);cursor:pointer}
    .nav__balken{display:block;width:20px;height:2px;border-radius:2px;background:currentColor;position:relative}
    .nav__balken::before,.nav__balken::after{content:"";position:absolute;left:0;width:20px;height:2px;border-radius:2px;background:currentColor}
    .nav__balken::before{top:-6px}.nav__balken::after{top:6px}
    .js .nav__toggle{display:inline-flex}
    .nav__menue{flex-basis:100%;order:5;padding:4px 0 16px}
    .js .nav__menue{display:none}
    .js .nav__menue.offen{display:block}
    .nav__liste{list-style:none;margin:0;padding:0}
    .nav__liste li{margin:0;border-top:1px solid var(--linie)}
    .nav__liste a{display:block;padding:14px 0;color:var(--text);text-decoration:none;font-weight:500}
    .nav__liste a:hover,.nav__liste a[aria-current]{color:var(--signal)}
    .nav__gruppentitel{display:block;padding:14px 0;font-weight:500;color:var(--text-gedaempft)}
    .nav__unter{list-style:none;margin:0;padding:0 0 6px 16px}
    .nav__unter li{border-top:0!important}
    .nav__unter a{padding:8px 0!important;font-weight:400!important}
    .nav__cta{display:none}
    .nav__cta-mobil{border-top:0!important;padding-top:12px}
    .nav__liste .btn{display:flex;padding:0 24px;color:var(--text-auf-signal)}
    .nav__liste .btn:hover{color:var(--text-auf-signal)}
    .nav .btn{min-height:44px;padding:0 20px;font-size:14px}
    @media(min-width:1140px){
      .nav__zeile{flex-wrap:nowrap}
      .nav__toggle{display:none!important}
      .nav__menue,.js .nav__menue{display:block;flex-basis:auto;order:0;padding:0;margin-right:20px}
      .nav__liste{display:flex;gap:22px}
      .nav__liste li{border-top:0}
      .nav__liste a{padding:8px 0;font-size:15px}
      .nav__gruppentitel{padding:8px 0;font-size:15px;color:var(--text)}
      .nav__gruppe{position:relative}
      .nav__unter{display:none;position:absolute;top:100%;left:-18px;min-width:230px;padding:8px 0;background:var(--grund);
        border:1px solid var(--linie);border-radius:14px;box-shadow:0 12px 30px color-mix(in srgb,var(--text) 10%,transparent)}
      .nav__gruppe:hover .nav__unter,.nav__gruppe:focus-within .nav__unter{display:block}
      .nav__unter a{padding:9px 20px!important;white-space:nowrap}
      .nav__cta{display:inline-flex}
      .nav__cta-mobil{display:none}
    }
  `,
  js: `(function(){var d=document,b=d.querySelector('.nav__toggle'),m=d.getElementById('nav-menue');if(!b||!m)return;
    function zu(){m.classList.remove('offen');b.setAttribute('aria-expanded','false')}
    b.addEventListener('click',function(){var o=m.classList.toggle('offen');b.setAttribute('aria-expanded',String(o))});
    d.addEventListener('keydown',function(e){if(e.key==='Escape'&&m.classList.contains('offen')){zu();b.focus()}})})();`,
  render(data) {
    const baum = data.baum || [];
    const knopf = data.ctaLabel && ziel(data.ctaHref) ? raw(escapeAttr(ziel(data.ctaHref))) : null;
    const link = (p) => html`<a href="${raw(escapeAttr(ziel(p.href)))}">${p.label}</a>`.value;
    // Ein Punkt darf auch nur eine Überschrift für sein Untermenü sein (leeres Ziel).
    const punkt = (p) => {
      const kinder = (p.kinder || []).filter((k) => k.label && ziel(k.href));
      const kopf = ziel(p.href) ? link(p) : html`<span class="nav__gruppentitel" tabindex="0">${p.label}</span>`.value;
      const unter = kinder.length ? `<ul class="nav__unter">${kinder.map((k) => `<li>${link(k)}</li>`).join('')}</ul>` : '';
      return `<li${kinder.length ? ' class="nav__gruppe"' : ''}>${kopf}${unter}</li>`;
    };
    const punkte = baum.filter((p) => p.label && (ziel(p.href) || (p.kinder || []).length)).map(punkt).join('');
    return html`
      <header class="nav"><div class="container nav__zeile">
        <a class="nav__marke" href="/">${logoIcon('nav__icon')}<span>{{facts.marke}}</span></a>
        ${baum.length || knopf ? html`<button class="nav__toggle" type="button" aria-expanded="false" aria-controls="nav-menue"><span>Menü</span><span class="nav__balken" aria-hidden="true"></span></button>` : ''}
        ${baum.length || knopf ? html`<nav class="nav__menue" id="nav-menue" aria-label="Hauptnavigation"><ul class="nav__liste">${raw(punkte)}
          ${knopf ? html`<li class="nav__cta-mobil"><a class="btn" href="${knopf}">${data.ctaLabel}</a></li>` : ''}
        </ul></nav>` : ''}
        ${knopf ? html`<a class="btn nav__cta" href="${knopf}">${data.ctaLabel}</a>` : ''}
      </div></header>`;
  },
};
