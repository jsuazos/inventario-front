import { toggleLoader } from '../utils/ui.js';
import displayLibrary from '../utils/libraryDisplay.js';
import aplicarColoresPorGenero from '../utils/aplicarColoresPorGenero.js';
import obtenerTopEstilos from '../utils/obtenerTopEstilos.js';
import { loadAlphabet } from '../utils/ui.js';
import configService from './configService.js';
import obtenerGeneros from '../utils/obtenerGeneros.js';
import fillSelect from '../utils/filters.js';
import { libraryStore } from '../state/libraryStore.js';
import { errorHandler } from './errorHandler.js';

export function populateFilters(libraryData) {
    const types = new Set(), genres = new Set(), artists = new Set(), years = new Set();
    libraryData.forEach(item => {
      types.add(item.Tipo);
      artists.add(item.Artista);
      years.add(item.Año);
    });
    obtenerGeneros(libraryData).forEach(genero => genres.add(genero));
    fillSelect('filterType', types);
    fillSelect('filterGenre', genres);
    fillSelect('filterArtist', artists);
    fillSelect('filterYear', years);
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
    // Mostrar mensaje de búsqueda en segundo plano
    showBackgroundUpdateNotification('🔄 Buscando actualizaciones ...', 'info');

    const { apiUrl } = await configService();
    const url = `${apiUrl.replace(/\/$/, "")}/inventario`;

    const res = await fetch(url);
    const data = await res.json();
    const apiData = data.data || [];

    // Comparar con datos locales (por cantidad y último elemento como checksum simple)
    const localData = libraryStore.getAllData();
    const hasChanges = apiData.length !== localData.length ||
                      JSON.stringify(apiData[apiData.length - 1]) !== JSON.stringify(localData[localData.length - 1]);

    if (hasChanges && apiData.length > 0) {
      // Ordenar datos de API igual que los locales
      apiData.sort((a, b) => {
        const claveA = a.Artista.toLowerCase() + ' ' + a.Año;
        const claveB = b.Artista.toLowerCase() + ' ' + b.Año;
        return claveA.localeCompare(claveB);
      });

      // Actualizar store con nuevos datos
      libraryStore.loadData(apiData);

      // Actualizar filtros y display
      populateFilters(apiData);
      displayLibrary(apiData);
      aplicarColoresPorGenero();

      // Mostrar mensaje de actualización completada
      showBackgroundUpdateNotification('✅ Biblioteca actualizada', 'success');
    } else {
      // Mostrar mensaje de que no hay cambios
      showBackgroundUpdateNotification('📋 No hay cambios disponibles', 'info');
    }

  } catch (e) {
    errorHandler.handleNetworkError(e, 'checkForUpdatesInBackground');
    showBackgroundUpdateNotification('❌ Error al verificar actualizaciones', 'error');
  }
}

/**
 * Muestra notificaciones de actualización en segundo plano
 */
function showBackgroundUpdateNotification(message, type = 'info') {
  // Crear contenedor de notificaciones si no existe
  let notificationContainer = document.getElementById('background-update-notifications');
  if (!notificationContainer) {
    notificationContainer = document.createElement('div');
    notificationContainer.id = 'background-update-notifications';
    notificationContainer.style.cssText = `
      position: fixed;
      bottom: 20px;
      right: 20px;
      z-index: 9999;
      max-width: 300px;
    `;
    document.body.appendChild(notificationContainer);
  }

  // Crear notificación
  const notification = document.createElement('div');
  notification.style.cssText = `
    background: ${type === 'success' ? '#d4edda' : type === 'error' ? '#f8d7da' : '#d1ecf1'};
    color: ${type === 'success' ? '#155724' : type === 'error' ? '#721c24' : '#0c5460'};
    border: 1px solid ${type === 'success' ? '#c3e6cb' : type === 'error' ? '#f5c6cb' : '#bee5eb'};
    border-radius: 4px;
    padding: 12px 16px;
    margin-bottom: 10px;
    box-shadow: 0 2px 4px rgba(0,0,0,0.1);
    font-size: 14px;
    animation: slideIn 0.3s ease-out;
  `;

  notification.innerHTML = `
    <div style="display: flex; align-items: center; gap: 8px;">
      <span>${message}</span>
      <button onclick="this.parentElement.parentElement.remove()" style="
        background: none;
        border: none;
        color: inherit;
        cursor: pointer;
        font-size: 18px;
        line-height: 1;
        padding: 0;
        margin-left: auto;
      ">×</button>
    </div>
  `;

  // Agregar animación CSS
  if (!document.getElementById('background-update-styles')) {
    const style = document.createElement('style');
    style.id = 'background-update-styles';
    style.textContent = `
      @keyframes slideIn {
        from { transform: translateY(100%); opacity: 0; }
        to { transform: translateY(0); opacity: 1; }
      }
      @keyframes slideOut {
        from { transform: translateY(0); opacity: 1; }
        to { transform: translateY(100%); opacity: 0; }
      }
    `;
    document.head.appendChild(style);
  }

  notificationContainer.appendChild(notification);

  // Auto-remover después de 5 segundos para mensajes de éxito/info, 8 para errores
  const timeout = type === 'error' ? 8000 : 5000;
  setTimeout(() => {
    if (notification.parentElement) {
      notification.style.animation = 'slideOut 0.3s ease-in';
      setTimeout(() => notification.remove(), 300);
    }
  }, timeout);
}

export async function loadLibrary(libraryData) {
  toggleLoader(true);
  libraryStore.setLoading(true);

  if ((libraryData === null || libraryData.length === 0) && navigator.onLine) {
    try {
      const { apiUrl } = await configService();
      const url = `${apiUrl.replace(/\/$/, "")}/inventario`;

      const res = await fetch(url);
      const data = await res.json();
      
      libraryData = data.data || [];
      libraryData.sort((a, b) => {
        const claveA = a.Artista.toLowerCase() + ' ' + a.Año;
        const claveB = b.Artista.toLowerCase() + ' ' + b.Año;
        return claveA.localeCompare(claveB);
      });

      libraryStore.loadData(libraryData);
    } catch (e) {
      errorHandler.handleNetworkError(e, 'loadLibrary');
      libraryData = libraryData || [];
    }
  } else {
    // Usar datos del localStorage
    libraryStore.init();
  }

  populateFilters(libraryData || []);
  displayLibrary(libraryData || []);
  aplicarColoresPorGenero();
  
  requestAnimationFrame(() => {
    obtenerTopEstilos();
    loadAlphabet();
  });

  libraryStore.setLoading(false);
  toggleLoader(false);

  return libraryData;
}


