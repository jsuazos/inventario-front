import configService from './configService.js';

const SESSION_VERIFY_TIMEOUT_MS = 5000;

export async function verifyStoredSession() {
  const { apiUrl } = await configService();
  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), SESSION_VERIFY_TIMEOUT_MS);

  try {
    const response = await fetch(`${apiUrl.replace(/\/$/, '')}/login/verify`, {
      method: 'POST',
      credentials: 'include',
      signal: controller.signal,
    });

    if (!response.ok) {
      return null;
    }

    return response.json();
  } catch (error) {
    if (error.name === 'AbortError') {
      return { valido: false, pending: true };
    }
    throw error;
  } finally {
    clearTimeout(timeoutId);
  }
}

export async function closeStoredSession() {
  const { apiUrl } = await configService();
  const response = await fetch(`${apiUrl.replace(/\/$/, '')}/logout`, {
    method: 'POST',
    credentials: 'include',
  });

  if (!response.ok) {
    throw new Error('No se pudo cerrar la sesión en el servidor.');
  }
}
