/**
 * Guarda temporariamente o token do participante em `sessionStorage` (apenas na aba atual).
 * Ao fechar a aba, o token é descartado automaticamente para preservar a privacidade.
 */
const STORAGE_KEY = 'amigo-secreto:participant-token';

export function loadParticipantToken() {
  try {
    return window.sessionStorage.getItem(STORAGE_KEY) || null;
  } catch {
    return null;
  }
}

export function saveParticipantToken(token) {
  if (!token) return;
  try {
    window.sessionStorage.setItem(STORAGE_KEY, token);
  } catch {
    // sessionStorage indisponível
  }
}

export function clearParticipantToken() {
  try {
    window.sessionStorage.removeItem(STORAGE_KEY);
  } catch {
    // nada a fazer
  }
}
