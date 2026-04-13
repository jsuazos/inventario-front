/**
 * Servicio centralizado de almacenamiento
 * Maneja toda la persistencia de datos de la aplicación
 * Usa localStorage como primera opción, IndexedDB como fallback
 */

import { errorHandler } from './errorHandler.js';
import { saveLibraryData as saveToIndexedDB, getLibraryData as getFromIndexedDB } from './dbService.js';

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
  async saveLibraryData(data) {
    try {
      const serialized = JSON.stringify(data);
      
      // Verificar si hay espacio suficiente en localStorage
      if (this.hasEnoughSpace(serialized)) {
        localStorage.setItem(STORAGE_KEYS.libraryData, serialized);
        return true;
      } else {
        // Usar IndexedDB como fallback
        await saveToIndexedDB(data);
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
  async getLibraryData() {
    try {
      // Intentar obtener de localStorage primero
      const localData = localStorage.getItem(STORAGE_KEYS.libraryData);
      if (localData) {
        return JSON.parse(localData);
      }

      // Si no hay datos en localStorage, intentar con IndexedDB
      const indexedData = await getFromIndexedDB();
      return indexedData && indexedData.length > 0 ? indexedData : [];
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
  async clearLibraryData() {
    try {
      localStorage.removeItem(STORAGE_KEYS.libraryData);
      
      // También limpiar de IndexedDB si existe
      if ('indexedDB' in window) {
        const dbName = 'MusicLibraryDB';
        const request = indexedDB.deleteDatabase(dbName);
        request.onsuccess = () => console.log('IndexedDB limpiado');
        request.onerror = (event) => {
          console.error('Error al limpiar IndexedDB:', event.target.error);
        };
      }
      
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
