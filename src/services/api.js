import configService from './configService.js';
import { errorHandler } from './errorHandler.js';
import { authStore } from '../state/authStore.js';

function getAuthHeaders() {
  const token = authStore.getToken();
  return token ? { 'Authorization': `Bearer ${token}` } : {};
}

function handleUnauthorized() {
  if (authStore.isLoggedIn) {
    authStore.logout();
    if (typeof Swal !== 'undefined') {
      Swal.fire({
        icon: 'info',
        title: 'Sesión expirada',
        text: 'Tu sesión ha expirado. Inicia sesión nuevamente.',
        background: '#1a1a1a',
        color: '#fff',
        backdrop: 'rgba(0,0,0,0.85)'
      });
    }
  }
}

async function parseResponseSafely(response) {
  const contentType = response.headers.get('content-type') || '';

  if (contentType.includes('application/json')) {
    return response.json();
  }

  const text = await response.text();
  return {
    error: text || `HTTP ${response.status}`,
    raw: text,
  };
}

export async function fetchConStatusOk(url, opciones = {}) {
  try {
    const respuesta = await fetch(url, opciones);

    const data = await respuesta.json();

    if (!respuesta.ok) {
      if (respuesta.status === 401) {
        handleUnauthorized();
      }
      const error = new Error(data.error || `Error ${respuesta.status}`);
      errorHandler.handleApiError(error, url, opciones);
      throw error;
    }

    return data;

  } catch (error) {
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
    this.defaultTimeout = 10000;
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

  async patch(endpoint, body, options = {}) {
    return this.request('PATCH', endpoint, body, options);
  }

  async delete(endpoint, bodyOrOptions = null, maybeOptions = {}) {
    const hasBody = bodyOrOptions && Object.prototype.hasOwnProperty.call(bodyOrOptions, 'body');

    if (hasBody && Object.keys(bodyOrOptions).length <= 2) {
      return this.request('DELETE', endpoint, bodyOrOptions.body, maybeOptions);
    }

    if (bodyOrOptions && !hasBody && (maybeOptions === undefined || Object.keys(maybeOptions).length === 0)) {
      return this.request('DELETE', endpoint, null, bodyOrOptions);
    }

    return this.request('DELETE', endpoint, bodyOrOptions, maybeOptions);
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
          ...getAuthHeaders(),
          ...options.headers
        }
      };

      if (body && (method === 'POST' || method === 'PUT' || method === 'PATCH' || method === 'DELETE')) {
        fetchOptions.body = JSON.stringify(body);
      }

      const response = await fetch(url, fetchOptions);
      clearTimeout(timeoutId);

      const data = await parseResponseSafely(response);

      if (!response.ok) {
        if (response.status === 401) {
          handleUnauthorized();
        }
        const error = new Error(data.error || `HTTP ${response.status}`);
        errorHandler.handleApiError(error, url, { method, body, options });
        throw error;
      }

      return data;

    } catch (error) {
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

  async withRetry(operation, options = {}) {
    const { maxRetries = this.maxRetries } = options;
    let delay = options.delay ?? 1000;
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
        delay *= 2;
      }
    }

    throw lastError;
  }
}

export const apiClient = new ApiClient();
