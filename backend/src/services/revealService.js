import { HTTPException } from 'hono/http-exception';
import { findDrawResultByTokenHash } from '../repositories/drawRepository.js';
import {
  findParticipantAccessByTokenHash,
  markParticipantRevealed,
} from '../repositories/participantRepository.js';
import { hashToken } from '../utils/crypto.js';

const INVALID_ACCESS_MESSAGE = 'Link inválido ou sorteio não disponível.';

/**
 * Valida o token individual e retorna apenas informações básicas
 * do evento e do participante, sem revelar o amigo secreto.
 */
export async function getParticipantAccessService(db, token) {
  const tokenHash = await hashToken(token);
  const record = await findParticipantAccessByTokenHash(db, tokenHash);

  if (!record || record.event_status !== 'completed') {
    throw new HTTPException(404, { message: INVALID_ACCESS_MESSAGE });
  }

  return {
    eventName: record.event_name,
    participantName: record.participant_name,
    hasRevealed: Boolean(record.has_revealed),
  };
}

/**
 * Revela ou recupera o resultado individual do participante de forma idempotente.
 * Registra a primeira revelação (`has_revealed = 1`) e retorna somente o nome sorteado.
 */
export async function revealParticipantDrawService(db, token) {
  const tokenHash = await hashToken(token);
  const record = await findDrawResultByTokenHash(db, tokenHash);

  if (!record || record.event_status !== 'completed' || !record.receiver_name) {
    throw new HTTPException(404, { message: INVALID_ACCESS_MESSAGE });
  }

  if (!record.has_revealed) {
    await markParticipantRevealed(db, record.participant_id);
  }

  return {
    receiverName: record.receiver_name,
  };
}
