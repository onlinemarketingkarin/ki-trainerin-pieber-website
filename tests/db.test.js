import { test } from 'node:test';
import assert from 'node:assert/strict';

// Nur im Arbeitsspeicher: keine Datei, kein Server, kein Schlüssel.
process.env.SQLITE_FILE = ':memory:';
delete process.env.DATABASE_URL;
const { runMigrations, query, queryOne } = await import('../src/db.js');

test('Migrationen laufen und sind idempotent', async () => {
  await runMigrations();
  await runMigrations();
  assert.equal((await query("SELECT name FROM sqlite_master WHERE type = 'table' AND name = 'pages'")).length, 1);
  const dateien = (await import('node:fs')).readdirSync(new URL('../migrations', import.meta.url)).filter((f) => f.endsWith('.sql'));
  assert.equal((await query('SELECT name FROM schema_migrations')).length, dateien.length);
  assert.equal((await query("SELECT name FROM sqlite_master WHERE type = 'table' AND name = 'navigation'")).length, 1);
});

test('$n-Parameter: wiederverwendbar und in beliebiger Reihenfolge', async () => {
  const zeile = await queryOne('SELECT $2 AS b, $1 AS a, $1 AS c', ['x', 'y']);
  assert.deepEqual({ ...zeile }, { b: 'y', a: 'x', c: 'x' });
});

test('Schreiben und Lesen einer Seite', async () => {
  await query(
    `INSERT INTO pages (id, slug, page_type, title, created_at, updated_at) VALUES ($1, $2, $3, $4, $5, $5)`,
    ['1', 'test', 'home', 'Titel', '2026-01-01']);
  const seite = await queryOne('SELECT slug, status, content_json FROM pages WHERE slug = $1', ['test']);
  assert.equal(seite.status, 'draft');
  assert.equal(seite.content_json, '{"blocks":[]}');
});
