/**
 * Datenzugriff. Weg A: SQLite (Datei). Weg B und die meisten C-Fälle:
 * Postgres (DATABASE_URL). Alles darüber kennt nur query/queryOne, deshalb
 * ist der Umzug ein Umgebungs-Eintrag und keine Migration des Codes.
 *
 * Bringt Weg C eine andere Datenbank mit (MySQL/MariaDB), kommt hier ein
 * dritter Zweig dazu. Er muss genau zwei Dinge können: query und exec.
 * Nichts darüber darf merken, welcher Zweig läuft.
 *
 * node:sqlite ist ab Node 24 ohne Flag dabei (Node 22: --experimental-sqlite).
 * SQLITE_FILE=:memory: legt die Datenbank nur im Arbeitsspeicher an (Tests).
 */
import 'dotenv/config'; // jedes Skript, das die Datenbank anfasst, liest damit dieselbe .env wie der Server
import { readdirSync, readFileSync, mkdirSync } from 'node:fs';
import { dirname, join, resolve } from 'node:path';
import { ROOT } from './paths.js';

const POSTGRES = Boolean(process.env.DATABASE_URL);
export const DB_ART = POSTGRES ? 'postgres' : 'sqlite';
let impl;

if (POSTGRES) {
  const pg = (await import('pg')).default;
  const pool = new pg.Pool({ connectionString: process.env.DATABASE_URL });
  impl = {
    query: async (sql, params = []) => (await pool.query(sql, params)).rows,
    exec: async (sql) => { await pool.query(sql); },
  };
} else {
  const { DatabaseSync } = await import('node:sqlite');
  const eingestellt = process.env.SQLITE_FILE || 'data/site.db';
  const datei = eingestellt === ':memory:' ? eingestellt : resolve(ROOT, eingestellt);
  // SQLite legt fehlende Ordner NICHT an. Ohne diese Zeile scheitert der
  // allererste Start mit ERR_SQLITE_ERROR, und zwar auf jeder Plattform.
  if (datei !== ':memory:') mkdirSync(dirname(datei), { recursive: true });
  const db = new DatabaseSync(datei);
  db.exec('PRAGMA journal_mode = WAL');
  // $1, $2 … → ?1, ?2 …: dasselbe SQL läuft auf beiden Wegen, auch wenn ein
  // Parameter zweimal vorkommt oder die Reihenfolge wechselt.
  const um = (sql) => sql.replace(/\$(\d+)/g, '?$1');
  impl = {
    query: async (sql, params = []) => {
      const s = db.prepare(um(sql));
      return /^\s*(select|with|pragma)/i.test(sql) ? s.all(...params) : (s.run(...params), []);
    },
    exec: async (sql) => db.exec(sql),
  };
}

export const query = impl.query;
export const queryOne = async (sql, params) => (await impl.query(sql, params))[0] || null;

/** Migrationen: idempotent, lexikalisch, mit Tracking. */
export async function runMigrations() {
  const ordner = join(ROOT, 'migrations');
  await impl.exec('CREATE TABLE IF NOT EXISTS schema_migrations (name TEXT PRIMARY KEY)');
  const erledigt = new Set((await impl.query('SELECT name FROM schema_migrations')).map((r) => r.name));
  for (const datei of readdirSync(ordner).filter((f) => f.endsWith('.sql')).sort()) {
    if (erledigt.has(datei)) continue;
    await impl.exec(readFileSync(join(ordner, datei), 'utf8'));
    await impl.query('INSERT INTO schema_migrations (name) VALUES ($1)', [datei]);
    console.log(`[Motor] Migration: ${datei}`);
  }
}
