/**
 * dbService.js - Manejo de IndexedDB para soporte offline
 */

// Polyfill para IndexedDB
import { openDB } from 'idb';

const DB_NAME = 'MusicLibraryDB';
const DB_VERSION = 1;
const STORE_NAME = 'library';

let db;

/**
 * Inicializar la base de datos
 */
export async function initDB() {
  try {
    db = await openDB(DB_NAME, DB_VERSION, {
      upgrade(db) {
        if (!db.objectStoreNames.contains(STORE_NAME)) {
          db.createObjectStore(STORE_NAME, { keyPath: 'id' });
        }
      }
    });
    console.log('✅ IndexedDB inicializada');
    return db;
  } catch (error) {
    console.error('Error al abrir IndexedDB:', error);
    throw error;
  }
}

/**
 * Guardar datos en IndexedDB
 */
export async function saveLibraryData(data) {
  if (!db) await initDB();

  try {
    const tx = db.transaction(STORE_NAME, 'readwrite');
    const store = tx.objectStore(STORE_NAME);
    
    // Limpiar datos existentes
    await store.clear();
    
    // Guardar nuevos datos
    data.forEach(item => {
      const itemWithId = { ...item, id: item.Orden || Math.random().toString(36).substr(2, 9) };
      store.add(itemWithId);
    });
    
    await tx.done;
    console.log('✅ Datos guardados en IndexedDB:', data.length, 'items');
    return true;
  } catch (error) {
    console.error('Error al guardar en IndexedDB:', error);
    throw error;
  }
}

/**
 * Obtener datos de IndexedDB
 */
export async function getLibraryData() {
  if (!db) await initDB();

  try {
    const tx = db.transaction(STORE_NAME, 'readonly');
    const store = tx.objectStore(STORE_NAME);
    const data = await store.getAll();
    console.log('📥 Datos obtenidos de IndexedDB:', data.length, 'items');
    return data;
  } catch (error) {
    console.error('Error al obtener datos de IndexedDB:', error);
    return [];
  }
}

/**
 * Verificar si hay datos en IndexedDB
 */
export async function hasCachedData() {
  if (!db) await initDB();

  try {
    const tx = db.transaction(STORE_NAME, 'readonly');
    const store = tx.objectStore(STORE_NAME);
    const count = await store.count();
    return count > 0;
  } catch (error) {
    console.error('Error al verificar datos en IndexedDB:', error);
    return false;
  }
}

/**
 * Registrar sincronización en segundo plano
 */
export function registerBackgroundSync(tag, data) {
  if ('serviceWorker' in navigator && 'SyncManager' in window) {
    navigator.serviceWorker.ready.then(sw => {
      return sw.sync.register(tag);
    }).then(() => {
      // Guardar datos temporalmente para la sincronización
      localStorage.setItem(`sync-${tag}`, JSON.stringify(data));
      console.log(`🔄 Sincronización registrada: ${tag}`);
    }).catch(error => {
      console.error('Error al registrar sincronización:', error);
    });
  } else {
    console.warn('Background Sync no soportado');
  }
}

/**
 * Obtener datos pendientes de sincronización
 */
export function getPendingSyncData(tag) {
  const data = localStorage.getItem(`sync-${tag}`);
  return data ? JSON.parse(data) : null;
}

/**
 * Limpiar datos de sincronización
 */
export function clearSyncData(tag) {
  localStorage.removeItem(`sync-${tag}`);
}

/**
 * Manejar estado de conexión
 */
export function setupOnlineOfflineHandlers() {
  // Añadir clase al body según estado de conexión
  if (!navigator.onLine) {
    document.body.classList.add('offline');
  } else {
    document.body.classList.add('online');
  }

  window.addEventListener('online', () => {
    document.body.classList.remove('offline');
    document.body.classList.add('online');
    console.log('🌐 Conexión restaurada');
    
    // Intentar sincronizar automáticamente
    if ('serviceWorker' in navigator && 'SyncManager' in window) {
      navigator.serviceWorker.ready.then(sw => {
        return sw.sync.getTags();
      }).then(tags => {
        if (tags.length > 0) {
          console.log('🔄 Sincronizando datos en segundo plano...');
        }
      });
    }
  });

  window.addEventListener('offline', () => {
    document.body.classList.remove('online');
    document.body.classList.add('offline');
    console.log('⚠️ Conexión perdida - modo offline activado');
  });
}

// Inicializar automáticamente
if ('indexedDB' in window) {
  initDB().catch(error => {
    console.warn('IndexedDB no disponible:', error);
  });
  setupOnlineOfflineHandlers();
} else {
  console.warn('IndexedDB no soportado en este navegador');
}
