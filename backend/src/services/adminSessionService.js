import {
  clearLoginAttempts,
  deleteExpiredSessions,
  deleteSession,
  deleteStaleLoginAttempts,
  findActiveSession,
  getLoginAttempt,
  insertSession,
  registerFailedLoginAttempt,
  touchSession,
} from '../repositories/adminSessionRepository.js';
import { generateSecureToken, hashToken, timingSafeEqual } from '../utils/crypto.js';

/** Inatividade máxima da sessão. Não existe limite de duração total. */
export const SESSION_IDLE_TIMEOUT_MS = 15 * 60 * 1000;
export const LOGIN_MAX_ATTEMPTS = 3;
export const LOGIN_LOCK_MS = 60 * 1000;
/** Tentativas inválidas mais antigas que isto deixam de contar para o bloqueio. */
export const LOGIN_ATTEMPT_WINDOW_MS = 15 * 60 * 1000;

const SESSION_TOKEN_REGEX = /^[A-Za-z0-9_-]{20,128}$/;

function secondsUntil(timestamp, now) {
  return Math.max(1, Math.ceil((timestamp - now) / 1000));
}

/** O IP nunca é gravado em texto puro: usa-se apenas o hash como chave do contador. */
async function buildClientKey(clientId) {
  return `ip:${await hashToken(clientId)}`;
}

/**
 * Autentica a chave administrativa e, se válida, cria uma sessão opaca.
 * Resultado: `ok` | `invalid` | `blocked`. O limite de tentativas vive no D1,
 * portanto vale para todas as abas, instâncias do Worker e recarregamentos.
 */
export async function loginAdminService(
  db,
  { providedKey, configuredKey, clientId, now = Date.now() }
) {
  const clientKey = await buildClientKey(clientId);

  const current = await getLoginAttempt(db, clientKey);
  if (current && current.blocked_until > now) {
    return {
      status: 'blocked',
      justBlocked: false,
      retryAfterSeconds: secondsUntil(current.blocked_until, now),
    };
  }

  const isValid = await timingSafeEqual(providedKey, configuredKey);

  if (!isValid) {
    await registerFailedLoginAttempt(db, {
      clientKey,
      now,
      maxAttempts: LOGIN_MAX_ATTEMPTS,
      lockMs: LOGIN_LOCK_MS,
      windowMs: LOGIN_ATTEMPT_WINDOW_MS,
    });
    const updated = await getLoginAttempt(db, clientKey);

    if (updated && updated.blocked_until > now) {
      return {
        status: 'blocked',
        justBlocked: true,
        retryAfterSeconds: secondsUntil(updated.blocked_until, now),
      };
    }

    return {
      status: 'invalid',
      attemptsRemaining: Math.max(0, LOGIN_MAX_ATTEMPTS - (updated?.failed_count ?? 1)),
    };
  }

  await clearLoginAttempts(db, clientKey);
  await deleteExpiredSessions(db, now);
  await deleteStaleLoginAttempts(db, { now, olderThan: now - LOGIN_ATTEMPT_WINDOW_MS });

  const sessionToken = generateSecureToken(32);
  const tokenHash = await hashToken(sessionToken);
  await insertSession(db, { tokenHash, now, expiresAt: now + SESSION_IDLE_TIMEOUT_MS });

  return {
    status: 'ok',
    sessionToken,
    expiresInSeconds: SESSION_IDLE_TIMEOUT_MS / 1000,
  };
}

/**
 * Valida o token de sessão SEM renová-lo. Consultas comuns (inclusive o polling)
 * apenas leem a sessão; a renovação só ocorre em `touchAdminSessionService`.
 */
export async function validateAdminSessionService(db, token, now = Date.now()) {
  if (typeof token !== 'string' || !SESSION_TOKEN_REGEX.test(token)) {
    return null;
  }

  const tokenHash = await hashToken(token);
  const session = await findActiveSession(db, tokenHash, now);
  if (!session) {
    return null;
  }

  return { tokenHash, expiresAt: session.expires_at };
}

/** Renova a inatividade de uma sessão ainda válida. Retorna null se expirou ou foi revogada. */
export async function touchAdminSessionService(db, tokenHash, now = Date.now()) {
  const changed = await touchSession(db, {
    tokenHash,
    now,
    expiresAt: now + SESSION_IDLE_TIMEOUT_MS,
  });

  if (changed !== 1) {
    return null;
  }

  return { expiresInSeconds: SESSION_IDLE_TIMEOUT_MS / 1000 };
}

export async function revokeAdminSessionService(db, tokenHash) {
  await deleteSession(db, tokenHash);
}
