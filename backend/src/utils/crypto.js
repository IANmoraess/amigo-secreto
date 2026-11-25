const textEncoder = new TextEncoder();

/**
 * Gera um inteiro aleatório criptograficamente seguro no intervalo [0, max)
 * utilizando rejection sampling para evitar viés de módulo.
 */
export function randomInt(max) {
  if (!Number.isInteger(max) || max <= 0 || max > 0xffffffff) {
    throw new RangeError('O limite superior deve ser um inteiro positivo válido.');
  }

  const range = 0x100000000; // 2^32
  const limit = range - (range % max);
  const buffer = new Uint32Array(1);

  while (true) {
    crypto.getRandomValues(buffer);
    if (buffer[0] < limit) {
      return buffer[0] % max;
    }
  }
}

/**
 * Gera um token aleatório criptograficamente seguro (256 bits por padrão)
 * codificado em base64url (seguro para URLs).
 */
export function generateSecureToken(byteLength = 32) {
  const bytes = new Uint8Array(byteLength);
  crypto.getRandomValues(bytes);

  let binary = '';
  for (let i = 0; i < bytes.length; i += 1) {
    binary += String.fromCharCode(bytes[i]);
  }

  return btoa(binary).replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/g, '');
}

/**
 * Calcula o hash SHA-256 em hexadecimal de um token.
 * Apenas o hash deve ser persistido no banco de dados.
 */
export async function hashToken(token) {
  if (typeof token !== 'string' || token.length === 0) {
    throw new TypeError('Token inválido para geração de hash.');
  }

  const data = textEncoder.encode(token);
  const digest = await crypto.subtle.digest('SHA-256', data);
  const bytes = new Uint8Array(digest);

  return Array.from(bytes, (b) => b.toString(16).padStart(2, '0')).join('');
}

/**
 * Compara duas strings em tempo constante sobre hashes SHA-256,
 * evitando vazamento de tamanho ou prefixo por tempo de execução.
 */
export async function timingSafeEqual(a, b) {
  if (typeof a !== 'string' || typeof b !== 'string') {
    return false;
  }

  const [hashA, hashB] = await Promise.all([
    crypto.subtle.digest('SHA-256', textEncoder.encode(a)),
    crypto.subtle.digest('SHA-256', textEncoder.encode(b)),
  ]);

  const viewA = new Uint8Array(hashA);
  const viewB = new Uint8Array(hashB);

  let diff = a.length ^ b.length;
  for (let i = 0; i < viewA.length; i += 1) {
    diff |= viewA[i] ^ viewB[i];
  }

  return diff === 0;
}
