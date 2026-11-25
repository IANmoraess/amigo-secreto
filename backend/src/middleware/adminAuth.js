import { HTTPException } from 'hono/http-exception';
import { timingSafeEqual } from '../utils/crypto.js';

/**
 * Middleware de autenticação administrativa.
 * Exige `Authorization: Bearer <ADMIN_TOKEN>` em todas as rotas `/api/admin/*`.
 * Nunca registra o token recebido em logs.
 */
export async function adminAuth(c, next) {
  const configuredToken = c.env?.ADMIN_TOKEN;
  if (!configuredToken || typeof configuredToken !== 'string') {
    throw new HTTPException(500, { message: 'Configuração administrativa ausente no servidor.' });
  }

  const authHeader = c.req.header('Authorization');
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    throw new HTTPException(401, { message: 'Não autorizado.' });
  }

  const providedToken = authHeader.slice(7).trim();
  if (!providedToken) {
    throw new HTTPException(401, { message: 'Não autorizado.' });
  }

  const isValid = await timingSafeEqual(providedToken, configuredToken);
  if (!isValid) {
    throw new HTTPException(401, { message: 'Não autorizado.' });
  }

  await next();
}
