import { HTTPException } from 'hono/http-exception';
import { validateAdminSessionService } from '../services/adminSessionService.js';

/**
 * Middleware de autenticação administrativa.
 * Exige `Authorization: Bearer <token de sessão>` em todas as rotas `/api/admin/*`
 * (exceto o login). O token de sessão é opaco, aleatório e revogável; a chave
 * administrativa original (`ADMIN_TOKEN`) NÃO é aceita aqui, apenas no login.
 *
 * A validação consulta o D1 a cada requisição, rejeitando sessões expiradas ou
 * revogadas, e NÃO renova a sessão (a renovação é explícita em /session/touch).
 * Nunca registra o token recebido em logs.
 */
export async function adminAuth(c, next) {
  const authHeader = c.req.header('Authorization');
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    throw new HTTPException(401, { message: 'Não autorizado.' });
  }

  const providedToken = authHeader.slice(7).trim();
  if (!providedToken) {
    throw new HTTPException(401, { message: 'Não autorizado.' });
  }

  const session = await validateAdminSessionService(c.env?.DB, providedToken);
  if (!session) {
    throw new HTTPException(401, { message: 'Sessão inválida ou expirada.' });
  }

  c.set('adminSession', session);
  await next();
}
