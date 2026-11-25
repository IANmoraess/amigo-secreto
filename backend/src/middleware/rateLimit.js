import { HTTPException } from 'hono/http-exception';

/**
 * Extrai um identificador de cliente confiável para limitação de taxa.
 * Em produção no Cloudflare Workers, `CF-Connecting-IP` é definido pela borda.
 * Não utiliza `X-Forwarded-For` como fallback para evitar spoofing de IP.
 */
function getClientKey(c) {
  return c.req.header('CF-Connecting-IP') || 'local';
}

/**
 * Cria um middleware de rate limit em janela fixa por IP e escopo.
 * Em ambiente Cloudflare Workers, atua por isolado como proteção complementar
 * às regras de Rate Limiting do WAF na borda.
 */
export function createRateLimiter({ scope, windowMs = 60_000, max = 60 }) {
  const buckets = new Map();

  return async function rateLimitMiddleware(c, next) {
    const now = Date.now();
    const key = `${scope}:${getClientKey(c)}`;
    const entry = buckets.get(key);

    if (!entry || now >= entry.resetAt) {
      if (buckets.size >= 1000) {
        for (const [bucketKey, value] of buckets.entries()) {
          if (now >= value.resetAt) buckets.delete(bucketKey);
        }
        // Evicção do registro mais antigo se o mapa ainda atingir o teto
        if (buckets.size >= 1000) {
          const oldestKey = buckets.keys().next().value;
          if (oldestKey !== undefined) buckets.delete(oldestKey);
        }
      }
      buckets.set(key, { count: 1, resetAt: now + windowMs });
      await next();
      return;
    }

    if (entry.count >= max) {
      const retryAfterSeconds = Math.max(1, Math.ceil((entry.resetAt - now) / 1000));
      c.header('Retry-After', String(retryAfterSeconds));
      throw new HTTPException(429, {
        message: 'Muitas tentativas. Aguarde alguns instantes e tente novamente.',
      });
    }

    entry.count += 1;
    await next();
  };
}
