import { Hono } from 'hono';
import {
  getParticipantAccessService,
  revealParticipantDrawService,
} from '../services/revealService.js';
import { validateAccessToken } from '../utils/validation.js';

const sorteioRoutes = new Hono();

// GET /api/sorteio/access - Valida o token enviado via cabeçalho e retorna dados básicos
sorteioRoutes.get('/access', async (c) => {
  const token = validateAccessToken(c.req.header('X-Participant-Token'));
  const result = await getParticipantAccessService(c.env.DB, token);
  return c.json(result);
});

// POST /api/sorteio/reveal - Revela ou recupera o amigo secreto de forma idempotente
sorteioRoutes.post('/reveal', async (c) => {
  const token = validateAccessToken(c.req.header('X-Participant-Token'));
  const result = await revealParticipantDrawService(c.env.DB, token);
  return c.json(result);
});

export default sorteioRoutes;
