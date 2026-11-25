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
