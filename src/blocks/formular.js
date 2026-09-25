import { html, raw, markdownBloecke } from './_util.js';
import { INTERESSEN } from '../mail.js';

export default {
  name: 'formular',
  label: 'Anfrageformular',
  schema: {
    titel:       { type: 'text',     default: 'Ihre Anfrage', label: 'Überschrift' },
    intro:       { type: 'longtext', default: '', label: 'Einleitung' },
    sendenLabel: { type: 'text',     default: 'Anfrage senden', label: 'Knopf-Beschriftung' },
    hinweis:     { type: 'longtext', default: 'Ihre Angaben werden nur verwendet, um Ihre Anfrage zu beantworten. Mehr dazu in der [Datenschutzerklärung](/datenschutz).', label: 'Datenschutzhinweis' },
  },
  css: `
    .formular__raster{display:grid;gap:28px}
    .formular__kopf h2{max-width:12ch;margin-bottom:16px}
    .formular__kopf p{margin:0 0 1em;max-width:44ch}
    .formular__form{display:grid;gap:18px;max-width:640px}
    .formular__feld{display:grid;gap:6px;margin:0}
    .formular__feld label{font-weight:500;font-size:15px}
    .formular__feld input,.formular__feld select,.formular__feld textarea{width:100%;min-height:48px;padding:12px 16px;border:1px solid color-mix(in srgb,var(--text-gedaempft) 55%,transparent);
      border-radius:14px;background:var(--foto-grund);color:var(--text);font:400 16px/1.5 var(--font-body)}
    .formular__feld textarea{min-height:150px;resize:vertical}
    .formular__feld input:focus,.formular__feld select:focus,.formular__feld textarea:focus{outline:3px solid color-mix(in srgb,var(--akzent) 45%,transparent);outline-offset:1px;border-color:var(--akzent)}
    .formular__hp{position:absolute;left:-9999px;width:1px;height:1px;overflow:hidden}
    .formular__knopf{margin:6px 0 0}
    .formular__knopf .btn{cursor:pointer}
    .formular__knopf .btn[disabled]{opacity:.6;cursor:wait}
    .formular__hinweis{margin:0;font-size:14px;color:var(--text-gedaempft);max-width:54ch}
    .formular__hinweis p{margin:0}
    .formular__status{margin:0;min-height:1.4em;font-size:15px;color:var(--signal)}
    .formular__danke{margin:0;padding:24px 26px;border-radius:var(--radius-karte);background:var(--akzent-flaeche);color:var(--text);font-size:18px}
    .formular__karte{max-width:640px;padding:28px 26px;border-radius:var(--radius-karte);background:var(--flaeche)}
    @media(min-width:900px){.formular__raster{grid-template-columns:minmax(0,5fr) minmax(0,7fr);gap:56px}}
  `,
  js: `(function(){var f=document.querySelector('.formular__form');if(!f)return;
    var q=new URLSearchParams(location.search).get('interesse'),s=f.elements.interesse;
    if(q&&s){for(var i=0;i<s.options.length;i++){if(s.options[i].value===q){s.value=q}}}
    if(f.elements.seite){f.elements.seite.value=location.pathname.replace(/^\\//,'')||'start'}
    f.addEventListener('submit',function(e){e.preventDefault();
      var st=f.querySelector('.formular__status'),b=f.querySelector('button');
      if(!f.checkValidity()){f.reportValidity();return}
      b.disabled=true;st.textContent='Wird gesendet …';
      var d={};new FormData(f).forEach(function(v,k){d[k]=v});
      fetch(f.action,{method:'POST',headers:{'Content-Type':'application/json','Accept':'application/json'},body:JSON.stringify(d)})
        .then(function(r){return r.json().then(function(j){return{ok:r.ok,j:j}})})
        .then(function(x){if(x.ok){f.innerHTML='<p class="formular__danke" role="status">Vielen Dank. Ihre Anfrage ist bei mir angekommen. Ich melde mich persönlich bei Ihnen.</p>'}
          else{b.disabled=false;st.textContent=(x.j&&x.j.fehler)||'Das hat leider nicht geklappt.'}})
        .catch(function(){b.disabled=false;st.textContent='Das hat leider nicht geklappt. Bitte schreiben Sie mir direkt per E-Mail.'})})})();`,
  render(data, ctx = {}) {
    const kopf = html`<div class="formular__kopf"><h2>${data.titel}</h2>${data.intro ? markdownBloecke(data.intro) : ''}</div>`;
    // Ohne Datenschutzangaben (Speicherdauer) nimmt das Formular keine Daten an. Dann bleibt der direkte Weg.
    if (!ctx.facts?.kontaktformular?.speicherdauer) {
      return html`<section class="section formular" id="anfrage"><div class="container"><div class="formular__karte">
        <h2>${data.titel}</h2>
        <p>Das Anfrageformular ist gerade nicht verfügbar. Bitte schreiben Sie mir direkt: <a href="mailto:{{facts.email}}">{{facts.email}}</a></p>
      </div></div></section>`;
    }
    const optionen = Object.entries(INTERESSEN).map(([wert, label]) => html`<option value="${wert}">${label}</option>`.value).join('');
    return html`
      <section class="section formular" id="anfrage"><div class="container"><div class="formular__raster">
        ${kopf}
        <form class="formular__form" method="post" action="/form/anfrage">
          <p class="formular__feld"><label for="f-name">Name *</label><input id="f-name" name="name" required minlength="2" maxlength="120" autocomplete="name"></p>
          <p class="formular__feld"><label for="f-email">E-Mail-Adresse *</label><input id="f-email" name="email" type="email" required maxlength="200" autocomplete="email"></p>
          <p class="formular__feld"><label for="f-org">Organisation (optional)</label><input id="f-org" name="organisation" maxlength="200" autocomplete="organization"></p>
          <p class="formular__feld"><label for="f-int">Ihr Interesse (optional)</label><select id="f-int" name="interesse"><option value="">Bitte wählen</option>${raw(optionen)}</select></p>
          <p class="formular__feld"><label for="f-msg">Ihre Nachricht *</label><textarea id="f-msg" name="nachricht" required minlength="5" maxlength="4000"></textarea></p>
          <p class="formular__hp" aria-hidden="true"><label>Website<input name="website" tabindex="-1" autocomplete="off"></label></p>
          <input type="hidden" name="seite" value="">
          <p class="formular__knopf"><button class="btn" type="submit">${data.sendenLabel}</button></p>
          <p class="formular__status" role="status" aria-live="polite"></p>
          <div class="formular__hinweis">${markdownBloecke(data.hinweis)}</div>
        </form>
      </div></div></section>`;
  },
};
