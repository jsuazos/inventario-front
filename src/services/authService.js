import configService from './configService.js';

export async function verifyStoredSession() {
  const { apiUrl } = await configService();
  const response = await fetch(`${apiUrl.replace(/\/$/, '')}/login/verify`, {
    method: 'POST',
    credentials: 'include',
  });

  if (!response.ok) {
    return null;
  }

  return response.json();
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
