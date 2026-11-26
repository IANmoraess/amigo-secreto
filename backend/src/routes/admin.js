import { Hono } from 'hono';
import { HTTPException } from 'hono/http-exception';
import {
  revokeAdminSessionService,
  touchAdminSessionService,
} from '../services/adminSessionService.js';
import {
  addParticipantService,
  createEventService,
  deleteEventService,
  executeEventDrawService,
  getEventService,
  listEventsService,
  removeParticipantService,
} from '../services/eventService.js';
import {
  parseJsonBody,
  validateEventName,
  validateIdentifier,
  validateParticipantName,
} from '../utils/validation.js';

const adminRoutes = new Hono();

// GET /api/admin/session - Consulta somente leitura da sessão (NÃO renova a inatividade)
adminRoutes.get('/session', (c) => {
  const { expiresAt } = c.get('adminSession');
  return c.json({ ok: true, expiresInSeconds: Math.max(0, Math.floor((expiresAt - Date.now()) / 1000)) });
});

// POST /api/admin/session/touch - Renova a inatividade; chamado apenas por atividade real do organizador
adminRoutes.post('/session/touch', async (c) => {
  const { tokenHash } = c.get('adminSession');
  const result = await touchAdminSessionService(c.env.DB, tokenHash);
  if (!result) {
    throw new HTTPException(401, { message: 'Sessão inválida ou expirada.' });
  }
  return c.json({ ok: true, ...result });
});

// POST /api/admin/session/logout - Revoga a sessão no servidor
adminRoutes.post('/session/logout', async (c) => {
  const { tokenHash } = c.get('adminSession');
  await revokeAdminSessionService(c.env.DB, tokenHash);
  return c.json({ ok: true });
});

// POST /api/admin/events - Cria um evento em status 'draft'
adminRoutes.post('/events', async (c) => {
  const body = await parseJsonBody(c);
  const name = validateEventName(body.name);
  const result = await createEventService(c.env.DB, name);
  return c.json(result, 201);
});

// GET /api/admin/events - Lista eventos salvos no banco sem expor resultados
adminRoutes.get('/events', async (c) => {
  const result = await listEventsService(c.env.DB);
  return c.json(result);
});

// GET /api/admin/events/:id - Consulta evento e participantes sem expor resultados
adminRoutes.get('/events/:id', async (c) => {
  const eventId = validateIdentifier(c.req.param('id'), 'Código do evento');
  const result = await getEventService(c.env.DB, eventId);
  return c.json(result);
});

// DELETE /api/admin/events/:id - Exclui definitivamente um evento e todos os dados associados
adminRoutes.delete('/events/:id', async (c) => {
  const eventId = validateIdentifier(c.req.param('id'), 'Código do evento');
  const result = await deleteEventService(c.env.DB, eventId);
  return c.json(result);
});

// POST /api/admin/events/:id/participants - Cadastra participante antes do sorteio
adminRoutes.post('/events/:id/participants', async (c) => {
  const eventId = validateIdentifier(c.req.param('id'), 'Código do evento');
  const body = await parseJsonBody(c);
  const name = validateParticipantName(body.name);
  const result = await addParticipantService(c.env.DB, eventId, name);
  return c.json(result, 201);
});

// DELETE /api/admin/events/:id/participants/:participantId - Remove participante antes do sorteio
adminRoutes.delete('/events/:id/participants/:participantId', async (c) => {
  const eventId = validateIdentifier(c.req.param('id'), 'Código do evento');
  const participantId = validateIdentifier(
    c.req.param('participantId'),
    'Identificador do participante'
  );
  const result = await removeParticipantService(c.env.DB, eventId, participantId);
  return c.json(result);
});

// POST /api/admin/events/:id/draw - Executa o sorteio único e atômico
adminRoutes.post('/events/:id/draw', async (c) => {
  const eventId = validateIdentifier(c.req.param('id'), 'Código do evento');
  const result = await executeEventDrawService(c.env.DB, eventId);
  return c.json(result);
});

export default adminRoutes;
