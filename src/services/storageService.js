/**
 * Servicio centralizado de almacenamiento
 * Maneja toda la persistencia de datos de la aplicación
 * Usa localStorage como primera opción, IndexedDB como fallback
 */

import { errorHandler } from './errorHandler.js';
import { saveLibraryData as saveToIndexedDB, getLibraryData as getFromIndexedDB, clearLibraryData as clearFromIndexedDB, closeDB } from './dbService.js';

const STORAGE_KEYS = {
  userPreferences: 'userPreferences',
  cacheVersion: 'cacheVersion'
};
const LIBRARY_CACHE_PREFIX = 'libraryData:v2';
const LIBRARY_SYNC_PREFIX = 'libraryLastSyncedAt:v2';
const LEGACY_LIBRARY_CACHE_KEY = 'libraryData';

function getUserCacheKey(user) {
  return encodeURIComponent(user || 'anonymous');
}

function getLibraryDataKey(user) {
  return `${LIBRARY_CACHE_PREFIX}:${getUserCacheKey(user)}`;
}

function getLibrarySyncKey(user) {
  return `${LIBRARY_SYNC_PREFIX}:${getUserCacheKey(user)}`;
}

export class StorageService {

  /**
   * Guarda datos de biblioteca
   * @param {Array} data - Datos de la biblioteca
   */
  async saveLibraryData(data, user = null, syncedAt = new Date().toISOString()) {
    try {
      const serialized = JSON.stringify(data);
      const userKey = getUserCacheKey(user);
      
      // Verificar si hay espacio suficiente en localStorage
      if (this.hasEnoughSpace(serialized)) {
        localStorage.setItem(getLibraryDataKey(user), serialized);
        localStorage.setItem(getLibrarySyncKey(user), syncedAt);
        return true;
      } else {
        // Usar IndexedDB como fallback
        await saveToIndexedDB(data, userKey);
        localStorage.removeItem(getLibraryDataKey(user));
        localStorage.setItem(getLibrarySyncKey(user), syncedAt);
        return true;
      }
    } catch (error) {
      errorHandler.handle(error, {
        operation: 'saveLibraryData',
        dataSize: data ? data.length : 0,
        storageQuota: await this.getStorageQuota()
      });
      return false;
    }
  }

  /**
   * Obtiene datos de biblioteca
   * @returns {Array} Datos guardados o array vacío
   */
  async getLibraryData(user = null) {
    try {
      const userKey = getUserCacheKey(user);
      localStorage.removeItem(LEGACY_LIBRARY_CACHE_KEY);

      // Intentar obtener de localStorage primero
      const localData = localStorage.getItem(getLibraryDataKey(user));
      if (localData) {
        return JSON.parse(localData);
      }

      // Si no hay datos en localStorage, intentar con IndexedDB
      const indexedData = await getFromIndexedDB(userKey);
      return indexedData && indexedData.length > 0 ? indexedData : [];
    } catch (error) {
      errorHandler.handle(error, {
        operation: 'getLibraryData',
        storedData: localStorage.getItem(getLibraryDataKey(user))?.substring(0, 100)
      });
      return [];
    }
  }

  /**
   * Limpia datos de biblioteca
   */
  async clearLibraryData(user = null) {
    try {
      const userKey = getUserCacheKey(user);
      localStorage.removeItem(getLibraryDataKey(user));
      localStorage.removeItem(getLibrarySyncKey(user));
      
      // También limpiar de IndexedDB si existe
      if ('indexedDB' in window) {
        await clearFromIndexedDB(userKey);
        closeDB();
      }
      
      return true;
    } catch (error) {
      errorHandler.handle(error, { operation: 'clearLibraryData' });
      return false;
    }
  }

  getLibraryLastSyncedAt(user = null) {
    return localStorage.getItem(getLibrarySyncKey(user));
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
      Object.keys(localStorage)
        .filter(key => key.startsWith(LIBRARY_CACHE_PREFIX) || key.startsWith(LIBRARY_SYNC_PREFIX))
        .forEach(key => localStorage.removeItem(key));
      
      // Limpiar IndexedDB
      if ('indexedDB' in window) {
        indexedDB.deleteDatabase('MusicLibraryDB');
      }
      
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
  async getStorageQuota() {
    try {
      if ('storage' in navigator && 'estimate' in navigator.storage) {
        return await navigator.storage.estimate();
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
