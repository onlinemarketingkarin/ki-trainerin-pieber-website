import { loadTheme } from '../config.js';

/** Schriften liegen lokal in public/fonts (keine externen Dienste, so steht es im Datenschutz). */
const SCHRIFTEN = [
  ['Cormorant Garamond', 'normal', 600, 'cormorant-garamond-latin-600-normal'],
  ['Cormorant Garamond', 'italic', 600, 'cormorant-garamond-latin-600-italic'],
  ['Cormorant Garamond', 'italic', 400, 'cormorant-garamond-latin-400-italic'],
  ['DM Sans', 'normal', 400, 'dm-sans-latin-400-normal'],
  ['DM Sans', 'normal', 500, 'dm-sans-latin-500-normal'],
];
const fontFace = SCHRIFTEN.map(([familie, stil, gewicht, datei]) =>
  `@font-face{font-family:'${familie}';font-style:${stil};font-weight:${gewicht};font-display:swap;` +
  `src:url(/fonts/${datei}.woff2) format('woff2')}`).join('');

/** Diese beiden braucht jede Seite sofort, der Rest lädt bei Bedarf. */
export const VORLADEN = ['cormorant-garamond-latin-600-normal', 'dm-sans-latin-400-normal']
  .map((datei) => `/fonts/${datei}.woff2`);

/** Grundgestaltung. Nur Variablen aus config/theme.json, nie eine Farbe direkt. */
const BASIS = `
*,*::before,*::after{box-sizing:border-box}
html{-webkit-text-size-adjust:100%}
body{margin:0;background:var(--grund);color:var(--text);font-family:var(--font-body);font-size:16px;line-height:1.65;-webkit-font-smoothing:antialiased;text-rendering:optimizeLegibility}
img,svg{max-width:100%;height:auto}
h1,h2,h3{font-family:var(--font-display);font-weight:600;color:var(--text);margin:0;font-variant-numeric:lining-nums;text-wrap:balance}
p{text-wrap:pretty}
h1{font-size:clamp(44px,7.2vw,78px);line-height:1.02;letter-spacing:-.01em}
h2{font-size:clamp(34px,4.6vw,52px);line-height:1.06}
h3{font-size:clamp(26px,2.6vw,30px);line-height:1.15}
h4{font:500 17px/1.4 var(--font-body);margin:0}
strong,b{font-weight:500}
a{color:var(--signal)}
ul,ol{margin:0 0 1em;padding-left:1.25em}
li{margin:.4em 0}
li::marker{color:var(--signal)}
a:focus-visible,.btn:focus-visible,summary:focus-visible,button:focus-visible{outline:3px solid var(--akzent);outline-offset:3px;border-radius:6px}
.container{width:100%;max-width:var(--breite);margin:0 auto;padding:0 20px}
.section{padding:56px 0}
.band-creme{background:var(--flaeche)}
.band-mint{background:var(--akzent-flaeche)}
.section:not(.band-creme):not(.band-mint)+.section:not(.band-creme):not(.band-mint){padding-top:0}
.btn{display:inline-flex;align-items:center;justify-content:center;min-height:48px;padding:0 28px;border-radius:var(--radius-knopf);background:var(--signal);border:1px solid var(--signal);color:var(--text-auf-signal);font:500 15px/1.2 var(--font-body);text-align:center;text-decoration:none;transition:filter .15s,background-color .15s}
.btn:hover{filter:brightness(.92)}
.btn--zweit{background:transparent;color:var(--signal)}
.btn--zweit:hover{filter:none;background:color-mix(in srgb,var(--signal) 8%,transparent)}
.link{font-weight:500;text-decoration:none;border-bottom:1px solid color-mix(in srgb,var(--signal) 40%,transparent)}
.link::after{content:" \\203A"}
.link:hover{border-bottom-color:var(--signal)}
.eyebrow{margin:0;font:400 12px/1.4 var(--font-body);letter-spacing:.15em;text-transform:uppercase;color:var(--text-gedaempft)}
.linie{display:block;height:2px;border-radius:2px;background:linear-gradient(to right,var(--signal),var(--signal-hell),transparent)}
.portrait{position:relative;isolation:isolate}
.portrait::before{content:"";position:absolute;inset:7% -5% -4% 14%;border-radius:999px 999px 28px 28px;background:var(--flaeche);z-index:-1}
.portrait__bild{aspect-ratio:4/5;border-radius:999px 999px 28px 28px;overflow:hidden;background:var(--foto-grund);box-shadow:0 0 0 1px var(--linie)}
.portrait__bild img{display:block;width:100%;height:100%;object-fit:cover;object-position:32% 12%}
.skip{position:absolute;left:-9999px;top:8px;background:var(--text);color:var(--grund);padding:10px 16px;border-radius:8px;z-index:20}
.skip:focus{left:8px}
@media (min-width:720px){body{font-size:17px}.container{padding:0 32px}.section{padding:88px 0}}
@media (prefers-reduced-motion:reduce){*{transition:none!important}}
`.replace(/\n/g, '');

/** Tokens → CSS-Variablen. Der Schlüssel in theme.json ist der Variablenname. */
export function themeCss(theme = loadTheme()) {
  const vars = Object.values(theme).flatMap((gruppe) => Object.entries(gruppe).map(([k, v]) => `--${k}:${v}`));
  return `${fontFace}:root{${vars.join(';')}}${BASIS}`;
}
