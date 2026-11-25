-- Migration inicial: estrutura do banco de dados do Amigo Secreto (Cloudflare D1 / SQLite)

CREATE TABLE IF NOT EXISTS events (
  id TEXT PRIMARY KEY,
  name TEXT NOT NULL,
  status TEXT NOT NULL DEFAULT 'draft' CHECK (status IN ('draft', 'completed')),
  created_at TEXT NOT NULL DEFAULT (strftime('%Y-%m-%dT%H:%M:%fZ', 'now')),
  drawn_at TEXT
);

CREATE TABLE IF NOT EXISTS participants (
  id TEXT PRIMARY KEY,
  event_id TEXT NOT NULL,
  name TEXT NOT NULL,
  token_hash TEXT UNIQUE,
  has_revealed INTEGER NOT NULL DEFAULT 0 CHECK (has_revealed IN (0, 1)),
  created_at TEXT NOT NULL DEFAULT (strftime('%Y-%m-%dT%H:%M:%fZ', 'now')),
  FOREIGN KEY (event_id) REFERENCES events(id) ON DELETE CASCADE
);

CREATE TABLE IF NOT EXISTS draws (
  id TEXT PRIMARY KEY,
  event_id TEXT NOT NULL,
  giver_id TEXT NOT NULL,
  receiver_id TEXT NOT NULL,
  created_at TEXT NOT NULL DEFAULT (strftime('%Y-%m-%dT%H:%M:%fZ', 'now')),
  CHECK (giver_id != receiver_id),
  UNIQUE (event_id, giver_id),
  UNIQUE (event_id, receiver_id),
  FOREIGN KEY (event_id) REFERENCES events(id) ON DELETE CASCADE,
  FOREIGN KEY (giver_id) REFERENCES participants(id) ON DELETE RESTRICT,
  FOREIGN KEY (receiver_id) REFERENCES participants(id) ON DELETE RESTRICT
);

-- Índices para consultas frequentes
CREATE INDEX IF NOT EXISTS idx_participants_event_id ON participants(event_id);
CREATE INDEX IF NOT EXISTS idx_draws_event_id ON draws(event_id);
CREATE INDEX IF NOT EXISTS idx_draws_giver_id ON draws(giver_id);
