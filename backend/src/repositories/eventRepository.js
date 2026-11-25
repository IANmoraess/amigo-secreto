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

export function buildMarkCompletedStatement(db, { eventId, drawnAt }) {
  return db
    .prepare("UPDATE events SET status = 'completed', drawn_at = ? WHERE id = ? AND status = 'draft'")
    .bind(drawnAt, eventId);
}
