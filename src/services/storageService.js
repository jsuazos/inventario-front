/**
 * Servicio centralizado de localStorage
 * Maneja toda la persistencia de datos de la aplicación
 */

import { errorHandler } from './errorHandler.js';

const STORAGE_KEYS = {
  libraryData: 'libraryData',
  userPreferences: 'userPreferences',
  cacheVersion: 'cacheVersion'
};

export class StorageService {

  /**
   * Guarda datos de biblioteca
   * @param {Array} data - Datos de la biblioteca
   */
  saveLibraryData(data) {
    try {
      const serialized = JSON.stringify(data);
      localStorage.setItem(STORAGE_KEYS.libraryData, serialized);
      return true;
    } catch (error) {
      errorHandler.handle(error, {
        operation: 'saveLibraryData',
        dataSize: data ? data.length : 0,
        storageQuota: this.getStorageQuota()
      });
      return false;
    }
  }

  /**
   * Obtiene datos de biblioteca
   * @returns {Array} Datos guardados o array vacío
   */
  getLibraryData() {
    try {
      const data = localStorage.getItem(STORAGE_KEYS.libraryData);
      return data ? JSON.parse(data) : [];
    } catch (error) {
      errorHandler.handle(error, {
        operation: 'getLibraryData',
        storedData: localStorage.getItem(STORAGE_KEYS.libraryData)?.substring(0, 100)
      });
      return [];
    }
  }

  /**
   * Limpia datos de biblioteca
   */
  clearLibraryData() {
    try {
      localStorage.removeItem(STORAGE_KEYS.libraryData);
      return true;
    } catch (error) {
      errorHandler.handle(error, { operation: 'clearLibraryData' });
      return false;
    }
  }

  /**
   * Guarda preferencias de usuario
   * @param {Object} preferences - Preferencias del usuario
   */
  saveUserPreferences(preferences) {
    try {
      localStorage.setItem(STORAGE_KEYS.userPreferences, JSON.stringify(preferences));
      return true;
    } catch (error) {
      errorHandler.handle(error, {
        operation: 'saveUserPreferences',
        preferencesKeys: Object.keys(preferences || {})
      });
      return false;
    }
  }

  /**
   * Obtiene preferencias de usuario
   * @returns {Object} Preferencias guardadas o objeto vacío
   */
  getUserPreferences() {
    try {
      const data = localStorage.getItem(STORAGE_KEYS.userPreferences);
      return data ? JSON.parse(data) : {};
    } catch (error) {
      errorHandler.handle(error, { operation: 'getUserPreferences' });
      return {};
    }
  }

  /**
   * Limpia todo el almacenamiento de la app
   */
  clearAll() {
    try {
      Object.values(STORAGE_KEYS).forEach(key => {
        localStorage.removeItem(key);
      });
      return true;
    } catch (error) {
      errorHandler.handle(error, { operation: 'clearAll' });
      return false;
    }
  }

  /**
   * Obtiene tamaño aproximado del almacenamiento en KB
   */
  getStorageSize() {
    try {
      let total = 0;
      for (let key in localStorage) {
        if (localStorage.hasOwnProperty(key)) {
          total += localStorage[key].length + key.length;
        }
      }
      return (total / 1024).toFixed(2);
    } catch (error) {
      errorHandler.handle(error, { operation: 'getStorageSize' });
      return '0.00';
    }
  }

  /**
   * Obtiene información de cuota de almacenamiento
   * @returns {Object} Información de cuota
   */
  getStorageQuota() {
    try {
      if ('storage' in navigator && 'estimate' in navigator.storage) {
        return navigator.storage.estimate().then(estimate => ({
          quota: estimate.quota,
          usage: estimate.usage,
          available: estimate.quota - estimate.usage
        }));
      }
      return { quota: null, usage: null, available: null };
    } catch (error) {
      errorHandler.handle(error, { operation: 'getStorageQuota' });
      return { quota: null, usage: null, available: null };
    }
  }

  /**
   * Verifica si hay suficiente espacio para guardar datos
   * @param {string} data - Datos a guardar
   * @returns {boolean} True si hay espacio suficiente
   */
  hasEnoughSpace(data) {
    try {
      const dataSize = new Blob([data]).size;
      const currentSize = parseFloat(this.getStorageSize()) * 1024;
      const estimatedTotal = currentSize + dataSize;

      // Asumir límite de 5MB por defecto si no podemos obtener cuota real
      const defaultLimit = 5 * 1024 * 1024; // 5MB

      return estimatedTotal < defaultLimit;
    } catch (error) {
      errorHandler.handle(error, { operation: 'hasEnoughSpace' });
      return true; // Asumir que hay espacio si no podemos verificar
    }
  }
}

export const storageService = new StorageService();
