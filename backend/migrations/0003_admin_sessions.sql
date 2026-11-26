-- Migration 0003: sessões administrativas revogáveis e controle de tentativas de login.
-- Todos os instantes são epoch em milissegundos (INTEGER), definidos pelo Worker.

-- Sessão opaca do organizador. Apenas o hash SHA-256 do token é armazenado.
CREATE TABLE IF NOT EXISTS admin_sessions (
  token_hash TEXT PRIMARY KEY,
  created_at INTEGER NOT NULL,
  last_activity_at INTEGER NOT NULL,
  expires_at INTEGER NOT NULL
);

CREATE INDEX IF NOT EXISTS idx_admin_sessions_expires_at ON admin_sessions (expires_at);

-- Contador de tentativas inválidas por cliente (hash do IP), compartilhado entre
-- todas as instâncias do Worker. Atualizado de forma atômica via UPSERT.
CREATE TABLE IF NOT EXISTS admin_login_attempts (
  client_key TEXT PRIMARY KEY,
  failed_count INTEGER NOT NULL DEFAULT 0,
  blocked_until INTEGER NOT NULL DEFAULT 0,
  updated_at INTEGER NOT NULL
);
