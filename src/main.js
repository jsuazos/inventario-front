// main.js
import './components/Navbar.js';
import './components/Aside.js';
import './components/Filters.js';
import './components/Loader.js';
import './components/LoginModal.js';
import './components/Alphabet.js';
import './components/Footer.js';

import loadLibrary from "./loadLibrary.js";
import filterLibrary from "./filterLibrary.js";
import toggleSidebar from "./toggleSidebar.js";
import clearFilters from "./clearFilters.js";
import clearLibrary from "./modalClearLibrary.js";
import login from "./modalLogin.js";

window.addEventListener("DOMContentLoaded", async () => {
  let libraryData = JSON.parse(localStorage.getItem("libraryData")) || [];

  libraryData = await loadLibrary(libraryData);

  searchInput.addEventListener("input", () => filterLibrary(libraryData));
  filterType.addEventListener("change", () => filterLibrary(libraryData));
  filterGenre.addEventListener("change", () => filterLibrary(libraryData));
  filterArtist.addEventListener("change", () => filterLibrary(libraryData));
  filterYear.addEventListener("change", () => filterLibrary(libraryData));

  clearFilters(libraryData);
  toggleSidebar();
  clearLibrary();

  login();

  if ("serviceWorker" in navigator) {
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
