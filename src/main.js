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
import { clearFilters } from "./utils/libraryFilters.js";
import { clearLibrary } from "./utils/modals.js";
import { modalLogin } from "./utils/modals.js";
import { libraryStore } from "./state/libraryStore.js";
import { errorHandler } from "./services/errorHandler.js";

window.addEventListener("DOMContentLoaded", async () => {
  // Inicializar el store desde localStorage
  libraryStore.init();
  
  let libraryData = JSON.parse(localStorage.getItem("libraryData")) || [];

  libraryData = await loadLibrary(libraryData);

  searchInput.addEventListener("input", () => filterLibrary(libraryData));
  filterType.addEventListener("change", () => filterLibrary(libraryData));
  filterGenre.addEventListener("change", () => filterLibrary(libraryData));
  filterArtist.addEventListener("change", () => filterLibrary(libraryData));
  filterYear.addEventListener("change", () => filterLibrary(libraryData));

  // Suscribirse a cambios del store para cualquier reactividad futura
  libraryStore.subscribe((state) => {
    console.debug('Store actualizado:', state);
  });

  clearFilters(libraryData);
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
});
