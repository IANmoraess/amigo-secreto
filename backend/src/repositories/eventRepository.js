export async function createEvent(db, { id, name }) {
  await db
    .prepare("INSERT INTO events (id, name, status) VALUES (?, ?, 'draft')")
    .bind(id, name)
    .run();
}

export async function findEventById(db, eventId) {
  return db
    .prepare('SELECT id, name, status, created_at, drawn_at FROM events WHERE id = ?')
    .bind(eventId)
    .first();
}

export async function listEvents(db) {
  const result = await db
    .prepare(
      `SELECT e.id, e.name, e.status, e.created_at, e.drawn_at,
              COUNT(p.id) AS participant_count
       FROM events e
       LEFT JOIN participants p ON p.event_id = e.id
       GROUP BY e.id
       ORDER BY e.created_at DESC`
    )
    .all();
  return result?.results ?? [];
}

export function buildMarkCompletedStatement(db, { eventId, drawnAt }) {
  return db
    .prepare("UPDATE events SET status = 'completed', drawn_at = ? WHERE id = ? AND status = 'draft'")
    .bind(drawnAt, eventId);
}

/**
 * Remove atomicamente um evento e todos os seus dados associados (sorteios e participantes).
 * A atualização para 'draft' dentro do mesmo batch permite remover participantes de eventos
 * já sorteados sem violar o trigger de integridade `trg_participants_no_delete_after_draw`.
 */
export async function deleteEventCascade(db, eventId) {
  const results = await db.batch([
    db.prepare('DELETE FROM draws WHERE event_id = ?').bind(eventId),
    db.prepare("UPDATE events SET status = 'draft' WHERE id = ?").bind(eventId),
    db.prepare('DELETE FROM participants WHERE event_id = ?').bind(eventId),
    db.prepare('DELETE FROM events WHERE id = ?').bind(eventId),
  ]);

  return results[3]?.meta?.changes ?? 0;
}
