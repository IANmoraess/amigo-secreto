import { Hono } from 'hono';
import {
  addParticipantService,
  createEventService,
  executeEventDrawService,
  getEventService,
  removeParticipantService,
} from '../services/eventService.js';
import {
  parseJsonBody,
  validateEventName,
  validateIdentifier,
  validateParticipantName,
} from '../utils/validation.js';

const adminRoutes = new Hono();

// GET /api/admin/verify - Valida a chave administrativa antes de abrir o painel
adminRoutes.get('/verify', (c) => {
  return c.json({ ok: true });
});

// POST /api/admin/events - Cria um evento em status 'draft'
adminRoutes.post('/events', async (c) => {
  const body = await parseJsonBody(c);
  const name = validateEventName(body.name);
  const result = await createEventService(c.env.DB, name);
  return c.json(result, 201);
});

// GET /api/admin/events/:id - Consulta evento e participantes sem expor resultados
adminRoutes.get('/events/:id', async (c) => {
  const eventId = validateIdentifier(c.req.param('id'), 'Código do evento');
  const result = await getEventService(c.env.DB, eventId);
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
