import 'dotenv/config';
import { runMigrations, DB_ART } from './src/db.js';
import { erstelleApp } from './src/app.js';
import { anmeldungMoeglich } from './src/auth.js';

await runMigrations();
const app = erstelleApp();

const port = process.env.PORT || 3000;
app.listen(port, () => {
  console.log(`[Motor] läuft auf http://localhost:${port} (${DB_ART})`);
  if (!anmeldungMoeglich()) console.warn('[Motor] [WARN] ADMIN_PASSWORD fehlt oder ist kürzer als 8 Zeichen: das Cockpit unter /cockpit ist gesperrt.');
});
