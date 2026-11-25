import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import app from '../src/index.js';
import { createTestD1Database } from './helpers/d1TestDb.js';

const ADMIN_TOKEN = 'test-admin-secret-token';
const ALLOWED_ORIGIN = 'http://localhost:5173';

function createEnv(db, overrides = {}) {
  return {
    DB: db,
    ADMIN_TOKEN,
    ALLOWED_ORIGIN,
    ...overrides,
  };
}

async function apiRequest(
  env,
  path,
  { method = 'GET', body, token, participantToken, origin, ip } = {}
) {
  const headers = {};
  if (body !== undefined) headers['Content-Type'] = 'application/json';
  if (token) headers.Authorization = `Bearer ${token}`;
  if (participantToken) headers['X-Participant-Token'] = participantToken;
  if (origin) headers.Origin = origin;
  if (ip) headers['CF-Connecting-IP'] = ip;

  const response = await app.request(
    path,
    {
      method,
      headers,
      body: typeof body === 'string' ? body : body !== undefined ? JSON.stringify(body) : undefined,
    },
    env
  );

  const data = await response.json().catch(() => null);
  return { response, data };
}

describe('API e Segurança (rotas administrativas e individuais)', () => {
  let db;
  let env;

  beforeEach(() => {
    db = createTestD1Database();
    env = createEnv(db);
  });

  afterEach(() => {
    db.raw.close();
    vi.restoreAllMocks();
  });

  it('exige autenticação em todas as rotas administrativas e falha fechado sem ADMIN_TOKEN', async () => {
    const endpoints = [
      { method: 'GET', path: '/api/admin/verify' },
      { method: 'POST', path: '/api/admin/events', body: { name: 'Natal' } },
      { method: 'GET', path: '/api/admin/events/evt-1' },
      { method: 'POST', path: '/api/admin/events/evt-1/participants', body: { name: 'Ana' } },
      { method: 'DELETE', path: '/api/admin/events/evt-1/participants/p-1' },
      { method: 'POST', path: '/api/admin/events/evt-1/draw' },
    ];

    for (let i = 0; i < endpoints.length; i += 1) {
      const endpoint = endpoints[i];
      const ip = `198.51.100.${i + 1}`;

      const noHeader = await apiRequest(env, endpoint.path, { ...endpoint, ip });
      expect(noHeader.response.status).toBe(401);

      const wrongToken = await apiRequest(env, endpoint.path, {
        ...endpoint,
        token: 'chave-errada',
        ip,
      });
      expect(wrongToken.response.status).toBe(401);

      const missingConfigEnv = createEnv(db, { ADMIN_TOKEN: '' });
      const noServerSecret = await apiRequest(missingConfigEnv, endpoint.path, {
        ...endpoint,
        token: ADMIN_TOKEN,
        ip,
      });
      expect(noServerSecret.response.status).toBe(500);
    }
  });

  it('aplica CORS restrito, falha fechado sem ALLOWED_ORIGIN e define cabeçalhos defensivos', async () => {
    const allowed = await apiRequest(env, '/api/health', { origin: ALLOWED_ORIGIN });
    expect(allowed.response.status).toBe(200);
    expect(allowed.response.headers.get('Access-Control-Allow-Origin')).toBe(ALLOWED_ORIGIN);
    expect(allowed.response.headers.get('Cache-Control')).toBe('no-store');
    expect(allowed.response.headers.get('Referrer-Policy')).toBe('no-referrer');
    expect(allowed.response.headers.get('X-Content-Type-Options')).toBe('nosniff');

    const blocked = await apiRequest(env, '/api/health', { origin: 'https://malicioso.example' });
    expect(blocked.response.headers.get('Access-Control-Allow-Origin')).toBeNull();

    const emptyCorsEnv = createEnv(db, { ALLOWED_ORIGIN: '' });
    const failClosed = await apiRequest(emptyCorsEnv, '/api/health', {
      origin: 'http://localhost:5173',
    });
    expect(failClosed.response.headers.get('Access-Control-Allow-Origin')).toBeNull();
  });

  it('rejeita payloads maiores que 4 KB, caracteres inseguros e nomes duplicados', async () => {
    const oversized = await apiRequest(env, '/api/admin/events', {
      method: 'POST',
      token: ADMIN_TOKEN,
      body: JSON.stringify({ name: 'A'.repeat(5000) }),
    });
    expect(oversized.response.status).toBe(413);

    const unsafeBidi = await apiRequest(env, '/api/admin/events', {
      method: 'POST',
      token: ADMIN_TOKEN,
      body: { name: 'Natal \u202E2026' },
    });
    expect(unsafeBidi.response.status).toBe(400);

    const created = await apiRequest(env, '/api/admin/events', {
      method: 'POST',
      token: ADMIN_TOKEN,
      body: { name: 'Natal' },
    });
    const eventId = created.data.event.id;

    const first = await apiRequest(env, `/api/admin/events/${eventId}/participants`, {
      method: 'POST',
      token: ADMIN_TOKEN,
      body: { name: 'Ana' },
    });
    expect(first.response.status).toBe(201);

    const duplicate = await apiRequest(env, `/api/admin/events/${eventId}/participants`, {
      method: 'POST',
      token: ADMIN_TOKEN,
      body: { name: 'ana' },
    });
    expect(duplicate.response.status).toBe(409);
  });

  it('aplica rate limit em tentativas repetidas de verificação admin', async () => {
    const ip = '203.0.113.55';
    let lastStatus = 0;
    for (let i = 0; i < 11; i += 1) {
      const res = await apiRequest(env, '/api/admin/verify', {
        token: 'errada',
        ip,
      });
      lastStatus = res.response.status;
    }
    expect(lastStatus).toBe(429);
  });

  it('executa fluxo completo via cabeçalho X-Participant-Token, protege privacidade e não vaza tokens em logs', async () => {
    const logSpy = vi.spyOn(console, 'log').mockImplementation(() => {});
    const infoSpy = vi.spyOn(console, 'info').mockImplementation(() => {});
    const warnSpy = vi.spyOn(console, 'warn').mockImplementation(() => {});
    const errorSpy = vi.spyOn(console, 'error').mockImplementation(() => {});

    // 1. Cria evento
    const created = await apiRequest(env, '/api/admin/events', {
      method: 'POST',
      token: ADMIN_TOKEN,
      body: { name: 'Natal da Família 2026' },
    });
    expect(created.response.status).toBe(201);
    const eventId = created.data.event.id;
    expect(created.data.event.status).toBe('draft');

    // 2. Adiciona 1 participante e confirma que não permite sortear com < 2
    const p1 = await apiRequest(env, `/api/admin/events/${eventId}/participants`, {
      method: 'POST',
      token: ADMIN_TOKEN,
      body: { name: 'Ana' },
    });
    expect(p1.response.status).toBe(201);

    const drawTooFew = await apiRequest(env, `/api/admin/events/${eventId}/draw`, {
      method: 'POST',
      token: ADMIN_TOKEN,
    });
    expect(drawTooFew.response.status).toBe(400);

    // 3. Adiciona mais participantes e remove um antes do sorteio
    const p2 = await apiRequest(env, `/api/admin/events/${eventId}/participants`, {
      method: 'POST',
      token: ADMIN_TOKEN,
      body: { name: 'Bruno' },
    });
    const tempId = p2.data.event.participants.find((p) => p.name === 'Bruno').id;

    const removed = await apiRequest(env, `/api/admin/events/${eventId}/participants/${tempId}`, {
      method: 'DELETE',
      token: ADMIN_TOKEN,
    });
    expect(removed.response.status).toBe(200);
    expect(removed.data.event.participants).toHaveLength(1);

    for (const name of ['Carla', 'Diego', 'Elena']) {
      const added = await apiRequest(env, `/api/admin/events/${eventId}/participants`, {
        method: 'POST',
        token: ADMIN_TOKEN,
        body: { name },
      });
      expect(added.response.status).toBe(201);
    }

    // 4. Realiza o sorteio
    const drawRes = await apiRequest(env, `/api/admin/events/${eventId}/draw`, {
      method: 'POST',
      token: ADMIN_TOKEN,
    });
    expect(drawRes.response.status).toBe(200);
    expect(drawRes.data.event.status).toBe('completed');
    expect(drawRes.data.links).toHaveLength(4);

    // 5. Não permite sortear novamente nem alterar participantes após sorteio
    const secondDraw = await apiRequest(env, `/api/admin/events/${eventId}/draw`, {
      method: 'POST',
      token: ADMIN_TOKEN,
    });
    expect(secondDraw.response.status).toBe(409);

    const addAfterDraw = await apiRequest(env, `/api/admin/events/${eventId}/participants`, {
      method: 'POST',
      token: ADMIN_TOKEN,
      body: { name: 'Intruso' },
    });
    expect(addAfterDraw.response.status).toBe(409);

    const anyParticipantId = drawRes.data.event.participants[0].id;
    const removeAfterDraw = await apiRequest(
      env,
      `/api/admin/events/${eventId}/participants/${anyParticipantId}`,
      { method: 'DELETE', token: ADMIN_TOKEN }
    );
    expect(removeAfterDraw.response.status).toBe(409);

    // 6. Painel admin não expõe resultados nem token_hash
    const adminView = await apiRequest(env, `/api/admin/events/${eventId}`, {
      token: ADMIN_TOKEN,
    });
    expect(adminView.response.status).toBe(200);
    const adminPayload = JSON.stringify(adminView.data);
    expect(adminPayload).not.toContain('tokenHash');
    expect(adminPayload).not.toContain('token_hash');
    expect(adminPayload).not.toContain('receiverId');
    expect(adminPayload).not.toContain('receiverName');

    // 7. Token ausente ou inválido não permite consultar ou revelar
    const missingTokenAccess = await apiRequest(env, '/api/sorteio/access');
    expect(missingTokenAccess.response.status).toBe(404);

    const invalidAccess = await apiRequest(env, '/api/sorteio/access', {
      participantToken: 'token-invalido-inexistente-12345',
    });
    expect(invalidAccess.response.status).toBe(404);
    const invalidReveal = await apiRequest(env, '/api/sorteio/reveal', {
      method: 'POST',
      participantToken: 'token-invalido-inexistente-12345',
    });
    expect(invalidReveal.response.status).toBe(404);

    // 8. Cada participante revela somente o seu próprio resultado de forma idempotente
    const revealedReceivers = new Set();
    for (const link of drawRes.data.links) {
      const accessBefore = await apiRequest(env, '/api/sorteio/access', {
        participantToken: link.token,
      });
      expect(accessBefore.response.status).toBe(200);
      expect(accessBefore.data).toEqual({
        eventName: 'Natal da Família 2026',
        participantName: link.name,
        hasRevealed: false,
      });

      const firstReveal = await apiRequest(env, '/api/sorteio/reveal', {
        method: 'POST',
        participantToken: link.token,
      });
      expect(firstReveal.response.status).toBe(200);
      const receiverName = firstReveal.data.receiverName;
      expect(receiverName).toBeTruthy();
      expect(receiverName).not.toBe(link.name);
      revealedReceivers.add(receiverName);

      // Chamada repetida retorna o mesmo resultado sem novo sorteio
      const secondReveal = await apiRequest(env, '/api/sorteio/reveal', {
        method: 'POST',
        participantToken: link.token,
      });
      expect(secondReveal.response.status).toBe(200);
      expect(secondReveal.data).toEqual({ receiverName });

      const accessAfter = await apiRequest(env, '/api/sorteio/access', {
        participantToken: link.token,
      });
      expect(accessAfter.response.status).toBe(200);
      expect(accessAfter.data.hasRevealed).toBe(true);
    }

    expect(revealedReceivers.size).toBe(4);

    // 9. Garante que nenhum token apareceu em logs
    const allLogs = [
      ...logSpy.mock.calls,
      ...infoSpy.mock.calls,
      ...warnSpy.mock.calls,
      ...errorSpy.mock.calls,
    ]
      .flat()
      .join(' ');
    for (const link of drawRes.data.links) {
      expect(allLogs).not.toContain(link.token);
    }
    expect(allLogs).not.toContain(ADMIN_TOKEN);
  });

  it('impede duplicidade em chamadas concorrentes ao sorteio e ao cadastro', async () => {
    const created = await apiRequest(env, '/api/admin/events', {
      method: 'POST',
      token: ADMIN_TOKEN,
      body: { name: 'Concorrência' },
    });
    const eventId = created.data.event.id;

    for (const name of ['João', 'Maria', 'Pedro']) {
      await apiRequest(env, `/api/admin/events/${eventId}/participants`, {
        method: 'POST',
        token: ADMIN_TOKEN,
        body: { name },
      });
    }

    const [resA, resB] = await Promise.all([
      apiRequest(env, `/api/admin/events/${eventId}/draw`, { method: 'POST', token: ADMIN_TOKEN }),
      apiRequest(env, `/api/admin/events/${eventId}/draw`, { method: 'POST', token: ADMIN_TOKEN }),
    ]);

    const statuses = [resA.response.status, resB.response.status].sort();
    expect(statuses).toEqual([200, 409]);

    const drawCountRow = db.raw
      .prepare('SELECT COUNT(*) AS count FROM draws WHERE event_id = ?')
      .get(eventId);
    expect(drawCountRow.count).toBe(3);
  });

  it('aplica rate limit global de 1 minuto para impedir sobrecarga no servidor', async () => {
    const ip = '203.0.113.77';
    let lastRes = null;
    for (let i = 0; i < 101; i += 1) {
      lastRes = await apiRequest(env, '/api/health', { ip });
    }
    expect(lastRes.response.status).toBe(429);
    const retryAfter = Number(lastRes.response.headers.get('Retry-After'));
    expect(retryAfter).toBeGreaterThanOrEqual(1);
    expect(retryAfter).toBeLessThanOrEqual(60);
  });

  it('lista eventos salvos no banco para o organizador sem expor dados sensíveis', async () => {
    const created = await apiRequest(env, '/api/admin/events', {
      method: 'POST',
      token: ADMIN_TOKEN,
      body: { name: 'Evento Listado' },
    });
    const eventId = created.data.event.id;

    await apiRequest(env, `/api/admin/events/${eventId}/participants`, {
      method: 'POST',
      token: ADMIN_TOKEN,
      body: { name: 'Ana' },
    });

    const listRes = await apiRequest(env, '/api/admin/events', { token: ADMIN_TOKEN });
    expect(listRes.response.status).toBe(200);
    const listed = listRes.data.events.find((item) => item.id === eventId);
    expect(listed).toBeDefined();
    expect(listed.name).toBe('Evento Listado');
    expect(listed.status).toBe('draft');
    expect(listed.participantCount).toBe(1);
  });
});
