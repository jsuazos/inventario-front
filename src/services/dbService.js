/**
 * dbService.js - Manejo de IndexedDB para soporte offline
 */

const DB_NAME = 'MusicLibraryDB';
const DB_VERSION = 1;
const STORE_NAME = 'library';

let dbPromise = null;
let dbInstance = null;

function buildItemId(item, userKey) {
  const itemKey = item?.Orden || `${item?.Artista || ''}-${item?.Disco || ''}-${item?.Año || ''}` || crypto.randomUUID();
  return `${userKey}:${itemKey}`;
}

/**
 * Inicializar la base de datos
 */
export function initDB() {
  if (dbPromise) {
    return dbPromise;
  }

  dbPromise = new Promise((resolve, reject) => {
    const request = indexedDB.open(DB_NAME, DB_VERSION);

    request.onerror = () => {
      reject(request.error);
    };

    request.onsuccess = () => {
      dbInstance = request.result;
      resolve(dbInstance);
    };

    request.onupgradeneeded = () => {
      const db = request.result;
      if (!db.objectStoreNames.contains(STORE_NAME)) {
        db.createObjectStore(STORE_NAME, { keyPath: 'id' });
      }
    };
  }).catch(error => {
    dbPromise = null;
    throw error;
  });

  return dbPromise;
}

/**
 * Vacía todos los datos de IndexedDB (sin borrar la BD)
 */
export async function clearAllData() {
  const db = await initDB();

  return new Promise((resolve, reject) => {
    const transaction = db.transaction(STORE_NAME, 'readwrite');
    const store = transaction.objectStore(STORE_NAME);

    transaction.onerror = () => reject(transaction.error);
    transaction.oncomplete = () => resolve(true);

    store.clear();
  });
}

/**
 * Cerrar la conexión a IndexedDB
 */
export function closeDB() {
  if (dbInstance) {
    try {
      dbInstance.close();
    } catch {
      // ignorar
    }
    dbInstance = null;
    dbPromise = null;
  }
}

/**
 * Guardar datos en IndexedDB
 */
export async function saveLibraryData(data, userKey = 'anonymous') {
  const db = await initDB();

  return new Promise((resolve, reject) => {
    const transaction = db.transaction(STORE_NAME, 'readwrite');
    const store = transaction.objectStore(STORE_NAME);

    transaction.onerror = () => reject(transaction.error);
    transaction.oncomplete = () => resolve(true);

    const request = store.getAll();
    request.onerror = () => reject(request.error);
    request.onsuccess = () => {
      request.result
        .filter(item => item.userKey === userKey)
        .forEach(item => store.delete(item.id));

      (Array.isArray(data) ? data : []).forEach(item => {
        store.put({ ...item, id: buildItemId(item, userKey), userKey });
      });
    };
  });
}

/**
 * Obtener datos de IndexedDB
 */
export async function getLibraryData(userKey = 'anonymous') {
  try {
    const db = await initDB();

    return await new Promise((resolve, reject) => {
      const transaction = db.transaction(STORE_NAME, 'readonly');
      const store = transaction.objectStore(STORE_NAME);
      const request = store.getAll();

      request.onerror = () => reject(request.error);
      request.onsuccess = () => {
        const result = Array.isArray(request.result) ? request.result : [];
        resolve(result
          .filter(item => item.userKey === userKey)
          .map(({ id: _id, userKey: _userKey, ...item }) => item));
      };
    });
  } catch (error) {
    console.warn('IndexedDB no disponible, usando fallback vacio:', error);
    return [];
  }
}

export async function clearLibraryData(userKey = 'anonymous') {
  const db = await initDB();

  return new Promise((resolve, reject) => {
    const transaction = db.transaction(STORE_NAME, 'readwrite');
    const store = transaction.objectStore(STORE_NAME);
    const request = store.getAll();

    request.onerror = () => reject(request.error);
    request.onsuccess = () => {
      request.result
        .filter(item => item.userKey === userKey)
        .forEach(item => store.delete(item.id));
    };
    transaction.onerror = () => reject(transaction.error);
    transaction.oncomplete = () => resolve(true);
  });
}

/**
 * Verificar si hay datos en IndexedDB
 */
export async function hasCachedData() {
  try {
    const db = await initDB();

    return await new Promise((resolve, reject) => {
      const transaction = db.transaction(STORE_NAME, 'readonly');
      const store = transaction.objectStore(STORE_NAME);
      const request = store.count();

      request.onerror = () => reject(request.error);
      request.onsuccess = () => resolve(request.result > 0);
    });
  } catch (error) {
    console.warn('No se pudo verificar cache IndexedDB:', error);
    return false;
  }
}

/**
 * Registrar sincronizacion en segundo plano
 */
export function registerBackgroundSync(tag, data) {
  if ('serviceWorker' in navigator && 'SyncManager' in window) {
    navigator.serviceWorker.ready.then(registration => {
      return registration.sync.register(tag);
    }).then(() => {
      localStorage.setItem(`sync-${tag}`, JSON.stringify(data));
    }).catch(error => {
      console.warn('No se pudo registrar Background Sync:', error);
    });
  }
}

export function getPendingSyncData(tag) {
  const data = localStorage.getItem(`sync-${tag}`);
  return data ? JSON.parse(data) : null;
}

export function clearSyncData(tag) {
  localStorage.removeItem(`sync-${tag}`);
}

/**
 * Manejar estado de conexion
 */
export function setupOnlineOfflineHandlers() {
  const updateState = () => {
    document.body.classList.toggle('offline', !navigator.onLine);
    document.body.classList.toggle('online', navigator.onLine);
  };

  updateState();
  window.addEventListener('online', updateState);
  window.addEventListener('offline', updateState);
}

if ('indexedDB' in window) {
  initDB().catch(error => {
    console.warn('IndexedDB no disponible:', error);
  });
  setupOnlineOfflineHandlers();
}
