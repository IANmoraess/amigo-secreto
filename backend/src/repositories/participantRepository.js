export async function listParticipantsByEvent(db, eventId) {
  const { results } = await db
    .prepare(
      'SELECT id, name, has_revealed FROM participants WHERE event_id = ? ORDER BY created_at ASC, id ASC'
    )
    .bind(eventId)
    .all();

  return results ?? [];
}

/**
 * Insere participante apenas se o evento ainda estiver em 'draft',
 * evitando inclusão concorrente após a conclusão do sorteio.
 */
export async function createParticipant(db, { id, eventId, name }) {
  const result = await db
    .prepare(
      `INSERT INTO participants (id, event_id, name)
       SELECT ?, ?, ?
       WHERE EXISTS (SELECT 1 FROM events WHERE id = ? AND status = 'draft')`
    )
    .bind(id, eventId, name, eventId)
    .run();

  return result.meta?.changes ?? 0;
}

/**
 * Remove participante apenas se o evento ainda estiver em 'draft',
 * evitando remoção concorrente com a execução do sorteio.
 */
export async function deleteParticipantFromDraftEvent(db, { eventId, participantId }) {
  const result = await db
    .prepare(
      `DELETE FROM participants
       WHERE id = ?
         AND event_id = ?
         AND EXISTS (SELECT 1 FROM events WHERE id = ? AND status = 'draft')`
    )
    .bind(participantId, eventId, eventId)
    .run();

  return result.meta?.changes ?? 0;
}

export function buildAssignTokenHashStatement(db, { participantId, eventId, tokenHash }) {
  return db
    .prepare(
      'UPDATE participants SET token_hash = ? WHERE id = ? AND event_id = ? AND token_hash IS NULL'
    )
    .bind(tokenHash, participantId, eventId);
}

export async function findParticipantAccessByTokenHash(db, tokenHash) {
  return db
    .prepare(
      `SELECT
         p.id AS participant_id,
         p.name AS participant_name,
         p.has_revealed AS has_revealed,
         e.name AS event_name,
         e.status AS event_status
       FROM participants p
       INNER JOIN events e ON e.id = p.event_id
       WHERE p.token_hash = ?`
    )
    .bind(tokenHash)
    .first();
}

export async function markParticipantRevealed(db, participantId) {
  await db
    .prepare('UPDATE participants SET has_revealed = 1 WHERE id = ? AND has_revealed = 0')
    .bind(participantId)
    .run();
}
