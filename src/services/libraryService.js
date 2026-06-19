import { toggleLoader } from '../utils/ui.js';
import aplicarColoresPorGenero from '../utils/aplicarColoresPorGenero.js';
import obtenerTopEstilos from '../utils/obtenerTopEstilos.js';
import { loadAlphabet } from '../utils/ui.js';
import obtenerGeneros from '../utils/obtenerGeneros.js';
import { splitTypeTags } from '../utils/typeTags.js';
import { apiClient } from './api.js';
import {
  showBackgroundUpdateNotification,
  showDetailedChangesNotification,
} from './backgroundNotificationService.js';
import { libraryStore } from '../state/libraryStore.js';
import { errorHandler } from './errorHandler.js';

export function populateFilters(libraryData) {
    const types = new Set(), genres = new Set(), artists = new Set(), years = new Set();
    libraryData.forEach(item => {
      splitTypeTags(item.Tipo).forEach(type => types.add(type));
      artists.add(item.Artista);
      years.add(item.Año);
    });
    obtenerGeneros(libraryData).forEach(genero => genres.add(genero));
    // fillSelect('filterType', types);
    // fillSelect('filterGenre', genres);
    // fillSelect('filterArtist', artists);
    // fillSelect('filterYear', years);
}

/**
 * Verifica si hay cambios en la API en segundo plano
 * Muestra notificaciones al usuario sobre el proceso
 */
export async function checkForUpdatesInBackground() {
  // Solo ejecutar si estamos online y tenemos datos locales
  if (!navigator.onLine || libraryStore.getAllData().length === 0) {
    return;
  }

  try {
    // showBackgroundUpdateNotification('🔄 Buscando actualizaciones ...', 'info');
    const filteredApiData = await fetchLibraryFromApi();

    // Comparar con datos locales usando comparación detallada
    const localData = libraryStore.getAllData();
    const { added, removed } = getDetailedChanges(localData, filteredApiData);

    const hasChanges = added.length > 0 || removed.length > 0;

    if (hasChanges) {
      triggerPushNotification(added, removed);
    }

    if (hasChanges && filteredApiData.length > 0) {

      libraryStore.loadData(filteredApiData);
      populateFilters(filteredApiData);
      aplicarColoresPorGenero();
      showDetailedChangesNotification(added, removed);
    } else {
      // showBackgroundUpdateNotification('📋 No hay cambios disponibles', 'info');
    }

  } catch (e) {
    console.warn('checkForUpdatesInBackground falló (esto es normal si el servidor está iniciando):', e.message);
  }
}

/**
 * Calcula los cambios detallados entre dos arrays de discos
 * @param {Array} oldArray - Array anterior
 * @param {Array} newArray - Array nuevo
 * @returns {Object} - Objeto con arrays de elementos agregados y eliminados
 */
function getDetailedChanges(oldArray, newArray) {
  // Crear mapas para búsqueda rápida usando una clave única
  const createKey = (item) => `${item.ID || ''}|${item.Artista || ''}|${item.Disco || ''}|${item.Año || ''}|${item.Recibido || ''}`.toLowerCase();

  const oldMap = new Map();
  const newMap = new Map();

  oldArray.forEach(item => oldMap.set(createKey(item), item));
  newArray.forEach(item => newMap.set(createKey(item), item));

  console.info(`Comparando datos: ${oldArray.length} registros locales vs ${newArray.length} registros API` );

  const added = [];
  const removed = [];

  // Encontrar elementos agregados (en newArray pero no en oldArray)
  newArray.forEach(item => {
    if (!oldMap.has(createKey(item))) {
      added.push(item);
    }
  });

  // Encontrar elementos eliminados (en oldArray pero no en newArray)
  oldArray.forEach(item => {
    if (!newMap.has(createKey(item))) {
      removed.push(item);
    }
  });

  return { added, removed };
}

/**
 * Envía notificación push a todos los dispositivos via el backend
 */
async function triggerPushNotification(added, removed) {
  let body = '';
  if (added.length > 0) {
    body += `${added.length} agregado${added.length !== 1 ? 's' : ''}`;
  }
  if (removed.length > 0) {
    if (body) body += ' · ';
    body += `${removed.length} eliminado${removed.length !== 1 ? 's' : ''}`;
  }

  try {
    await apiClient.post('/push/notify', {
      title: '📀 Biblioteca actualizada',
      body,
      data: { url: './' },
    });
  } catch (err) {
    console.error('Error sending push notification:', err);
  }
}

async function fetchLibraryFromApi() {
  const data = await apiClient.get('/inventario-public', { timeout: 15000 });
  return Array.isArray(data.data) ? data.data : [];
}

function completeLoad(data) {
  populateFilters(data || []);
  aplicarColoresPorGenero();
  requestAnimationFrame(() => {
    obtenerTopEstilos();
    loadAlphabet();
  });
}

function finishLoad(data) {
  completeLoad(data || []);
  libraryStore.setLoading(false);
  toggleLoader(false);
}

function showLoader() {
  const el = document.getElementById('loader');
  if (el) {
    el.style.display = 'block';
  }
}

function hideLoader() {
  const el = document.getElementById('loader');
  if (el) {
    el.style.display = 'none';
  }
}

export async function loadLibrary(libraryData) {
  showLoader();
  libraryStore.setLoading(true);

  const cachedData = Array.isArray(libraryData) ? libraryData : [];
  const isCacheEmpty = cachedData.length === 0;

  if (isCacheEmpty && navigator.onLine) {
    fetchLibraryFromApi()
      .then(apiData => {
        libraryStore.loadData(apiData);
        populateFilters(apiData);
        aplicarColoresPorGenero();
      })
      .catch(e => {
        errorHandler.handleNetworkError(e, 'loadLibrary');
      })
      .finally(() => {
        libraryStore.setLoading(false);
        hideLoader();
      });

    return [];
  }

  finishLoad(cachedData);

  return cachedData;
}


