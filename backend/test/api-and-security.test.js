import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import app from '../src/index.js';
import { createTestD1Database } from './helpers/d1TestDb.js';

const ADMIN_TOKEN = 'test-admin-secret-token';
const ALLOWED_ORIGIN = 'http://localhost:5173';

let ipSequence = 0;
let defaultIp;

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
  { method = 'GET', body, token, participantToken, origin, ip = defaultIp } = {}
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
  let adminSession;
  let testIp;

  beforeEach(async () => {
    db = createTestD1Database();
    env = createEnv(db);
    // Cada teste usa um IP próprio para não compartilhar os limitadores em memória.
    ipSequence += 1;
    testIp = `10.9.${Math.floor(ipSequence / 250)}.${(ipSequence % 250) + 1}`;
    defaultIp = testIp;
    const login = await apiRequest(env, '/api/admin/login', {
      method: 'POST',
      body: { key: ADMIN_TOKEN },
    });
    adminSession = login.data.sessionToken;
  });

  afterEach(() => {
    db.raw.close();
    vi.restoreAllMocks();
    defaultIp = undefined;
  });

  it('exige sessão válida em todas as rotas administrativas e falha fechado no login sem ADMIN_TOKEN', async () => {
    const endpoints = [
      { method: 'GET', path: '/api/admin/session' },
      { method: 'POST', path: '/api/admin/session/touch' },
      { method: 'POST', path: '/api/admin/session/logout' },
      { method: 'GET', path: '/api/admin/events' },
      { method: 'POST', path: '/api/admin/events', body: { name: 'Natal' } },
      { method: 'GET', path: '/api/admin/events/evt-1' },
      { method: 'POST', path: '/api/admin/events/evt-1/participants', body: { name: 'Ana' } },
      { method: 'DELETE', path: '/api/admin/events/evt-1/participants/p-1' },
      { method: 'POST', path: '/api/admin/events/evt-1/draw' },
    ];

    for (const endpoint of endpoints) {
      const noHeader = await apiRequest(env, endpoint.path, endpoint);
      expect(noHeader.response.status).toBe(401);

      // A chave administrativa original não é aceita como credencial de sessão.
      const rawKey = await apiRequest(env, endpoint.path, { ...endpoint, token: ADMIN_TOKEN });
      expect(rawKey.response.status).toBe(401);

      const wrongToken = await apiRequest(env, endpoint.path, { ...endpoint, token: 'chave-errada' });
      expect(wrongToken.response.status).toBe(401);
    }

    const missingConfigEnv = createEnv(db, { ADMIN_TOKEN: '' });
    const noServerSecret = await apiRequest(missingConfigEnv, '/api/admin/login', {
      method: 'POST',
      body: { key: ADMIN_TOKEN },
    });
    expect(noServerSecret.response.status).toBe(500);
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
      token: adminSession,
      body: JSON.stringify({ name: 'A'.repeat(5000) }),
    });
    expect(oversized.response.status).toBe(413);

    const unsafeBidi = await apiRequest(env, '/api/admin/events', {
      method: 'POST',
      token: adminSession,
      body: { name: 'Natal \u202E2026' },
    });
    expect(unsafeBidi.response.status).toBe(400);

    const created = await apiRequest(env, '/api/admin/events', {
      method: 'POST',
      token: adminSession,
      body: { name: 'Natal' },
    });
    const eventId = created.data.event.id;

    const first = await apiRequest(env, `/api/admin/events/${eventId}/participants`, {
      method: 'POST',
      token: adminSession,
      body: { name: 'Ana' },
    });
    expect(first.response.status).toBe(201);

    const duplicate = await apiRequest(env, `/api/admin/events/${eventId}/participants`, {
      method: 'POST',
      token: adminSession,
      body: { name: 'ana' },
    });
    expect(duplicate.response.status).toBe(409);
  });

  it('bloqueia o login após 3 tentativas inválidas (limite persistido no banco)', async () => {
    const ip = '203.0.113.55';
    const statuses = [];
    for (let i = 0; i < 3; i += 1) {
      const res = await apiRequest(env, '/api/admin/login', {
        method: 'POST',
        body: { key: 'errada' },
        ip,
      });
      statuses.push(res.response.status);
    }
    expect(statuses).toEqual([401, 401, 429]);
  });

  it('executa fluxo completo via cabeçalho X-Participant-Token, protege privacidade e não vaza tokens em logs', async () => {
    const logSpy = vi.spyOn(console, 'log').mockImplementation(() => {});
    const infoSpy = vi.spyOn(console, 'info').mockImplementation(() => {});
    const warnSpy = vi.spyOn(console, 'warn').mockImplementation(() => {});
    const errorSpy = vi.spyOn(console, 'error').mockImplementation(() => {});

    // 1. Cria evento
    const created = await apiRequest(env, '/api/admin/events', {
      method: 'POST',
      token: adminSession,
      body: { name: 'Natal da Família 2026' },
    });
    expect(created.response.status).toBe(201);
    const eventId = created.data.event.id;
    expect(created.data.event.status).toBe('draft');

    // 2. Adiciona 1 participante e confirma que não permite sortear com < 2
    const p1 = await apiRequest(env, `/api/admin/events/${eventId}/participants`, {
      method: 'POST',
      token: adminSession,
      body: { name: 'Ana' },
    });
    expect(p1.response.status).toBe(201);

    const drawTooFew = await apiRequest(env, `/api/admin/events/${eventId}/draw`, {
      method: 'POST',
      token: adminSession,
    });
    expect(drawTooFew.response.status).toBe(400);

    // 3. Adiciona mais participantes e remove um antes do sorteio
    const p2 = await apiRequest(env, `/api/admin/events/${eventId}/participants`, {
      method: 'POST',
      token: adminSession,
      body: { name: 'Bruno' },
    });
    const tempId = p2.data.event.participants.find((p) => p.name === 'Bruno').id;

    const removed = await apiRequest(env, `/api/admin/events/${eventId}/participants/${tempId}`, {
      method: 'DELETE',
      token: adminSession,
    });
    expect(removed.response.status).toBe(200);
    expect(removed.data.event.participants).toHaveLength(1);

    for (const name of ['Carla', 'Diego', 'Elena']) {
      const added = await apiRequest(env, `/api/admin/events/${eventId}/participants`, {
        method: 'POST',
        token: adminSession,
        body: { name },
      });
      expect(added.response.status).toBe(201);
    }

    // 4. Realiza o sorteio
    const drawRes = await apiRequest(env, `/api/admin/events/${eventId}/draw`, {
      method: 'POST',
      token: adminSession,
    });
    expect(drawRes.response.status).toBe(200);
    expect(drawRes.data.event.status).toBe('completed');
    expect(drawRes.data.links).toHaveLength(4);

    // 5. Não permite sortear novamente nem alterar participantes após sorteio
    const secondDraw = await apiRequest(env, `/api/admin/events/${eventId}/draw`, {
      method: 'POST',
      token: adminSession,
    });
    expect(secondDraw.response.status).toBe(409);

    const addAfterDraw = await apiRequest(env, `/api/admin/events/${eventId}/participants`, {
      method: 'POST',
      token: adminSession,
      body: { name: 'Intruso' },
    });
    expect(addAfterDraw.response.status).toBe(409);

    const anyParticipantId = drawRes.data.event.participants[0].id;
    const removeAfterDraw = await apiRequest(
      env,
      `/api/admin/events/${eventId}/participants/${anyParticipantId}`,
      { method: 'DELETE', token: adminSession }
    );
    expect(removeAfterDraw.response.status).toBe(409);

    // 6. Painel admin não expõe resultados nem token_hash
    const adminView = await apiRequest(env, `/api/admin/events/${eventId}`, {
      token: adminSession,
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
    expect(allLogs).not.toContain(adminSession);
  });

  it('impede duplicidade em chamadas concorrentes ao sorteio e ao cadastro', async () => {
    const created = await apiRequest(env, '/api/admin/events', {
      method: 'POST',
      token: adminSession,
      body: { name: 'Concorrência' },
    });
    const eventId = created.data.event.id;

    for (const name of ['João', 'Maria', 'Pedro']) {
      await apiRequest(env, `/api/admin/events/${eventId}/participants`, {
        method: 'POST',
        token: adminSession,
        body: { name },
      });
    }

    const [resA, resB] = await Promise.all([
      apiRequest(env, `/api/admin/events/${eventId}/draw`, { method: 'POST', token: adminSession }),
      apiRequest(env, `/api/admin/events/${eventId}/draw`, { method: 'POST', token: adminSession }),
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

  it('painel admin reflete hasRevealed logo após a revelação, sem expor os pares', async () => {
    const created = await apiRequest(env, '/api/admin/events', {
      method: 'POST',
      token: adminSession,
      body: { name: 'Status de visualização' },
    });
    const eventId = created.data.event.id;

    for (const name of ['Ana', 'Bruno', 'Carla']) {
      await apiRequest(env, `/api/admin/events/${eventId}/participants`, {
        method: 'POST',
        token: adminSession,
        body: { name },
      });
    }

    const drawRes = await apiRequest(env, `/api/admin/events/${eventId}/draw`, {
      method: 'POST',
      token: adminSession,
    });
    const [first, second] = drawRes.data.links;

    const revealedFlags = async () => {
      const view = await apiRequest(env, `/api/admin/events/${eventId}`, { token: adminSession });
      expect(view.response.status).toBe(200);
      expect(JSON.stringify(view.data)).not.toContain('receiverName');
      return Object.fromEntries(view.data.event.participants.map((p) => [p.name, p.hasRevealed]));
    };

    // Apenas abrir o link (access) não conta como visualização
    await apiRequest(env, '/api/sorteio/access', { participantToken: first.token });
    expect(await revealedFlags()).toEqual({ Ana: false, Bruno: false, Carla: false });

    // Revelar marca somente aquele participante, já na resposta seguinte do painel
    await apiRequest(env, '/api/sorteio/reveal', { method: 'POST', participantToken: first.token });
    expect((await revealedFlags())[first.name]).toBe(true);
    expect((await revealedFlags())[second.name]).toBe(false);

    // Revelar de novo permanece como visualizado
    await apiRequest(env, '/api/sorteio/reveal', { method: 'POST', participantToken: first.token });
    expect((await revealedFlags())[first.name]).toBe(true);
  });

  it('lista eventos salvos no banco para o organizador sem expor dados sensíveis', async () => {
    const created = await apiRequest(env, '/api/admin/events', {
      method: 'POST',
      token: adminSession,
      body: { name: 'Evento Listado' },
    });
    const eventId = created.data.event.id;

    await apiRequest(env, `/api/admin/events/${eventId}/participants`, {
      method: 'POST',
      token: adminSession,
      body: { name: 'Ana' },
    });

    const listRes = await apiRequest(env, '/api/admin/events', { token: adminSession });
    expect(listRes.response.status).toBe(200);
    const listed = listRes.data.events.find((item) => item.id === eventId);
    expect(listed).toBeDefined();
    expect(listed.name).toBe('Evento Listado');
    expect(listed.status).toBe('draft');
    expect(listed.participantCount).toBe(1);
  });

  it('exclui definitivamente eventos em draft e completed, invalida links e não deixa órfãos', async () => {
    // 1. Sem autenticação não exclui
    const unauth = await apiRequest(env, '/api/admin/events/evt-1', { method: 'DELETE' });
    expect(unauth.response.status).toBe(401);

    // 2. Evento inexistente retorna 404
    const notFound = await apiRequest(env, '/api/admin/events/inexistente-123', {
      method: 'DELETE',
      token: adminSession,
    });
    expect(notFound.response.status).toBe(404);

    // 3. Cria evento em draft e exclui
    const draftCreated = await apiRequest(env, '/api/admin/events', {
      method: 'POST',
      token: adminSession,
      body: { name: 'Evento Rascunho' },
    });
    const draftId = draftCreated.data.event.id;
    await apiRequest(env, `/api/admin/events/${draftId}/participants`, {
      method: 'POST',
      token: adminSession,
      body: { name: 'Carlos' },
    });
    const deleteDraft = await apiRequest(env, `/api/admin/events/${draftId}`, {
      method: 'DELETE',
      token: adminSession,
    });
    expect(deleteDraft.response.status).toBe(200);
    expect(
      db.raw.prepare('SELECT COUNT(*) AS count FROM events WHERE id = ?').get(draftId).count
    ).toBe(0);
    expect(
      db.raw.prepare('SELECT COUNT(*) AS count FROM participants WHERE event_id = ?').get(draftId).count
    ).toBe(0);

    // 4. Cria dois eventos sorteados; exclui apenas o primeiro e mantém o segundo intacto
    const evA = (
      await apiRequest(env, '/api/admin/events', {
        method: 'POST',
        token: adminSession,
        body: { name: 'Evento Excluído' },
      })
    ).data.event.id;
    const evB = (
      await apiRequest(env, '/api/admin/events', {
        method: 'POST',
        token: adminSession,
        body: { name: 'Evento Preservado' },
      })
    ).data.event.id;

    for (const [evId, names] of [
      [evA, ['Ana', 'Bruno']],
      [evB, ['Clara', 'Diego']],
    ]) {
      for (const name of names) {
        await apiRequest(env, `/api/admin/events/${evId}/participants`, {
          method: 'POST',
          token: adminSession,
          body: { name },
        });
      }
    }

    const drawA = await apiRequest(env, `/api/admin/events/${evA}/draw`, {
      method: 'POST',
      token: adminSession,
    });
    const drawB = await apiRequest(env, `/api/admin/events/${evB}/draw`, {
      method: 'POST',
      token: adminSession,
    });
    const tokenA = drawA.data.links[0].token;
    const tokenB = drawB.data.links[0].token;

    // Antes da exclusão, o link funciona
    expect(
      (await apiRequest(env, '/api/sorteio/access', { participantToken: tokenA })).response.status
    ).toBe(200);

    // Exclui evento já sorteado
    const deleteA = await apiRequest(env, `/api/admin/events/${evA}`, {
      method: 'DELETE',
      token: adminSession,
    });
    expect(deleteA.response.status).toBe(200);

    // Links antigos falham sem revelar detalhes
    expect(
      (await apiRequest(env, '/api/sorteio/access', { participantToken: tokenA })).response.status
    ).toBe(404);
    expect(
      (
        await apiRequest(env, '/api/sorteio/reveal', {
          method: 'POST',
          participantToken: tokenA,
        })
      ).response.status
    ).toBe(404);

    // Endpoints admin não retornam mais o evento excluído
    expect(
      (await apiRequest(env, `/api/admin/events/${evA}`, { token: adminSession })).response.status
    ).toBe(404);

    // Sem registros órfãos
    expect(db.raw.prepare('SELECT COUNT(*) AS count FROM events WHERE id = ?').get(evA).count).toBe(0);
    expect(
      db.raw.prepare('SELECT COUNT(*) AS count FROM participants WHERE event_id = ?').get(evA).count
    ).toBe(0);
    expect(
      db.raw.prepare('SELECT COUNT(*) AS count FROM draws WHERE event_id = ?').get(evA).count
    ).toBe(0);

    // Outro evento continua funcionando normalmente
    expect(
      (await apiRequest(env, '/api/sorteio/reveal', { method: 'POST', participantToken: tokenB }))
        .response.status
    ).toBe(200);
  });
});
