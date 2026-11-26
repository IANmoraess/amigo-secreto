import { HTTPException } from 'hono/http-exception';
import { loginAdminService } from '../services/adminSessionService.js';
import { parseJsonBody } from '../utils/validation.js';

const MAX_KEY_LENGTH = 256;

/**
 * POST /api/admin/login - Troca a chave administrativa por uma sessão temporária.
 * Rota pública (não passa por `adminAuth`); protegida pelo limite de tentativas
 * persistido no D1 (3 inválidas => bloqueio de 60 s por cliente).
 */
export async function adminLoginHandler(c) {
  const configuredKey = c.env?.ADMIN_TOKEN;
  if (!configuredKey || typeof configuredKey !== 'string') {
    throw new HTTPException(500, { message: 'Configuração administrativa ausente no servidor.' });
  }

  const body = await parseJsonBody(c);
  const providedKey = body.key;
  if (typeof providedKey !== 'string' || providedKey.length === 0 || providedKey.length > MAX_KEY_LENGTH) {
    throw new HTTPException(400, { message: 'Informe a chave administrativa.' });
  }

  // Apenas CF-Connecting-IP (definido pela borda). X-Forwarded-For é ignorado para evitar spoofing.
  const clientId = c.req.header('CF-Connecting-IP') || 'local';

  const result = await loginAdminService(c.env.DB, { providedKey, configuredKey, clientId });

  if (result.status === 'ok') {
    return c.json({
      sessionToken: result.sessionToken,
      expiresInSeconds: result.expiresInSeconds,
    });
  }

  if (result.status === 'blocked') {
    c.header('Retry-After', String(result.retryAfterSeconds));
    return c.json(
      {
        error: result.justBlocked
          ? 'Chave administrativa incorreta. Limite de tentativas atingido; aguarde para tentar novamente.'
          : 'Muitas tentativas inválidas. Aguarde para tentar novamente.',
        retryAfterSeconds: result.retryAfterSeconds,
      },
      429
    );
  }

  return c.json(
    {
      error: 'Chave administrativa incorreta.',
      attemptsRemaining: result.attemptsRemaining,
    },
    401
  );
}
