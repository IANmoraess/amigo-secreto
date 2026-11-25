const API_BASE_URL = (import.meta.env.VITE_API_URL || 'http://localhost:8787').replace(/\/+$/, '');

export class ApiError extends Error {
  constructor(message, status = 0) {
    super(message);
    this.name = 'ApiError';
    this.status = status;
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
    throw new ApiError(message, response.status);
  }

  return data;
}

export const adminApi = {
  /** GET /api/admin/verify -> { ok: true } */
  verify: (adminKey) => request('/api/admin/verify', { adminKey }),

  /** GET /api/admin/events -> { events } */
  listEvents: (adminKey) => request('/api/admin/events', { adminKey }),

  /** POST /api/admin/events -> { event } */
  createEvent: (adminKey, name) =>
    request('/api/admin/events', { method: 'POST', body: { name }, adminKey }),

  /** GET /api/admin/events/:id -> { event } */
  getEvent: (adminKey, eventId) =>
    request(`/api/admin/events/${encodeURIComponent(eventId)}`, { adminKey }),

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
