const API_BASE_URL = (import.meta.env.VITE_API_URL || 'http://localhost:8787').replace(/\/+$/, '');

export class ApiError extends Error {
  constructor(message, status = 0, details = {}) {
    super(message);
    this.name = 'ApiError';
    this.status = status;
    /** Segundos restantes de bloqueio (resposta 429 do login). */
    this.retryAfterSeconds = Number.isFinite(details.retryAfterSeconds)
      ? details.retryAfterSeconds
      : null;
    /** Tentativas de login restantes antes do bloqueio (resposta 401 do login). */
    this.attemptsRemaining = Number.isFinite(details.attemptsRemaining)
      ? details.attemptsRemaining
      : null;
  }
}

/** Retorna uma mensagem segura para exibir ao usuário. */
export function getErrorMessage(error) {
  if (error instanceof ApiError) return error.message;
  return 'Ocorreu um erro inesperado. Tente novamente.';
}

async function request(path, { method = 'GET', body, adminKey, participantToken } = {}) {
  const headers = {};
  if (body !== undefined) {
    headers['Content-Type'] = 'application/json';
  }
  if (adminKey) {
    headers.Authorization = `Bearer ${adminKey}`;
  }
  if (participantToken) {
    headers['X-Participant-Token'] = participantToken;
  }

  let response;
  try {
    response = await fetch(`${API_BASE_URL}${path}`, {
      method,
      headers,
      body: body !== undefined ? JSON.stringify(body) : undefined,
    });
  } catch {
    throw new ApiError(
      'Não foi possível conectar ao servidor. Verifique se a API está em execução e tente novamente.',
      0
    );
  }

  const data = await response.json().catch(() => null);

  if (!response.ok) {
    const message = data?.error || 'Não foi possível concluir a operação.';
    throw new ApiError(message, response.status, {
      retryAfterSeconds: data?.retryAfterSeconds,
      attemptsRemaining: data?.attemptsRemaining,
    });
  }

  return data;
}

// O parâmetro `adminKey` das chamadas abaixo é o TOKEN DE SESSÃO (Bearer), nunca a chave administrativa.
export const adminApi = {
  /** POST /api/admin/login -> { sessionToken, expiresInSeconds } (401: chave incorreta; 429: bloqueado) */
  login: (key) => request('/api/admin/login', { method: 'POST', body: { key } }),

  /** POST /api/admin/session/touch -> { ok, expiresInSeconds } — renova a inatividade (atividade real) */
  touch: (adminKey) => request('/api/admin/session/touch', { method: 'POST', adminKey }),

  /** POST /api/admin/session/logout -> { ok } — revoga a sessão no servidor */
  logout: (adminKey) => request('/api/admin/session/logout', { method: 'POST', adminKey }),

  /** GET /api/admin/events -> { events } */
  listEvents: (adminKey) => request('/api/admin/events', { adminKey }),

  /** POST /api/admin/events -> { event } */
  createEvent: (adminKey, name) =>
    request('/api/admin/events', { method: 'POST', body: { name }, adminKey }),

  /** GET /api/admin/events/:id -> { event } */
  getEvent: (adminKey, eventId) =>
    request(`/api/admin/events/${encodeURIComponent(eventId)}`, { adminKey }),

  /** DELETE /api/admin/events/:id -> { ok: true } */
  deleteEvent: (adminKey, eventId) =>
    request(`/api/admin/events/${encodeURIComponent(eventId)}`, {
      method: 'DELETE',
      adminKey,
    }),

  /** POST /api/admin/events/:id/participants -> { event } */
  addParticipant: (adminKey, eventId, name) =>
    request(`/api/admin/events/${encodeURIComponent(eventId)}/participants`, {
      method: 'POST',
      body: { name },
      adminKey,
    }),

  /** DELETE /api/admin/events/:id/participants/:participantId -> { event } */
  removeParticipant: (adminKey, eventId, participantId) =>
    request(
      `/api/admin/events/${encodeURIComponent(eventId)}/participants/${encodeURIComponent(participantId)}`,
      { method: 'DELETE', adminKey }
    ),

  /** POST /api/admin/events/:id/draw -> { event, links } */
  draw: (adminKey, eventId) =>
    request(`/api/admin/events/${encodeURIComponent(eventId)}/draw`, {
      method: 'POST',
      adminKey,
    }),
};

export const participantApi = {
  /** GET /api/sorteio/access -> { eventName, participantName, hasRevealed } */
  getAccess: (token) => request('/api/sorteio/access', { participantToken: token }),

  /** POST /api/sorteio/reveal -> { receiverName } */
  reveal: (token) => request('/api/sorteio/reveal', { method: 'POST', participantToken: token }),
};
