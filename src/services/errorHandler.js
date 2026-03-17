/**
 * Servicio de manejo de errores centralizado
 * Proporciona logging, notificaciones y recuperación de errores
 */

export class ErrorHandler {
  constructor() {
    this.errorQueue = [];
    this.maxQueueSize = 10;
  }

  /**
   * Maneja errores de forma centralizada
   * @param {Error|string} error - Error a manejar
   * @param {Object} context - Contexto adicional del error
   */
  handle(error, context = {}) {
    const errorInfo = this.formatError(error, context);

    // Log en consola
    console.error('Error manejado:', errorInfo);

    // Agregar a cola para posibles reportes
    this.addToQueue(errorInfo);

    // Mostrar notificación al usuario si es crítico
    if (this.isCriticalError(error)) {
      this.showUserNotification(errorInfo);
    }

    // Enviar a servicio de monitoreo (futuro)
    this.reportToMonitoring(errorInfo);
  }

  /**
   * Maneja errores de red específicamente
   * @param {Error} error - Error de red
   * @param {string} operation - Operación que falló
   */
  handleNetworkError(error, operation) {
    const context = {
      type: 'network',
      operation,
      isOnline: navigator.onLine,
      timestamp: new Date().toISOString()
    };

    this.handle(error, context);

    // Intentar recuperación automática si es posible
    if (navigator.onLine && this.isRetryableError(error)) {
      console.warn(`Reintentando operación: ${operation}`);
      // Aquí podríamos implementar reintento automático
    }
  }

  /**
   * Maneja errores de API específicamente
   * @param {Error} error - Error de API
   * @param {string} endpoint - Endpoint que falló
   * @param {Object} requestData - Datos de la petición
   */
  handleApiError(error, endpoint, requestData = {}) {
    const context = {
      type: 'api',
      endpoint,
      requestData,
      timestamp: new Date().toISOString()
    };

    this.handle(error, context);
  }

  /**
   * Maneja errores de validación de datos
   * @param {Error} error - Error de validación
   * @param {Object} data - Datos que fallaron validación
   */
  handleValidationError(error, data) {
    const context = {
      type: 'validation',
      data,
      timestamp: new Date().toISOString()
    };

    this.handle(error, context);
  }

  /**
   * Formatea el error para logging consistente
   * @param {Error|string} error - Error original
   * @param {Object} context - Contexto adicional
   * @returns {Object} Error formateado
   */
  formatError(error, context) {
    const errorObj = error instanceof Error ? error : new Error(error);

    return {
      message: errorObj.message,
      stack: errorObj.stack,
      name: errorObj.name,
      timestamp: new Date().toISOString(),
      userAgent: navigator.userAgent,
      url: window.location.href,
      ...context
    };
  }

  /**
   * Determina si un error es crítico (requiere notificación al usuario)
   * @param {Error} error - Error a evaluar
   * @returns {boolean} True si es crítico
   */
  isCriticalError(error) {
    // Errores críticos que afectan la funcionalidad principal
    const criticalPatterns = [
      /network/i,
      /fetch/i,
      /api/i,
      /storage/i,
      /quota/i
    ];

    return criticalPatterns.some(pattern =>
      pattern.test(error.message) || pattern.test(error.name)
    );
  }

  /**
   * Determina si un error se puede reintentar
   * @param {Error} error - Error a evaluar
   * @returns {boolean} True si se puede reintentar
   */
  isRetryableError(error) {
    const retryablePatterns = [
      /network/i,
      /timeout/i,
      /5\d{2}/, // Errores 5xx
      /fetch/i
    ];

    return retryablePatterns.some(pattern =>
      pattern.test(error.message) || pattern.test(error.name)
    );
  }

  /**
   * Muestra notificación al usuario
   * @param {Object} errorInfo - Información del error
   */
  showUserNotification(errorInfo) {
    // Usar SweetAlert2 si está disponible
    if (typeof Swal !== 'undefined') {
      Swal.fire({
        icon: 'error',
        title: 'Error',
        text: this.getUserFriendlyMessage(errorInfo),
        background: '#1a1a1a',
        color: '#fff',
        backdrop: 'rgba(0,0,0,0.85)',
        confirmButtonText: 'Entendido'
      });
    } else {
      // Fallback a alert nativo
      alert(`Error: ${this.getUserFriendlyMessage(errorInfo)}`);
    }
  }

  /**
   * Convierte error técnico a mensaje amigable para usuario
   * @param {Object} errorInfo - Información del error
   * @returns {string} Mensaje amigable
   */
  getUserFriendlyMessage(errorInfo) {
    const messages = {
      network: 'Error de conexión. Verifica tu internet.',
      api: 'Error al conectar con el servidor. Intenta más tarde.',
      validation: 'Los datos proporcionados no son válidos.',
      storage: 'Error al guardar datos localmente.',
      default: 'Ha ocurrido un error inesperado.'
    };

    return messages[errorInfo.type] || messages.default;
  }

  /**
   * Agrega error a la cola para posibles reportes
   * @param {Object} errorInfo - Información del error
   */
  addToQueue(errorInfo) {
    this.errorQueue.push(errorInfo);

    // Mantener tamaño máximo de cola
    if (this.errorQueue.length > this.maxQueueSize) {
      this.errorQueue.shift();
    }
  }

  /**
   * Obtiene la cola de errores para debugging
   * @returns {Array} Cola de errores
   */
  getErrorQueue() {
    return [...this.errorQueue];
  }

  /**
   * Limpia la cola de errores
   */
  clearErrorQueue() {
    this.errorQueue = [];
  }

  /**
   * Envía error a servicio de monitoreo (placeholder para futuro)
   * @param {Object} errorInfo - Información del error
   */
  reportToMonitoring(errorInfo) {
    // Aquí se podría integrar con servicios como Sentry, LogRocket, etc.
    // Por ahora solo log
    console.debug('Error reportado a monitoreo:', errorInfo);
  }

  /**
   * Crea un wrapper para funciones que maneje errores automáticamente
   * @param {Function} fn - Función a envolver
   * @param {Object} context - Contexto adicional
   * @returns {Function} Función envuelta
   */
  wrap(fn, context = {}) {
    return async (...args) => {
      try {
        return await fn(...args);
      } catch (error) {
        this.handle(error, context);
        throw error; // Re-lanzar para que el caller pueda manejarlo
      }
    };
  }
}

// Instancia singleton
export const errorHandler = new ErrorHandler();
