/** Kleine Hilfe, um DOM zu bauen. Text kommt immer als Textknoten hinein, nie als HTML. */
const EIGENSCHAFTEN = new Set(['value', 'checked', 'disabled', 'selected', 'hidden', 'readOnly', 'required', 'multiple']);

export function h(tag, attrs, ...kinder) {
  const el = document.createElement(tag);
  for (const [k, v] of Object.entries(attrs || {})) {
    if (v == null || v === false) continue;
    if (k === 'class') el.className = v;
    else if (k.startsWith('on') && typeof v === 'function') el.addEventListener(k.slice(2), v);
    else if (EIGENSCHAFTEN.has(k)) el[k] = v;
    else el.setAttribute(k, v === true ? '' : v);
  }
  anhaengen(el, kinder);
  return el;
}

function anhaengen(el, kinder) {
  for (const k of kinder.flat(Infinity)) {
    if (k == null || k === false) continue;
    el.append(k instanceof Node ? k : document.createTextNode(String(k)));
  }
}

export function leere(el, ...kinder) {
  el.replaceChildren();
  anhaengen(el, kinder);
  return el;
}

export const tastenverzoegerung = (fn, ms) => { let t; return (...a) => { clearTimeout(t); t = setTimeout(() => fn(...a), ms); }; };
export const datum = (iso) => { const d = new Date(iso); return Number.isNaN(d.getTime()) ? '' : d.toLocaleString('de-AT', { dateStyle: 'medium', timeStyle: 'short' }); };
export const kopie = (x) => JSON.parse(JSON.stringify(x));
