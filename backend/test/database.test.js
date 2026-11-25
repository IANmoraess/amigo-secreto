import { afterEach, beforeEach, describe, expect, it } from 'vitest';
import { createTestD1Database } from './helpers/d1TestDb.js';

describe('Banco de dados (chaves estrangeiras, unicidade e atomicidade)', () => {
  let db;

  beforeEach(() => {
    db = createTestD1Database();
  });

  afterEach(() => {
    db.raw.close();
  });

  it('impõe chaves estrangeiras entre events, participants e draws', async () => {
    await expect(
      db
        .prepare('INSERT INTO participants (id, event_id, name) VALUES (?, ?, ?)')
        .bind('p-1', 'evento-inexistente', 'Ana')
        .run()
    ).rejects.toThrow(/FOREIGN KEY/);

    await db
      .prepare("INSERT INTO events (id, name, status) VALUES ('evt-1', 'Natal', 'draft')")
      .run();
    await db
      .prepare("INSERT INTO participants (id, event_id, name) VALUES ('p-1', 'evt-1', 'Ana')")
      .run();
    await db
      .prepare("INSERT INTO participants (id, event_id, name) VALUES ('p-2', 'evt-1', 'Beto')")
      .run();

    await expect(
      db
        .prepare('INSERT INTO draws (id, event_id, giver_id, receiver_id) VALUES (?, ?, ?, ?)')
        .bind('d-1', 'evt-1', 'p-1', 'p-inexistente')
        .run()
    ).rejects.toThrow(/FOREIGN KEY|Participants must belong to the draw event/);

    await db
      .prepare("INSERT INTO draws (id, event_id, giver_id, receiver_id) VALUES ('d-1', 'evt-1', 'p-1', 'p-2')")
      .run();

    // ON DELETE RESTRICT impede remover participante já sorteado
    await expect(
      db.prepare("DELETE FROM participants WHERE id = 'p-1'").run()
    ).rejects.toThrow(/FOREIGN KEY/);
  });

  it('impõe restrições CHECK e UNIQUE em events, participants e draws', async () => {
    await expect(
      db
        .prepare("INSERT INTO events (id, name, status) VALUES ('evt-bad', 'Teste', 'invalid')")
        .run()
    ).rejects.toThrow(/CHECK/);

    await db
      .prepare("INSERT INTO events (id, name, status) VALUES ('evt-1', 'Natal', 'draft')")
      .run();
    await db
      .prepare("INSERT INTO participants (id, event_id, name, token_hash) VALUES ('p-1', 'evt-1', 'Ana', 'hash-1')")
      .run();
    await db
      .prepare("INSERT INTO participants (id, event_id, name, token_hash) VALUES ('p-2', 'evt-1', 'Beto', 'hash-2')")
      .run();
    await db
      .prepare("INSERT INTO participants (id, event_id, name, token_hash) VALUES ('p-3', 'evt-1', 'Cris', 'hash-3')")
      .run();

    // Unicidade de token_hash
    await expect(
      db
        .prepare("INSERT INTO participants (id, event_id, name, token_hash) VALUES ('p-4', 'evt-1', 'Dani', 'hash-1')")
        .run()
    ).rejects.toThrow(/UNIQUE/);

    // Impede giver_id == receiver_id
    await expect(
      db
        .prepare("INSERT INTO draws (id, event_id, giver_id, receiver_id) VALUES ('d-self', 'evt-1', 'p-1', 'p-1')")
        .run()
    ).rejects.toThrow(/CHECK/);

    await db
      .prepare("INSERT INTO draws (id, event_id, giver_id, receiver_id) VALUES ('d-1', 'evt-1', 'p-1', 'p-2')")
      .run();

    // Unicidade de giver_id por evento
    await expect(
      db
        .prepare("INSERT INTO draws (id, event_id, giver_id, receiver_id) VALUES ('d-dup-giver', 'evt-1', 'p-1', 'p-3')")
        .run()
    ).rejects.toThrow(/UNIQUE/);

    // Unicidade de receiver_id por evento
    await expect(
      db
        .prepare("INSERT INTO draws (id, event_id, giver_id, receiver_id) VALUES ('d-dup-recv', 'evt-1', 'p-3', 'p-2')")
        .run()
    ).rejects.toThrow(/UNIQUE/);
  });

  it('desfaz todo o batch em caso de falha durante o sorteio (atomicidade)', async () => {
    await db
      .prepare("INSERT INTO events (id, name, status) VALUES ('evt-1', 'Natal', 'draft')")
      .run();
    await db
      .prepare("INSERT INTO participants (id, event_id, name) VALUES ('p-1', 'evt-1', 'Ana')")
      .run();
    await db
      .prepare("INSERT INTO participants (id, event_id, name) VALUES ('p-2', 'evt-1', 'Beto')")
      .run();

    // Simula falha na última instrução do batch (auto-sorteio violando CHECK)
    await expect(
      db.batch([
        db
          .prepare("UPDATE events SET status = 'completed', drawn_at = '2026-11-25T10:00:00Z' WHERE id = 'evt-1' AND status = 'draft'"),
        db
          .prepare("UPDATE participants SET token_hash = 'hash-a' WHERE id = 'p-1'"),
        db
          .prepare("INSERT INTO draws (id, event_id, giver_id, receiver_id) VALUES ('d-1', 'evt-1', 'p-1', 'p-2')"),
        db
          .prepare("INSERT INTO draws (id, event_id, giver_id, receiver_id) VALUES ('d-2', 'evt-1', 'p-2', 'p-2')"),
      ])
    ).rejects.toThrow(/CHECK/);

    // Nenhuma alteração parcial deve permanecer gravada
    const event = await db.prepare("SELECT status, drawn_at FROM events WHERE id = 'evt-1'").first();
    expect(event.status).toBe('draft');
    expect(event.drawn_at).toBeNull();

    const p1 = await db.prepare("SELECT token_hash FROM participants WHERE id = 'p-1'").first();
    expect(p1.token_hash).toBeNull();

    const draws = await db.prepare("SELECT COUNT(*) AS count FROM draws WHERE event_id = 'evt-1'").first();
    expect(draws.count).toBe(0);
  });

  it('bloqueia inserção/remoção de participantes após conclusão e associações entre eventos distintos via triggers', async () => {
    await db
      .prepare("INSERT INTO events (id, name, status) VALUES ('evt-1', 'Natal 1', 'draft')")
      .run();
    await db
      .prepare("INSERT INTO events (id, name, status) VALUES ('evt-2', 'Natal 2', 'draft')")
      .run();
    await db
      .prepare("INSERT INTO participants (id, event_id, name) VALUES ('p-1', 'evt-1', 'Ana')")
      .run();
    await db
      .prepare("INSERT INTO participants (id, event_id, name) VALUES ('p-2', 'evt-2', 'Beto')")
      .run();

    // Impede cruzar participantes de eventos diferentes na tabela draws
    await expect(
      db
        .prepare("INSERT INTO draws (id, event_id, giver_id, receiver_id) VALUES ('d-cross', 'evt-1', 'p-1', 'p-2')")
        .run()
    ).rejects.toThrow(/Participants must belong to the draw event/);

    // Marca evt-1 como completed e verifica bloqueio de INSERT e DELETE em participants
    await db
      .prepare("UPDATE events SET status = 'completed' WHERE id = 'evt-1'")
      .run();

    await expect(
      db
        .prepare("INSERT INTO participants (id, event_id, name) VALUES ('p-late', 'evt-1', 'Tardio')")
        .run()
    ).rejects.toThrow(/Cannot add participant to completed event/);

    await expect(
      db.prepare("DELETE FROM participants WHERE id = 'p-1'").run()
    ).rejects.toThrow(/Cannot delete participant from completed event/);
  });
});
