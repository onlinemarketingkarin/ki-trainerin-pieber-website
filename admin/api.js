export class ApiFehler extends Error {
  constructor(status, meldung, details = []) { super(meldung); this.status = status; this.details = details || []; }
}

let beiAbmeldung = () => {};
export const bei401 = (fn) => { beiAbmeldung = fn; };

async function anfrage(methode, pfad, { body, headers = {}, roh } = {}) {
  const kopf = { ...headers };
  if (methode !== 'GET') kopf['X-Cockpit'] = '1';
  let daten = body;
  if (body !== undefined && !roh) { kopf['Content-Type'] = 'application/json'; daten = JSON.stringify(body); }
  let antwort;
  try { antwort = await fetch(`/api${pfad}`, { method: methode, headers: kopf, body: daten, credentials: 'same-origin' }); }
  catch { throw new ApiFehler(0, 'Keine Verbindung zum Server.'); }
  let json = null;
  try { json = await antwort.json(); } catch { /* leere Antwort */ }
  if (!antwort.ok) {
    if (antwort.status === 401 && pfad !== '/login') beiAbmeldung();
    throw new ApiFehler(antwort.status, json?.fehler || 'Das hat nicht geklappt.', json?.details);
  }
  return json;
}

export const api = {
  get: (p) => anfrage('GET', p),
  post: (p, body) => anfrage('POST', p, { body }),
  put: (p, body) => anfrage('PUT', p, { body }),
  del: (p, body) => anfrage('DELETE', p, { body }),
  /** Ein Bild hochladen: die Datei geht unverändert als Körper, Name und Beschreibung als Header. */
  hochladen: (datei, alt) => anfrage('POST', '/media', {
    body: datei, roh: true,
    headers: { 'Content-Type': datei.type || 'application/octet-stream', 'X-Dateiname': encodeURIComponent(datei.name), 'X-Alt': encodeURIComponent(alt) },
  }),
};
