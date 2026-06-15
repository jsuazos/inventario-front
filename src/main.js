// main.js
import './components/Navbar.js';
import './components/Aside.js';
import './components/Filters.js';
import './components/Loader.js';
import './components/LoginModal.js';
import './components/Alphabet.js';
import './components/Footer.js';

import { loadLibrary, checkForUpdatesInBackground } from "./services/libraryService.js";
import { filterLibrary } from "./utils/libraryFilters.js";
import { toggleSidebar, loadAlphabet } from "./utils/ui.js";
// import { clearFilters } from "./utils/libraryFilters.js";
import { clearLibrary, modalLogin, updateLoginUI } from "./utils/modals.js";
import { authStore } from "./state/authStore.js";
import displayLibrary from "./utils/libraryDisplay.js";
import { libraryStore } from "./state/libraryStore.js";
import { errorHandler } from "./services/errorHandler.js";
import { setupOnlineOfflineHandlers } from './services/dbService.js';
import { loadArtistCatalog } from './services/artistCatalogService.js';
import { subscribe, isSubscribed, isSupported } from './services/pushService.js';

window.addEventListener("DOMContentLoaded", async () => {
  // Inicializar el store desde localStorage/IndexedDB
  await libraryStore.init();

  // Restaurar sesión si existe token válido
  authStore.init();
  updateLoginUI();

  // Sincronizar clase auth-editor en body con el estado de login
  const toggleAuthEditor = ({ isLoggedIn }) => {
    document.body.classList.toggle('auth-editor', isLoggedIn);
  };
  toggleAuthEditor({ isLoggedIn: authStore.isLoggedIn });
  authStore.subscribe(toggleAuthEditor);
  
  // Configurar manejo de conexión
  setupOnlineOfflineHandlers();
  
  let libraryData = JSON.parse(localStorage.getItem("libraryData")) || [];

  libraryData = await loadLibrary(libraryData);
  libraryStore.loadData(libraryData);

  // Cargar catálogo de artistas desde la API
  if (navigator.onLine) {
    loadArtistCatalog();
  }

  // El filtro en vivo del input se maneja desde Navbar.js vía libraryStore.setSearchInput()

  // Event listeners para el filtro de Recibido
  document.querySelectorAll('input[name="filterRecibido"]').forEach(radio => {
    radio.addEventListener("change", filterLibrary);
  });

  // Suscribirse a cambios del store para refrescar la vista al aplicar filtros u ordenamientos
  libraryStore.subscribe((state) => {
    displayLibrary(state.data);
  });

  // clearFilters(libraryData);
  toggleSidebar();
  clearLibrary();

  modalLogin();

  // Verificar actualizaciones en segundo plano después de 3 segundos
  // para no interferir con la carga inicial
  if (navigator.onLine && libraryData && libraryData.length > 0) {
    setTimeout(() => {
      checkForUpdatesInBackground();
    }, 3000);
  }

  if ("serviceWorker" in navigator) {
    try {
      navigator.serviceWorker.register("./service-worker.js").then((reg) => {
        reg.onupdatefound = () => {
          const newWorker = reg.installing;
          newWorker.onstatechange = () => {
            if (
              newWorker.state === "installed" &&
              navigator.serviceWorker.controller
            ) {
              console.log("Nueva versión disponible. Recargando...");
              window.location.reload(); // Forzar recarga si hay nueva versión
            }
          };
        };
      });
    } catch (error) {
      errorHandler.handleNetworkError(error, 'serviceWorkerRegistration');
    }
  }

  if (navigator.serviceWorker && navigator.serviceWorker.controller) {
    navigator.serviceWorker.controller.postMessage("GET_CACHE_VERSION");

    navigator.serviceWorker.addEventListener("message", (event) => {
      const version = event.data.cacheVersion;
      console.info(`Versión del caché: ${version}`);
      document.getElementById(
        "cache-version"
      ).textContent = `Versión: ${version}`;
    });
  }

  // Inicializar push notifications si está soportado
  // Se suscribe a todos los usuarios que acepten permisos, sin requerir login
  if (isSupported() && !isSubscribed() && Notification.permission !== 'denied') {
    subscribe();
  }
});

// Manejar mensajes del service worker para sincronización
if ('serviceWorker' in navigator) {
  navigator.serviceWorker.addEventListener('message', (event) => {
    if (event.data.type === 'SYNC_COMPLETE') {
      console.log('🔄 Sincronización completada:', event.data.data);
      // Recargar datos después de sincronización
      loadLibrary([]).then(data => {
        libraryStore.loadData(data);
      });
    }
  });
}
