import express from 'express';
import { join } from 'node:path';
import { ROOT, UPLOADS } from './paths.js';
import { DB_ART } from './db.js';
import { apiRouter } from './routes/api.js';
import { formRouter } from './routes/form.js';
import { seoRouter } from './routes/seo.js';
import { cockpitRouter } from './routes/cockpit.js';
import { publicRouter } from './routes/public.js';
import { umleitungsMiddleware } from './redirects.js';

/**
 * Die Anwendung, ohne sie zu starten (die Tests brauchen das). `auth` ist einspeisbar;
 * im Betrieb gilt immer die echte Anmeldung aus src/auth.js. `generatorAufrufen` ersetzt
 * im Test den echten Modell-Aufruf (Stufe 4) — im Betrieb ruft er immer Claude wirklich auf.
 */
export function erstelleApp({ auth, generatorAufrufen } = {}) {
  const app = express();
  app.disable('x-powered-by');
  // Hinter dem Reverse-Proxy (Coolify/Traefik) kommt die echte Adresse und das Protokoll im Header.
  if (process.env.TRUST_PROXY) app.set('trust proxy', Number(process.env.TRUST_PROXY) || 1);
  app.use((_req, res, next) => {
    res.set({
      'X-Content-Type-Options': 'nosniff',
      'Referrer-Policy': 'strict-origin-when-cross-origin',
      'X-Frame-Options': 'SAMEORIGIN',
    });
    next();
  });

  app.use('/uploads', express.static(UPLOADS, { maxAge: '7d', immutable: true }));
  // Schriften, Logo, Favicon. Die Dateinamen der Schriften ändern sich nie, deshalb lange Cache-Zeit.
  app.use(express.static(join(ROOT, 'public'), {
    maxAge: '7d',
    setHeaders: (res, pfad) => { if (pfad.includes('/fonts/')) res.set('Cache-Control', 'public, max-age=31536000, immutable'); },
  }));

  app.get('/health', (_req, res) => res.json({ status: 'ok', db: DB_ART }));

  app.use(cockpitRouter());
  app.use('/api', apiRouter({ ...auth, generatorAufrufen }));   // alles hier drin verlangt die Anmeldung, außer /login und /status
  app.use('/form', formRouter());            // die eine öffentliche Route, die schreibt (Honigtopf, Drosselung)
  app.use(seoRouter);
  app.use(umleitungsMiddleware);             // vor den Seitenrouten, nach den statischen Dateien
  app.use(publicRouter);

  app.use((_req, res) => res.status(404).type('html').send(
    '<!doctype html><html lang="de"><meta charset="utf-8"><meta name="robots" content="noindex">' +
    '<meta name="viewport" content="width=device-width, initial-scale=1"><title>Nicht gefunden</title>' +
    '<h1>Nicht gefunden</h1><p><a href="/">Zur Startseite</a></p></html>'));

  app.use((err, _req, res, _next) => {
    console.error('[Motor] [ERROR]', err);
    res.status(500).type('html').send('<h1>Es ist ein Fehler aufgetreten</h1>');
  });
  return app;
}
