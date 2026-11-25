import { HTTPException } from 'hono/http-exception';
import {
  buildInsertDrawStatement,
  executeAtomicDrawBatch,
} from '../repositories/drawRepository.js';
import {
  buildMarkCompletedStatement,
  createEvent,
  findEventById,
  listEvents,
} from '../repositories/eventRepository.js';
import {
  buildAssignTokenHashStatement,
  createParticipant,
  deleteParticipantFromDraftEvent,
  listParticipantsByEvent,
} from '../repositories/participantRepository.js';
import { generateSecureToken, hashToken } from '../utils/crypto.js';
import { generateDrawAssignments } from './drawService.js';

const MAX_PARTICIPANTS_PER_EVENT = 100;

function formatEvent(event, participants) {
  return {
    id: event.id,
    name: event.name,
    status: event.status,
    createdAt: event.created_at,
    drawnAt: event.drawn_at ?? null,
    participants: participants.map((participant) => ({
      id: participant.id,
      name: participant.name,
      hasRevealed: Boolean(participant.has_revealed),
    })),
  };
}

async function requireEvent(db, eventId) {
  const event = await findEventById(db, eventId);
  if (!event) {
    throw new HTTPException(404, { message: 'Evento não encontrado.' });
  }
  return event;
}

export async function createEventService(db, name) {
  const id = crypto.randomUUID();
  await createEvent(db, { id, name });

  const event = await requireEvent(db, id);
  return { event: formatEvent(event, []) };
}

export async function getEventService(db, eventId) {
  const event = await requireEvent(db, eventId);
  const participants = await listParticipantsByEvent(db, eventId);
  return { event: formatEvent(event, participants) };
}

export async function listEventsService(db) {
  const rows = await listEvents(db);
  return {
    events: rows.map((event) => ({
      id: event.id,
      name: event.name,
      status: event.status,
      createdAt: event.created_at,
      drawnAt: event.drawn_at ?? null,
      participantCount: Number(event.participant_count ?? 0),
    })),
  };
}

export async function addParticipantService(db, eventId, name) {
  const event = await requireEvent(db, eventId);
  if (event.status !== 'draft') {
    throw new HTTPException(409, {
      message: 'Não é possível adicionar participantes após o sorteio.',
    });
  }

  const existing = await listParticipantsByEvent(db, eventId);
  if (existing.length >= MAX_PARTICIPANTS_PER_EVENT) {
    throw new HTTPException(400, {
      message: `Limite máximo de ${MAX_PARTICIPANTS_PER_EVENT} participantes por evento atingido.`,
    });
  }

  const normalizedName = name.toLowerCase();
  if (existing.some((participant) => participant.name.toLowerCase() === normalizedName)) {
    throw new HTTPException(409, {
      message: 'Já existe um participante com este nome neste evento.',
    });
  }

  const participantId = crypto.randomUUID();
  let insertedCount = 0;
  try {
    insertedCount = await createParticipant(db, { id: participantId, eventId, name });
  } catch (error) {
    const message = String(error?.message || '');
    if (message.includes('Cannot add participant to completed event')) {
      throw new HTTPException(409, {
        message: 'Não é possível adicionar participantes após o sorteio.',
      });
    }
    throw error;
  }

  if (insertedCount !== 1) {
    throw new HTTPException(409, {
      message: 'Não é possível adicionar participantes após o sorteio.',
    });
  }

  const currentEvent = await requireEvent(db, eventId);
  const participants = await listParticipantsByEvent(db, eventId);
  return { event: formatEvent(currentEvent, participants) };
}

export async function removeParticipantService(db, eventId, participantId) {
  const event = await requireEvent(db, eventId);
  if (event.status !== 'draft') {
    throw new HTTPException(409, {
      message: 'Não é possível remover participantes após o sorteio.',
    });
  }

  const deletedCount = await deleteParticipantFromDraftEvent(db, { eventId, participantId });
  if (deletedCount === 0) {
    const refreshedEvent = await requireEvent(db, eventId);
    if (refreshedEvent.status !== 'draft') {
      throw new HTTPException(409, {
        message: 'Não é possível remover participantes após o sorteio.',
      });
    }
    throw new HTTPException(404, { message: 'Participante não encontrado.' });
  }

  const participants = await listParticipantsByEvent(db, eventId);
  return { event: formatEvent(event, participants) };
}

/**
 * Executa o sorteio de forma única e atômica no D1 via `env.DB.batch()`.
 * - Atualiza o status do evento condicionalmente (`WHERE status = 'draft'`).
 * - Grava apenas os hashes SHA-256 dos tokens individuais.
 * - Insere todas as associações em `draws` na mesma transação implícita.
 * - Retorna os tokens originais exclusivamente em memória nesta resposta.
 */
export async function executeEventDrawService(db, eventId) {
  const event = await requireEvent(db, eventId);
  if (event.status !== 'draft') {
    throw new HTTPException(409, { message: 'O sorteio deste evento já foi realizado.' });
  }

  const participants = await listParticipantsByEvent(db, eventId);
  if (participants.length < 2) {
    throw new HTTPException(400, {
      message: 'São necessários pelo menos dois participantes para realizar o sorteio.',
    });
  }

  const assignments = generateDrawAssignments(participants);
  const drawnAt = new Date().toISOString();

  const links = [];
  const tokenStatements = [];

  for (const participant of participants) {
    const token = generateSecureToken();
    const tokenHash = await hashToken(token);

    links.push({
      participantId: participant.id,
      name: participant.name,
      token,
    });

    tokenStatements.push(
      buildAssignTokenHashStatement(db, {
        participantId: participant.id,
        eventId,
        tokenHash,
      })
    );
  }

  const drawStatements = assignments.map(({ giverId, receiverId }) =>
    buildInsertDrawStatement(db, {
      id: crypto.randomUUID(),
      eventId,
      giverId,
      receiverId,
    })
  );

  const eventStatement = buildMarkCompletedStatement(db, { eventId, drawnAt });
  const batchStatements = [eventStatement, ...tokenStatements, ...drawStatements];

  let batchResults;
  try {
    batchResults = await executeAtomicDrawBatch(db, batchStatements);
  } catch (error) {
    const message = String(error?.message || '');
    if (message.includes('UNIQUE constraint failed') || message.includes('SQLITE_CONSTRAINT')) {
      throw new HTTPException(409, { message: 'O sorteio deste evento já foi realizado.' });
    }
    throw error;
  }

  const eventChanges = batchResults[0]?.meta?.changes ?? 0;
  if (eventChanges !== 1) {
    throw new HTTPException(409, { message: 'O sorteio deste evento já foi realizado.' });
  }

  for (let i = 1; i <= tokenStatements.length; i += 1) {
    if ((batchResults[i]?.meta?.changes ?? 0) !== 1) {
      throw new HTTPException(409, { message: 'O sorteio deste evento já foi realizado.' });
    }
  }

  const updatedEvent = await requireEvent(db, eventId);
  const updatedParticipants = await listParticipantsByEvent(db, eventId);

  return {
    event: formatEvent(updatedEvent, updatedParticipants),
    links,
  };
}
