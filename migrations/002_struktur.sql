CREATE TABLE IF NOT EXISTS navigation (
  id        TEXT PRIMARY KEY,
  parent_id TEXT,
  label     TEXT NOT NULL,
  href      TEXT NOT NULL,
  sort      INTEGER NOT NULL DEFAULT 0,
  visible   INTEGER NOT NULL DEFAULT 1,
  bereich   TEXT NOT NULL DEFAULT 'beide'
);
CREATE TABLE IF NOT EXISTS media (
  id         TEXT PRIMARY KEY,
  file_path  TEXT NOT NULL,
  alt        TEXT,
  bytes      INTEGER,
  created_at TEXT NOT NULL
);
CREATE TABLE IF NOT EXISTS redirects (
  from_path  TEXT PRIMARY KEY,
  to_path    TEXT NOT NULL,
  code       INTEGER NOT NULL DEFAULT 301,
  created_at TEXT NOT NULL
);
CREATE TABLE IF NOT EXISTS submissions (
  id         TEXT PRIMARY KEY,
  form       TEXT NOT NULL,
  page_slug  TEXT,
  daten      TEXT NOT NULL,
  gelesen    INTEGER NOT NULL DEFAULT 0,
  created_at TEXT NOT NULL
);
CREATE TABLE IF NOT EXISTS config_overrides (
  schluessel TEXT PRIMARY KEY,
  wert       TEXT NOT NULL,
  updated_at TEXT NOT NULL
);
