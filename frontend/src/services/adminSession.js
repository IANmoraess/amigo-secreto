/**
 * Armazenamento da credencial de SESSÃO do organizador.
 *
 * Guarda apenas o token de sessão opaco emitido pelo backend (aleatório, revogável e
 * com expiração por inatividade controlada no servidor). A chave administrativa
 * original (ADMIN_TOKEN) NUNCA é gravada no navegador.
 */
const STORAGE_KEY = 'amigo-secreto:admin-session';

export function loadStoredSession() {
  try {
    return window.localStorage.getItem(STORAGE_KEY) || null;
  } catch {
    return null; // armazenamento indisponível (modo privado restrito, políticas do navegador)
  }
}

export function storeSession(sessionToken) {
  try {
    window.localStorage.setItem(STORAGE_KEY, sessionToken);
  } catch {
    // Sem armazenamento: a sessão continua válida apenas enquanto a página permanecer aberta.
  }
}

export function clearStoredSession() {
  try {
    window.localStorage.removeItem(STORAGE_KEY);
  } catch {
    // nada a fazer
  }
}
