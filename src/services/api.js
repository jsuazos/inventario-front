import configService from './configService.js';
import { errorHandler } from './errorHandler.js';

export async function fetchConStatusOk(url, opciones = {}) {
  try {
    const respuesta = await fetch(url, opciones);

    const data = await respuesta.json(); // tu API siempre responde JSON, incluso con error

    if (!respuesta.ok) {
      // Tu backend devuelve { error: '...' }
      const error = new Error(data.error || `Error ${respuesta.status}`);
      errorHandler.handleApiError(error, url, opciones);
      throw error;
    }

    return data; // Solo llega aquí si status 2xx

  } catch (error) {
    // Puede ser error de red o error lanzado por el backend
    if (error.name === 'TypeError' || error.message.includes('fetch')) {
      errorHandler.handleNetworkError(error, `fetch ${url}`);
    } else {
      errorHandler.handle(error, { url, opciones });
    }
    throw error;
  }
}

export class ApiClient {
  constructor() {
    this.defaultTimeout = 10000; // 10 segundos
    this.maxRetries = 3;
  }

  async get(endpoint, options = {}) {
    return this.request('GET', endpoint, null, options);
  }

  async post(endpoint, body, options = {}) {
    return this.request('POST', endpoint, body, options);
  }

  async put(endpoint, body, options = {}) {
    return this.request('PUT', endpoint, body, options);
  }

  async delete(endpoint, options = {}) {
    return this.request('DELETE', endpoint, null, options);
  }

  async request(method, endpoint, body = null, options = {}) {
    const { timeout = this.defaultTimeout, retries = this.maxRetries } = options;

    try {
      const { apiUrl } = await configService();
      const base = apiUrl.replace(/\/$/, "");
      const url = `${base}${endpoint}`;

      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), timeout);

      const fetchOptions = {
        method,
        signal: controller.signal,
        headers: {
          'Content-Type': 'application/json',
          ...options.headers
        }
      };

      if (body && (method === 'POST' || method === 'PUT')) {
        fetchOptions.body = JSON.stringify(body);
      }

      const response = await fetch(url, fetchOptions);
      clearTimeout(timeoutId);

      const data = await response.json();

      if (!response.ok) {
        const error = new Error(data.error || `HTTP ${response.status}`);
        errorHandler.handleApiError(error, url, { method, body, options });
        throw error;
      }

      return data;

    } catch (error) {
      // Manejar diferentes tipos de error
      if (error.name === 'AbortError') {
        const timeoutError = new Error(`Request timeout after ${timeout}ms`);
        errorHandler.handleNetworkError(timeoutError, `${method} ${endpoint}`);
        throw timeoutError;
      }

      if (error.name === 'TypeError' || error.message.includes('fetch')) {
        errorHandler.handleNetworkError(error, `${method} ${endpoint}`);
      } else {
        errorHandler.handle(error, { method, endpoint, body, options });
      }

      throw error;
    }
  }

  /**
   * Ejecuta una operación con reintento automático
   * @param {Function} operation - Función asíncrona a ejecutar
   * @param {Object} options - Opciones de reintento
   */
  async withRetry(operation, options = {}) {
    const { maxRetries = this.maxRetries, delay = 1000 } = options;
    let lastError;

    for (let attempt = 1; attempt <= maxRetries; attempt++) {
      try {
        return await operation();
      } catch (error) {
        lastError = error;

        if (attempt === maxRetries || !errorHandler.isRetryableError(error)) {
          throw error;
        }

        console.warn(`Intento ${attempt}/${maxRetries} falló, reintentando en ${delay}ms...`);
        await new Promise(resolve => setTimeout(resolve, delay));
        delay *= 2; // Exponential backoff
      }
    }

    throw lastError;
  }
}
