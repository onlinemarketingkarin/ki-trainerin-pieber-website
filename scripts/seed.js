/**
 * Seiten, Navigation und Bilder aus content/ in die Datenbank laden.
 *   npm run seed             legt nur an, was fehlt (P5: nichts Bearbeitetes wird überschrieben)
 *   npm run seed -- --force  überschreibt Seiten und ersetzt die Navigation
 * Impressum und Datenschutz bleiben Entwurf, bis ihre Fakten stimmen und sie im Cockpit veröffentlicht werden.
 */
import { runMigrations } from '../src/db.js';
import { seedeInhalte } from '../src/seed.js';

await runMigrations();
await seedeInhalte({ force: process.argv.includes('--force'), log: (t) => console.log(`[Seed] ${t}`) });
process.exit(0);
