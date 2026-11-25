import { randomInt } from '../utils/crypto.js';

/**
 * Gera os pares do sorteio de amigo secreto utilizando o algoritmo de Sattolo
 * com aleatoriedade criptograficamente segura (crypto.getRandomValues).
 *
 * Nota sobre o algoritmo de Sattolo:
 * - Trata-se de uma variante do embaralhamento de Fisher-Yates que produz
 *   uniformemente uma permutação cíclica única envolvendo todos os participantes.
 * - O fato de formar um único ciclo garante matematicamente que:
 *   1. Nenhum participante tira a si mesmo (sem pontos fixos);
 *   2. Cada participante sorteia exatamente uma pessoa;
 *   3. Cada participante é sorteado exatamente uma vez;
 *   4. Todos os participantes possuem resultado em tempo O(n), sem retentativas.
 * - Essa propriedade de ciclo único não compromete nenhuma regra de negócio do sorteio.
 *
 * @param {Array<{ id: string }>} participants
 * @returns {Array<{ giverId: string, receiverId: string }>}
 */
export function generateDrawAssignments(participants) {
  if (!Array.isArray(participants) || participants.length < 2) {
    throw new Error('São necessários pelo menos dois participantes para realizar o sorteio.');
  }

  const ids = participants.map((participant) => participant.id);
  const uniqueIds = new Set(ids);
  if (uniqueIds.size !== ids.length) {
    throw new Error('Os participantes do sorteio devem possuir identificadores únicos.');
  }

  // Algoritmo de Sattolo: troca o elemento i apenas com índices j em [0, i)
  const receivers = [...ids];
  for (let i = receivers.length - 1; i > 0; i -= 1) {
    const j = randomInt(i);
    const temp = receivers[i];
    receivers[i] = receivers[j];
    receivers[j] = temp;
  }

  return ids.map((giverId, index) => ({
    giverId,
    receiverId: receivers[index],
  }));
}
