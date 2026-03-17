/**
 * Servicio centralizado de localStorage
 * Maneja toda la persistencia de datos de la aplicación
 */

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
      localStorage.setItem(STORAGE_KEYS.libraryData, JSON.stringify(data));
      return true;
    } catch (error) {
      console.error('Error guardando biblioteca:', error);
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
      console.error('Error obteniendo biblioteca:', error);
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
      console.error('Error limpiando biblioteca:', error);
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
      console.error('Error guardando preferencias:', error);
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
      console.error('Error obteniendo preferencias:', error);
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
      console.error('Error limpiando almacenamiento:', error);
      return false;
    }
  }

  /**
   * Obtiene tamaño aproximado del almacenamiento en KB
   */
  getStorageSize() {
    let total = 0;
    for (let key in localStorage) {
      if (localStorage.hasOwnProperty(key)) {
        total += localStorage[key].length + key.length;
      }
    }
    return (total / 1024).toFixed(2);
  }
}

export const storageService = new StorageService();
