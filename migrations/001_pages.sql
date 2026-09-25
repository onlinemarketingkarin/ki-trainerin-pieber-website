CREATE TABLE IF NOT EXISTS pages (
  id           TEXT PRIMARY KEY,
  slug         TEXT UNIQUE NOT NULL,
  page_type    TEXT NOT NULL,
  status       TEXT NOT NULL DEFAULT 'draft',
  title        TEXT,
  description  TEXT,
  content_json TEXT NOT NULL DEFAULT '{"blocks":[]}',
  created_at   TEXT NOT NULL,
  updated_at   TEXT NOT NULL
);
CREATE INDEX IF NOT EXISTS pages_status ON pages (status);
