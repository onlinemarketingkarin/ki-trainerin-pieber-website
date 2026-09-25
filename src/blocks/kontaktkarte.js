import { html, raw } from './_util.js';
import { baueVcard, VCARD_PFAD } from '../vcard.js';
import { qrSvg } from '../qr.js';

export default {
  name: 'kontaktkarte',
  label: 'Kontaktkarte mit QR-Code',
  schema: {
    kicker:         { type: 'text', default: 'Kontakt speichern', label: 'Kleine Zeile darüber' },
    titel:          { type: 'text', default: '{{facts.name}}', label: 'Überschrift' },
    zeile:          { type: 'text', default: '{{facts.titel}}', label: 'Zeile unter dem Namen' },
    speichernLabel: { type: 'text', default: 'Kontakt speichern', label: 'Knopf: Kontakt speichern' },
    qrHinweis:      { type: 'text', default: 'Mit der Kamera Ihres Smartphones scannen, um den Kontakt direkt zu speichern.', label: 'Hinweis am QR-Code' },
  },
  css: `
    .kk__karte{display:grid;gap:32px;background:var(--akzent-flaeche);border:1px solid color-mix(in srgb,var(--akzent) 22%,transparent);
      border-radius:var(--radius-karte);padding:32px 26px}
    .kk .eyebrow{color:var(--akzent);margin-bottom:12px}
    .kk h2{font-size:clamp(32px,4vw,44px);margin-bottom:6px}
    .kk__zeile{margin:0 0 22px;color:var(--text-gedaempft)}
    .kk__liste{list-style:none;margin:0 0 26px;padding:0}
    .kk__liste li{margin:6px 0}
    .kk__liste a{color:var(--text);font-weight:500;text-underline-offset:3px}
    .kk__liste a:hover{color:var(--signal)}
    .kk__knoepfe{display:flex;flex-wrap:wrap;gap:12px}
    .kk .btn--zweit{color:var(--akzent);border-color:var(--akzent);background:transparent}
    .kk .btn--zweit:hover{background:color-mix(in srgb,var(--akzent) 10%,transparent)}
    .kk__qr{display:none}
    @media(min-width:760px){
      .kk__karte{grid-template-columns:minmax(0,1fr) auto;gap:56px;padding:44px 48px;align-items:center}
      .kk__qr{display:block;text-align:center;max-width:260px}
      .kk__qr svg{display:block;width:220px;height:220px;margin:0 auto 14px;padding:14px;background:var(--grund);
        border-radius:16px;color:var(--text)}
      .kk__qr p{margin:0;font-size:14px;color:var(--text-gedaempft)}
    }
  `,
  render(data, { facts }) {
    const qr = qrSvg(baueVcard(facts), { klasse: 'kk__qrcode', beschreibung: 'QR-Code: speichert die Kontaktdaten auf Ihrem Smartphone' });
    return html`
      <section class="section kk"><div class="container"><div class="kk__karte">
        <div>
          ${data.kicker ? html`<p class="eyebrow">${data.kicker}</p>` : ''}
          <h2>${data.titel}</h2>
          <p class="kk__zeile">${data.zeile}</p>
          <ul class="kk__liste">
            <li><a href="mailto:{{facts.email}}">{{facts.email}}</a></li>
            <li><a href="tel:{{facts.abgeleitet.telefon_link}}">{{facts.telefon}}</a></li>
            <li><a href="{{facts.linkedin}}" rel="noopener">LinkedIn: linkedin.com/in/karin-pieber</a></li>
            <li>{{facts.orte}} · {{facts.sprachen}}</li>
          </ul>
          <div class="kk__knoepfe">
            <a class="btn btn--zweit" href="mailto:{{facts.email}}">E-Mail schreiben</a>
            <a class="btn btn--zweit" href="${VCARD_PFAD}">${data.speichernLabel}</a>
          </div>
        </div>
        <div class="kk__qr">${raw(qr)}<p>${data.qrHinweis}</p></div>
      </div></div></section>`;
  },
};
