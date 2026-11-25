import { describe, expect, it } from 'vitest';
import { generateDrawAssignments } from '../src/services/drawService.js';
import {
  generateSecureToken,
  hashToken,
  randomInt,
  timingSafeEqual,
} from '../src/utils/crypto.js';

function makeParticipants(count) {
  return Array.from({ length: count }, (_, index) => ({
    id: `p-${index + 1}`,
    name: `Participante ${index + 1}`,
  }));
}

function assertValidDraw(participants, assignments) {
  expect(assignments).toHaveLength(participants.length);

  const participantIds = new Set(participants.map((p) => p.id));
  const givers = new Set();
  const receivers = new Set();
  const nextMap = new Map();

  for (const { giverId, receiverId } of assignments) {
    expect(participantIds.has(giverId)).toBe(true);
    expect(participantIds.has(receiverId)).toBe(true);
    expect(giverId).not.toBe(receiverId);

    givers.add(giverId);
    receivers.add(receiverId);
    nextMap.set(giverId, receiverId);
  }

  expect(givers.size).toBe(participants.length);
  expect(receivers.size).toBe(participants.length);

  // Confirma a propriedade de ciclo único do algoritmo de Sattolo
  const visited = new Set();
  let current = participants[0].id;
  for (let i = 0; i < participants.length; i += 1) {
    visited.add(current);
    current = nextMap.get(current);
  }
  expect(visited.size).toBe(participants.length);
  expect(current).toBe(participants[0].id);
}

describe('Algoritmo de sorteio (Sattolo)', () => {
  it('rejeita sorteio com menos de dois participantes', () => {
    expect(() => generateDrawAssignments([])).toThrow();
    expect(() => generateDrawAssignments(makeParticipants(1))).toThrow();
    expect(() => generateDrawAssignments(null)).toThrow();
  });

  it('rejeita participantes com identificadores duplicados', () => {
    expect(() =>
      generateDrawAssignments([
        { id: 'dup', name: 'A' },
        { id: 'dup', name: 'B' },
      ])
    ).toThrow();
  });

  it('funciona corretamente com exatamente 2 participantes', () => {
    const participants = makeParticipants(2);
    const assignments = generateDrawAssignments(participants);

    assertValidDraw(participants, assignments);
    expect(assignments).toEqual([
      { giverId: 'p-1', receiverId: 'p-2' },
      { giverId: 'p-2', receiverId: 'p-1' },
    ]);
  });

  it.each([3, 4, 5, 10, 25, 50])(
    'garante sorteio válido e sem auto-sorteio para %i participantes em múltiplas execuções',
    (count) => {
      const participants = makeParticipants(count);
      for (let run = 0; run < 50; run += 1) {
        const assignments = generateDrawAssignments(participants);
        assertValidDraw(participants, assignments);
      }
    }
  );
});

describe('Utilitários criptográficos', () => {
  it('randomInt respeita o intervalo [0, max) e valida limites', () => {
    expect(() => randomInt(0)).toThrow(RangeError);
    expect(() => randomInt(-5)).toThrow(RangeError);
    expect(() => randomInt(1.5)).toThrow(RangeError);

    for (let i = 0; i < 100; i += 1) {
      const value = randomInt(7);
      expect(Number.isInteger(value)).toBe(true);
      expect(value).toBeGreaterThanOrEqual(0);
      expect(value).toBeLessThan(7);
    }
  });

  it('generateSecureToken gera tokens únicos e seguros para URL', () => {
    const tokens = new Set();
    for (let i = 0; i < 50; i += 1) {
      const token = generateSecureToken();
      expect(token).toMatch(/^[A-Za-z0-9_-]{43}$/);
      tokens.add(token);
    }
    expect(tokens.size).toBe(50);
  });

  it('hashToken gera hash SHA-256 determinístico de 64 caracteres hexadecimais', async () => {
    const hash1 = await hashToken('token-exemplo');
    const hash2 = await hashToken('token-exemplo');
    const hash3 = await hashToken('outro-token');

    expect(hash1).toMatch(/^[0-9a-f]{64}$/);
    expect(hash1).toBe(hash2);
    expect(hash1).not.toBe(hash3);
    await expect(hashToken('')).rejects.toThrow(TypeError);
  });

  it('timingSafeEqual compara strings corretamente', async () => {
    expect(await timingSafeEqual('segredo-123', 'segredo-123')).toBe(true);
    expect(await timingSafeEqual('segredo-123', 'segredo-124')).toBe(false);
    expect(await timingSafeEqual('segredo', 'segredo-maior')).toBe(false);
    expect(await timingSafeEqual('segredo', null)).toBe(false);
  });
});
