import { HTTPException } from 'hono/http-exception';

const EVENT_NAME_MAX_LENGTH = 100;
const PARTICIPANT_NAME_MAX_LENGTH = 60;
const MAX_BODY_BYTES = 4096;
const IDENTIFIER_REGEX = /^[A-Za-z0-9_-]{1,64}$/;
const ACCESS_TOKEN_REGEX = /^[A-Za-z0-9_-]{20,128}$/;
// Rejeita caracteres de controle ASCII (0x00-0x1F, 0x7F) e controles bidirecionais Unicode
const UNSAFE_TEXT_CHARS_REGEX = /[\u0000-\u001F\u007F\u202A-\u202E\u2066-\u2069]/;

const textEncoder = new TextEncoder();

/** Faz o parse seguro do corpo JSON da requisição com limite máximo de tamanho. */
export async function parseJsonBody(c) {
  const contentLength = c.req.header('Content-Length');
  if (contentLength && Number(contentLength) > MAX_BODY_BYTES) {
    throw new HTTPException(413, { message: 'Requisição muito grande.' });
  }

  let raw;
  try {
    raw = await c.req.text();
  } catch {
    throw new HTTPException(400, { message: 'Corpo da requisição inválido.' });
  }

  if (textEncoder.encode(raw).length > MAX_BODY_BYTES) {
    throw new HTTPException(413, { message: 'Requisição muito grande.' });
  }

  let body;
  try {
    body = JSON.parse(raw);
  } catch {
    throw new HTTPException(400, { message: 'Corpo da requisição inválido.' });
  }

  if (!body || typeof body !== 'object' || Array.isArray(body)) {
    throw new HTTPException(400, { message: 'Corpo da requisição inválido.' });
  }

  return body;
}

function validateNonEmptyText(value, fieldLabel, maxLength) {
  if (typeof value !== 'string') {
    throw new HTTPException(400, { message: `${fieldLabel} é obrigatório.` });
  }

  const trimmed = value.trim();
  if (trimmed.length === 0) {
    throw new HTTPException(400, { message: `${fieldLabel} é obrigatório.` });
  }

  if (UNSAFE_TEXT_CHARS_REGEX.test(trimmed)) {
    throw new HTTPException(400, { message: 'O texto contém caracteres inválidos.' });
  }

  if (trimmed.length > maxLength) {
    throw new HTTPException(400, {
      message: `${fieldLabel} deve ter no máximo ${maxLength} caracteres.`,
    });
  }

  return trimmed;
}

export function validateEventName(name) {
  return validateNonEmptyText(name, 'Nome do evento', EVENT_NAME_MAX_LENGTH);
}

export function validateParticipantName(name) {
  return validateNonEmptyText(name, 'Nome do participante', PARTICIPANT_NAME_MAX_LENGTH);
}

export function validateIdentifier(id, label = 'Identificador') {
  if (typeof id !== 'string' || !IDENTIFIER_REGEX.test(id)) {
    throw new HTTPException(400, { message: `${label} inválido.` });
  }
  return id;
}

/**
 * Valida o formato do token individual sem distinguir formato inválido de token inexistente.
 */
export function validateAccessToken(token) {
  if (typeof token !== 'string' || !ACCESS_TOKEN_REGEX.test(token)) {
    throw new HTTPException(404, { message: 'Link inválido ou sorteio não disponível.' });
  }
  return token;
}
