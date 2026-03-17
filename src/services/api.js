import configService from './configService.js';

export async function fetchConStatusOk(url, opciones = {}) {
  try {
    const respuesta = await fetch(url, opciones);

    const data = await respuesta.json(); // tu API siempre responde JSON, incluso con error

    if (!respuesta.ok) {
      // Tu backend devuelve { error: '...' }
      throw new Error(data.error || `Error ${respuesta.status}`);
    }

    return data; // Solo llega aquí si status 2xx

  } catch (error) {
    // Puede ser error de red o error lanzado por el backend
    // console.error('Error en fetchConStatusOk:', error.message);
    throw error;
  }
}

export class ApiClient {
  async get(endpoint) {
    const { apiUrl } = await configService();
    const base = apiUrl.replace(/\/$/, "");
    const url = `${base}${endpoint}`;
    return fetch(url).then(r => r.json());
  }

  async post(endpoint, body) {
    const { apiUrl } = await configService();
    const base = apiUrl.replace(/\/$/, "");
    const url = `${base}${endpoint}`;
    return fetchConStatusOk(url, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(body)
    });
  }
}
