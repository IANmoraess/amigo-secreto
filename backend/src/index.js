import { Hono } from 'hono';
import { cors } from 'hono/cors';
import { adminAuth } from './middleware/adminAuth.js';
import { createRateLimiter } from './middleware/rateLimit.js';
import adminRoutes from './routes/admin.js';
import sorteioRoutes from './routes/sorteio.js';

const app = new Hono();
const globalRateLimit = createRateLimiter({ scope: 'global', windowMs: 60_000, max: 100 });
const adminRateLimit = createRateLimiter({ scope: 'admin', windowMs: 60_000, max: 60 });
const adminVerifyRateLimit = createRateLimiter({ scope: 'admin-verify', windowMs: 60_000, max: 10 });
const sorteioRateLimit = createRateLimiter({ scope: 'sorteio', windowMs: 60_000, max: 30 });

/**
 * Resolve as origens permitidas a partir de ALLOWED_ORIGIN (lista separada por vírgula).
 * Falha fechado (retorna lista vazia) caso não esteja configurada.
 */
function parseAllowedOrigins(rawOrigin) {
  if (!rawOrigin || typeof rawOrigin !== 'string') {
    return [];
  }
  return rawOrigin
    .split(',')
    .map((origin) => origin.trim())
    .filter(Boolean);
}

// Cabeçalhos defensivos globais para toda a API
app.use('/api/*', async (c, next) => {
  await next();
  c.header('X-Content-Type-Options', 'nosniff');
  c.header('Referrer-Policy', 'no-referrer');
  c.header('Cache-Control', 'no-store');
});

// CORS restrito às origens autorizadas em ALLOWED_ORIGIN
app.use('/api/*', async (c, next) => {
  const allowedOrigins = parseAllowedOrigins(c.env?.ALLOWED_ORIGIN);

  const corsMiddleware = cors({
    origin: (origin) => {
      if (!origin) return '';
      return allowedOrigins.includes(origin) ? origin : '';
    },
    allowMethods: ['GET', 'POST', 'DELETE', 'OPTIONS'],
    allowHeaders: ['Content-Type', 'Authorization', 'X-Participant-Token'],
    maxAge: 86400,
  });

  return corsMiddleware(c, next);
});

// Rate limit global de 1 minuto para impedir sobrecarga em qualquer rota
app.use('*', globalRateLimit);

// Rota de verificação de saúde do Worker
app.get('/api/health', (c) => {
  return c.json({ ok: true });
});

// Rotas administrativas protegidas por rate limit e autenticação
app.use('/api/admin/verify', adminVerifyRateLimit);
app.use('/api/admin/*', adminRateLimit, adminAuth);
app.route('/api/admin', adminRoutes);

// Rotas públicas individuais do participante protegidas por rate limit
app.use('/api/sorteio/*', sorteioRateLimit);
app.route('/api/sorteio', sorteioRoutes);

// Rota não encontrada padronizada
app.notFound((c) => {
  return c.json({ error: 'Rota não encontrada.' }, 404);
});

// Tratamento global de erros sem expor detalhes internos ou stack traces
app.onError((err, c) => {
  const status = typeof err?.status === 'number' && err.status >= 400 && err.status < 600
    ? err.status
    : 500;

  const message =
    status < 500 && err?.message
      ? err.message
      : 'Erro interno ao processar a solicitação.';

  return c.json({ error: message }, status);
});

export default app;
