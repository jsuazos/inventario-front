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

  // Push notifications: adaptado para iOS (requiere Home Screen + user gesture)
  setupPushNotifications();
});

function isIOS() {
  return /iphone|ipad|ipod/i.test(navigator.userAgent);
}

function setupPushNotifications() {
  if (!isSupported() || isSubscribed()) return;
  if (Notification.permission === 'denied') return;

  if (isIOS() && !window.navigator.standalone) {
    showInstallBanner();
    return;
  }

  showSubscribeBell();
}

function showInstallBanner() {
  const banner = document.createElement('div');
  banner.id = 'ios-install-banner';
  banner.style.cssText = `
    position: fixed; bottom: 20px; left: 20px; right: 20px;
    z-index: 10000; background: #1a1a2e; color: #fff;
    border: 1px solid #0dcaf0; border-radius: 12px;
    padding: 16px; box-shadow: 0 4px 20px rgba(0,0,0,0.5);
    font-size: 14px; max-width: 400px; margin: 0 auto;
  `;
  banner.innerHTML = `
    <div style="display:flex;align-items:flex-start;gap:12px">
      <span style="font-size:28px">📱</span>
      <div style="flex:1">
        <strong style="color:#0dcaf0">Agrega esta app a tu pantalla de inicio</strong>
        <p style="margin:6px 0 0;color:#ccc;font-size:13px">
          Para recibir notificaciones cuando haya cambios en la biblioteca:
        </p>
        <ol style="margin:8px 0 0;padding-left:18px;color:#aaa;font-size:12px;line-height:1.6">
          <li>Toca <strong style="color:#fff">Compartir</strong> (cuadro con flecha ↑)</li>
          <li>Desplázate y toca <strong style="color:#fff">Agregar a Inicio</strong></li>
          <li>Toca <strong style="color:#fff">Agregar</strong> (arriba a la derecha)</li>
        </ol>
      </div>
      <button id="close-install-banner" style="
        background:none;border:none;color:#888;font-size:20px;
        cursor:pointer;padding:0;line-height:1;flex-shrink:0
      ">×</button>
    </div>
  `;
  document.body.appendChild(banner);

  document.getElementById('close-install-banner').onclick = () => {
    banner.remove();
  };
}

function showSubscribeBell() {
  const btn = document.createElement('button');
  btn.id = 'push-subscribe-btn';
  btn.title = 'Activar notificaciones de cambios';
  btn.style.cssText = `
    position: fixed; bottom: 80px; right: 20px; z-index: 9999;
    width: 50px; height: 50px; border-radius: 50%; border: none;
    background: #0dcaf0; color: #000; font-size: 22px;
    cursor: pointer; box-shadow: 0 3px 12px rgba(13,202,240,0.4);
    display: flex; align-items: center; justify-content: center;
    transition: transform 0.2s;
  `;
  btn.textContent = '🔔';
  btn.onmouseenter = () => btn.style.transform = 'scale(1.1)';
  btn.onmouseleave = () => btn.style.transform = 'scale(1)';
  btn.onclick = async () => {
    btn.style.display = 'none';
    const ok = await subscribe();
    if (!ok && Notification.permission !== 'denied') {
      btn.style.display = 'flex';
    }
  };
  document.body.appendChild(btn);
}

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
