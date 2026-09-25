import { Router } from 'express';
import { queryOne } from '../db.js';
import { ladeFakten } from '../facts.js';
import { rendereSeite } from '../site.js';
import { baueVcard, VCARD_PFAD } from '../vcard.js';

export const publicRouter = Router();

// Kontakt speichern: dieselbe Kontaktdatei wie im QR-Code, aber vollständig.
publicRouter.get(VCARD_PFAD, async (_req, res, next) => {
  try {
    res.set({ 'Content-Type': 'text/vcard; charset=utf-8', 'Content-Disposition': `inline; filename="${VCARD_PFAD.slice(1)}"` });
    res.send(baueVcard(await ladeFakten(), { voll: true }));
  } catch (err) { next(err); }
});

// Öffentliche Seiten: nur veröffentlichte, mit und ohne Schrägstrich am Ende.
publicRouter.get(/^\/(.*)$/, async (req, res, next) => {
  try {
    const slug = (req.params[0] || 'start').replace(/\/+$/, '') || 'start';
    // Die Startseite gibt es nur unter "/", sonst zwei URLs für denselben Inhalt.
    if (slug === 'start' && req.params[0]) return res.redirect(301, '/');
    const page = await queryOne("SELECT * FROM pages WHERE slug = $1 AND status = 'published'", [slug]);
    if (!page) return next();
    res.type('html').send((await rendereSeite(page)).html);
  } catch (err) { next(err); }
});
