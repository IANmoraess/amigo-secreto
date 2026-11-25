export function buildInsertDrawStatement(db, { id, eventId, giverId, receiverId }) {
  return db
    .prepare('INSERT INTO draws (id, event_id, giver_id, receiver_id) VALUES (?, ?, ?, ?)')
    .bind(id, eventId, giverId, receiverId);
}

/**
 * Executa todas as instruções do sorteio em um único batch atômico do Cloudflare D1.
 * O D1 garante transação implícita: qualquer falha de restrição SQL desfaz todo o batch.
 */
export async function executeAtomicDrawBatch(db, statements) {
  return db.batch(statements);
}

export async function findDrawResultByTokenHash(db, tokenHash) {
  return db
    .prepare(
      `SELECT
         giver.id AS participant_id,
         giver.has_revealed AS has_revealed,
         e.status AS event_status,
         receiver.name AS receiver_name
       FROM participants giver
       INNER JOIN events e ON e.id = giver.event_id
       INNER JOIN draws d ON d.giver_id = giver.id AND d.event_id = giver.event_id
       INNER JOIN participants receiver ON receiver.id = d.receiver_id AND receiver.event_id = d.event_id
       WHERE giver.token_hash = ?`
    )
    .bind(tokenHash)
    .first();
}
