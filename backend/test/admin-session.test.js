import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import app from '../src/index.js';
import { createTestD1Database } from './helpers/d1TestDb.js';

const ADMIN_KEY = 'chave-admin-de-teste-123';
const MINUTE = 60 * 1000;
const SECOND = 1000;

let ipSequence = 0;

function createEnv(db, overrides = {}) {
  return { DB: db, ADMIN_TOKEN: ADMIN_KEY, ALLOWED_ORIGIN: 'http://localhost:5173', ...overrides };
}

async function sha256Hex(value) {
  const digest = await crypto.subtle.digest('SHA-256', new TextEncoder().encode(value));
  return Array.from(new Uint8Array(digest), (b) => b.toString(16).padStart(2, '0')).join('');
}

describe('Sessão administrativa (login, bloqueio, expiração e revogação)', () => {
  let db;
  let env;
  let ip;

  async function request(path, { method = 'GET', body, token, headers: extra = {}, ipOverride } = {}) {
    const headers = { 'CF-Connecting-IP': ipOverride ?? ip, ...extra };
    if (body !== undefined) headers['Content-Type'] = 'application/json';
    if (token) headers.Authorization = `Bearer ${token}`;
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

  const login = (key = ADMIN_KEY, options = {}) =>
    request('/api/admin/login', { method: 'POST', body: { key }, ...options });

  const advance = (ms) => vi.setSystemTime(Date.now() + ms);

  beforeEach(() => {
    vi.useFakeTimers({ toFake: ['Date'] });
    vi.setSystemTime(new Date('2026-01-01T12:00:00Z'));
    db = createTestD1Database();
    env = createEnv(db);
    ipSequence += 1;
    ip = `10.20.${Math.floor(ipSequence / 250)}.${(ipSequence % 250) + 1}`;
  });

  afterEach(() => {
    db.raw.close();
    vi.useRealTimers();
    vi.restoreAllMocks();
  });

  describe('login', () => {
    it('chave válida cria sessão opaca de 15 min, sem devolver a chave e guardando só o hash', async () => {
      const { response, data } = await login();
      expect(response.status).toBe(200);
      expect(data.expiresInSeconds).toBe(15 * 60);
      expect(data.sessionToken).toMatch(/^[A-Za-z0-9_-]{43}$/);
      expect(data.sessionToken).not.toBe(ADMIN_KEY);
      expect(JSON.stringify(data)).not.toContain(ADMIN_KEY);

      const rows = db.raw.prepare('SELECT * FROM admin_sessions').all();
      expect(rows).toHaveLength(1);
      expect(rows[0].token_hash).toBe(await sha256Hex(data.sessionToken));
      expect(JSON.stringify(rows)).not.toContain(data.sessionToken);
      expect(rows[0].expires_at - rows[0].created_at).toBe(15 * MINUTE);
    });

    it('chave inválida retorna 401, informa tentativas restantes e nunca cria sessão', async () => {
      const first = await login('errada');
      expect(first.response.status).toBe(401);
      expect(first.data.error).toMatch(/incorreta/i);
      expect(first.data.attemptsRemaining).toBe(2);
      expect(first.data.sessionToken).toBeUndefined();

      const second = await login('errada');
      expect(second.response.status).toBe(401);
      expect(second.data.attemptsRemaining).toBe(1);

      expect(db.raw.prepare('SELECT COUNT(*) AS n FROM admin_sessions').get().n).toBe(0);
    });

    it('valida o corpo da requisição e falha fechado sem ADMIN_TOKEN configurado', async () => {
      expect((await request('/api/admin/login', { method: 'POST', body: {} })).response.status).toBe(400);
      expect((await request('/api/admin/login', { method: 'POST', body: { key: 123 } })).response.status).toBe(400);
      expect((await request('/api/admin/login', { method: 'POST', body: { key: 'x'.repeat(300) } })).response.status).toBe(400);
      expect((await request('/api/admin/login', { method: 'POST', body: 'não-é-json' })).response.status).toBe(400);
      expect(
        (await request('/api/admin/login', { method: 'POST', body: JSON.stringify({ key: 'a'.repeat(5000) }) }))
          .response.status
      ).toBe(413);

      env = createEnv(db, { ADMIN_TOKEN: '' });
      expect((await login(ADMIN_KEY)).response.status).toBe(500);
    });
  });

  describe('bloqueio após 3 tentativas inválidas', () => {
    it('bloqueia na 3ª tentativa por 60 s e libera exatamente após o cooldown', async () => {
      expect((await login('errada')).response.status).toBe(401);
      expect((await login('errada')).response.status).toBe(401);

      const third = await login('errada');
      expect(third.response.status).toBe(429);
      expect(third.data.retryAfterSeconds).toBe(60);
      expect(third.response.headers.get('Retry-After')).toBe('60');

      // Durante o bloqueio, nem mesmo a chave correta é aceita e nenhuma sessão é criada.
      advance(30 * SECOND);
      const duringLock = await login(ADMIN_KEY);
      expect(duringLock.response.status).toBe(429);
      expect(duringLock.data.retryAfterSeconds).toBe(30);
      expect(duringLock.data.sessionToken).toBeUndefined();

      advance(29 * SECOND);
      const lastSecond = await login(ADMIN_KEY);
      expect(lastSecond.response.status).toBe(429);
      expect(lastSecond.data.retryAfterSeconds).toBe(1);

      advance(1 * SECOND);
      const released = await login(ADMIN_KEY);
      expect(released.response.status).toBe(200);
      expect(released.data.sessionToken).toBeTruthy();
    });

    it('após o cooldown inicia uma nova sequência completa de 3 tentativas', async () => {
      await login('errada');
      await login('errada');
      expect((await login('errada')).response.status).toBe(429);

      advance(60 * SECOND);
      const again = await login('errada');
      expect(again.response.status).toBe(401);
      expect(again.data.attemptsRemaining).toBe(2);
      expect((await login('errada')).response.status).toBe(401);
      expect((await login('errada')).response.status).toBe(429);
    });

    it('persiste no banco: sobrevive a "recarregar a página" e não é contornado por X-Forwarded-For', async () => {
      await login('errada');
      await login('errada');
      await login('errada');

      const row = db.raw.prepare('SELECT * FROM admin_login_attempts').get();
      expect(row.blocked_until).toBeGreaterThan(Date.now());
      expect(row.client_key).not.toContain(ip); // IP nunca gravado em texto puro

      // Novo "ambiente" (outra instância do Worker) apontando para o mesmo D1.
      env = createEnv(db);
      const spoofed = await login(ADMIN_KEY, { headers: { 'X-Forwarded-For': '1.2.3.4' } });
      expect(spoofed.response.status).toBe(429);

      // Outro cliente não é afetado pelo bloqueio.
      const other = await login(ADMIN_KEY, { ipOverride: '198.51.100.250' });
      expect(other.response.status).toBe(200);
    });

    it('é atômico sob requisições simultâneas: ninguém ultrapassa o limite', async () => {
      const results = await Promise.all(Array.from({ length: 8 }, () => login('errada')));
      const statuses = results.map((r) => r.response.status);

      expect(statuses.every((s) => s === 401 || s === 429)).toBe(true);
      expect(statuses.filter((s) => s === 401).length).toBeLessThanOrEqual(2);
      expect(statuses).toContain(429);

      const after = await login(ADMIN_KEY);
      expect(after.response.status).toBe(429);
    });

    it('tentativas inválidas antigas (fora da janela de 15 min) deixam de acumular', async () => {
      await login('errada');
      await login('errada');
      advance(16 * MINUTE);
      const res = await login('errada');
      expect(res.response.status).toBe(401);
      expect(res.data.attemptsRemaining).toBe(2);
    });

    it('login válido zera o contador de tentativas inválidas', async () => {
      await login('errada');
      await login('errada');
      expect((await login(ADMIN_KEY)).response.status).toBe(200);
      const res = await login('errada');
      expect(res.data.attemptsRemaining).toBe(2);
    });
  });

  describe('expiração por inatividade e renovação', () => {
    let sessionToken;

    beforeEach(async () => {
      sessionToken = (await login()).data.sessionToken;
    });

    it('a sessão vale 15 min de inatividade e expira exatamente depois', async () => {
      advance(15 * MINUTE - SECOND);
      expect((await request('/api/admin/session', { token: sessionToken })).response.status).toBe(200);
      advance(SECOND);
      const expired = await request('/api/admin/session', { token: sessionToken });
      expect(expired.response.status).toBe(401);
    });

    it('consultas em segundo plano (polling) NÃO renovam a sessão', async () => {
      advance(10 * MINUTE);
      const poll = await request('/api/admin/events', { token: sessionToken });
      expect(poll.response.status).toBe(200);

      const status = await request('/api/admin/session', { token: sessionToken });
      expect(status.data.expiresInSeconds).toBe(5 * 60);

      advance(6 * MINUTE); // 16 min desde o login, apesar do polling
      expect((await request('/api/admin/events', { token: sessionToken })).response.status).toBe(401);
    });

    it('atividade real (touch) renova a inatividade, sem limite de duração total', async () => {
      for (let i = 0; i < 6; i += 1) {
        advance(10 * MINUTE);
        const touch = await request('/api/admin/session/touch', { method: 'POST', token: sessionToken });
        expect(touch.response.status).toBe(200);
        expect(touch.data.expiresInSeconds).toBe(15 * 60);
      }
      // 60 min desde o login, ainda válida porque houve atividade.
      expect((await request('/api/admin/events', { token: sessionToken })).response.status).toBe(200);

      advance(15 * MINUTE);
      expect((await request('/api/admin/events', { token: sessionToken })).response.status).toBe(401);
    });

    it('sessão expirada não pode ser revivida nem reutilizada', async () => {
      advance(16 * MINUTE);
      const before = db.raw.prepare('SELECT expires_at FROM admin_sessions').get().expires_at;

      const touch = await request('/api/admin/session/touch', { method: 'POST', token: sessionToken });
      expect(touch.response.status).toBe(401);
      expect((await request('/api/admin/session', { token: sessionToken })).response.status).toBe(401);
      expect((await request('/api/admin/events', { token: sessionToken })).response.status).toBe(401);

      expect(db.raw.prepare('SELECT expires_at FROM admin_sessions').get().expires_at).toBe(before);
    });

    it('após expirar, novo login funciona e o contexto do servidor (evento) é preservado', async () => {
      const created = await request('/api/admin/events', {
        method: 'POST',
        token: sessionToken,
        body: { name: 'Contexto' },
      });
      const eventId = created.data.event.id;

      advance(20 * MINUTE);
      expect((await request(`/api/admin/events/${eventId}`, { token: sessionToken })).response.status).toBe(401);

      const relogin = await login();
      expect(relogin.response.status).toBe(200);
      const view = await request(`/api/admin/events/${eventId}`, { token: relogin.data.sessionToken });
      expect(view.response.status).toBe(200);
      expect(view.data.event.name).toBe('Contexto');
    });

    it('tokens individuais do sorteio não são recuperáveis após a expiração (apenas hashes no banco)', async () => {
      const created = await request('/api/admin/events', {
        method: 'POST',
        token: sessionToken,
        body: { name: 'Distribuição' },
      });
      const eventId = created.data.event.id;
      for (const name of ['Ana', 'Bia']) {
        await request(`/api/admin/events/${eventId}/participants`, {
          method: 'POST',
          token: sessionToken,
          body: { name },
        });
      }
      const draw = await request(`/api/admin/events/${eventId}/draw`, { method: 'POST', token: sessionToken });
      expect(draw.data.links).toHaveLength(2);
      const individualTokens = draw.data.links.map((l) => l.token);

      advance(30 * MINUTE);
      const relogin = await login();
      const view = await request(`/api/admin/events/${eventId}`, { token: relogin.data.sessionToken });
      const payload = JSON.stringify(view.data);
      for (const token of individualTokens) {
        expect(payload).not.toContain(token);
      }
      expect(payload).not.toContain('token');

      const stored = JSON.stringify(db.raw.prepare('SELECT token_hash FROM participants').all());
      for (const token of individualTokens) {
        expect(stored).not.toContain(token);
      }
    });
  });

  describe('logout e revogação', () => {
    it('invalida a sessão no servidor e não afeta outras sessões', async () => {
      const a = (await login()).data.sessionToken;
      const b = (await login()).data.sessionToken;

      const out = await request('/api/admin/session/logout', { method: 'POST', token: a });
      expect(out.response.status).toBe(200);

      expect((await request('/api/admin/events', { token: a })).response.status).toBe(401);
      expect((await request('/api/admin/session/touch', { method: 'POST', token: a })).response.status).toBe(401);
      expect((await request('/api/admin/session/logout', { method: 'POST', token: a })).response.status).toBe(401);
      expect(db.raw.prepare('SELECT COUNT(*) AS n FROM admin_sessions').get().n).toBe(1);

      expect((await request('/api/admin/events', { token: b })).response.status).toBe(200);
    });

    it('login remove sessões expiradas do banco', async () => {
      await login();
      advance(20 * MINUTE);
      await login();
      expect(db.raw.prepare('SELECT COUNT(*) AS n FROM admin_sessions').get().n).toBe(1);
    });
  });

  describe('proteção das rotas', () => {
    it('credenciais ausentes, malformadas, forjadas ou a própria chave admin nunca passam', async () => {
      const real = (await login()).data.sessionToken;
      const forged = real.slice(0, -1) + (real.endsWith('A') ? 'B' : 'A');

      for (const token of [undefined, '', 'curto', ADMIN_KEY, forged, 'x'.repeat(200), "' OR 1=1 --"]) {
        const res = await request('/api/admin/events', { token });
        expect(res.response.status).toBe(401);
      }

      const basic = await request('/api/admin/events', { headers: { Authorization: `Basic ${real}` } });
      expect(basic.response.status).toBe(401);

      // O login não aceita GET e o login não expõe outras rotas.
      expect((await request('/api/admin/login')).response.status).toBe(401);
    });

    it('rotas administrativas retornam 401 para sessão expirada em todos os métodos', async () => {
      const token = (await login()).data.sessionToken;
      advance(16 * MINUTE);

      const calls = [
        ['GET', '/api/admin/events'],
        ['POST', '/api/admin/events', { name: 'X' }],
        ['GET', '/api/admin/events/abc'],
        ['POST', '/api/admin/events/abc/participants', { name: 'Y' }],
        ['DELETE', '/api/admin/events/abc/participants/def'],
        ['POST', '/api/admin/events/abc/draw'],
        ['GET', '/api/admin/session'],
        ['POST', '/api/admin/session/touch'],
        ['POST', '/api/admin/session/logout'],
      ];
      for (const [method, path, body] of calls) {
        const res = await request(path, { method, token, body });
        expect(res.response.status).toBe(401);
      }
    });
  });
});
