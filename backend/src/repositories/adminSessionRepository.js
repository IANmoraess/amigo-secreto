/**
 * Persistência das sessões administrativas e das tentativas de login.
 * Todos os instantes são epoch em milissegundos fornecidos pelo chamador.
 */

export async function insertSession(db, { tokenHash, now, expiresAt }) {
  await db
    .prepare(
      'INSERT INTO admin_sessions (token_hash, created_at, last_activity_at, expires_at) VALUES (?, ?, ?, ?)'
    )
    .bind(tokenHash, now, now, expiresAt)
    .run();
}

/** Retorna a sessão somente se ainda não expirou (expiração estrita: expires_at > now). */
export async function findActiveSession(db, tokenHash, now) {
  return db
    .prepare('SELECT token_hash, expires_at FROM admin_sessions WHERE token_hash = ? AND expires_at > ?')
    .bind(tokenHash, now)
    .first();
}

/**
 * Renova a sessão atomicamente. A condição `expires_at > now` impede que uma
 * sessão já expirada seja revivida, mesmo em caso de corrida.
 */
export async function touchSession(db, { tokenHash, now, expiresAt }) {
  const result = await db
    .prepare(
      'UPDATE admin_sessions SET last_activity_at = ?, expires_at = ? WHERE token_hash = ? AND expires_at > ?'
    )
    .bind(now, expiresAt, tokenHash, now)
    .run();
  return result.meta?.changes ?? 0;
}

export async function deleteSession(db, tokenHash) {
  await db.prepare('DELETE FROM admin_sessions WHERE token_hash = ?').bind(tokenHash).run();
}

export async function deleteExpiredSessions(db, now) {
  await db.prepare('DELETE FROM admin_sessions WHERE expires_at <= ?').bind(now).run();
}

export async function getLoginAttempt(db, clientKey) {
  return db
    .prepare('SELECT failed_count, blocked_until FROM admin_login_attempts WHERE client_key = ?')
    .bind(clientKey)
    .first();
}

/**
 * Registra uma tentativa inválida em UMA única instrução atômica (UPSERT).
 * Em SQLite todas as expressões do SET enxergam os valores anteriores da linha, então:
 * - se já bloqueado: nada muda (requisições concorrentes não estendem o bloqueio);
 * - se a janela de contagem expirou: recomeça a sequência em 1;
 * - ao atingir o máximo: zera o contador e define blocked_until = now + lockMs;
 * - caso contrário: incrementa o contador.
 */
export async function registerFailedLoginAttempt(db, { clientKey, now, maxAttempts, lockMs, windowMs }) {
  await db
    .prepare(
      `INSERT INTO admin_login_attempts (client_key, failed_count, blocked_until, updated_at)
       VALUES (?1, 1, 0, ?2)
       ON CONFLICT(client_key) DO UPDATE SET
         failed_count = CASE
           WHEN blocked_until > ?2 THEN failed_count
           WHEN updated_at < ?2 - ?5 THEN 1
           WHEN failed_count + 1 >= ?3 THEN 0
           ELSE failed_count + 1
         END,
         blocked_until = CASE
           WHEN blocked_until > ?2 THEN blocked_until
           WHEN updated_at >= ?2 - ?5 AND failed_count + 1 >= ?3 THEN ?2 + ?4
           ELSE 0
         END,
         updated_at = CASE WHEN blocked_until > ?2 THEN updated_at ELSE ?2 END`
    )
    .bind(clientKey, now, maxAttempts, lockMs, windowMs)
    .run();
}

export async function clearLoginAttempts(db, clientKey) {
  await db.prepare('DELETE FROM admin_login_attempts WHERE client_key = ?').bind(clientKey).run();
}

export async function deleteStaleLoginAttempts(db, { now, olderThan }) {
  await db
    .prepare('DELETE FROM admin_login_attempts WHERE blocked_until <= ? AND updated_at < ?')
    .bind(now, olderThan)
    .run();
}
