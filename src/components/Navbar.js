class Navbar extends HTMLElement {
  connectedCallback() {
    this.innerHTML = `
        <nav class="navbar navbar-expand-lg navbar-dark px-3 sticky-top">
            <div class="d-flex w-100 align-items-center gap-2">
            <!-- Botón hamburguesa -->
            <button id="toggleSidebar" class="btn btn-outline-light p-2">
                <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" fill="currentColor" class="bi bi-list"
                viewBox="0 0 16 16">
                <path fill-rule="evenodd"
                    d="M2.5 12a.5.5 0 0 1 .5-.5h10a.5.5 0 0 1 0 1H3a.5.5 0 0 1-.5-.5m0-4a.5.5 0 0 1 .5-.5h10a.5.5 0 0 1 0 1H3a.5.5 0 0 1-.5-.5m0-4a.5.5 0 0 1 .5-.5h10a.5.5 0 0 1 0 1H3a.5.5 0 0 1-.5-.5" />
                </svg>
            </button>

            <!-- Input de búsqueda -->
            <div class="flex-grow-1">
                <input id="searchInput" class="form-control" type="search" placeholder="Buscar..." autocomplete="off">
            </div>

            <!-- Badge de versión del cache -->
            <div id="cacheVersionBadge" class="badge bg-info text-dark ms-2 d-none">
                <small>Cache: <span id="cacheVersion">Cargando...</span></small>
            </div>
            </div>

            <!-- Sidebar oculto -->
            <app-aside></app-aside>
        </nav>
    `;

    // Obtener y mostrar la versión del cache después de que se cargue
    this.updateCacheVersion();
  }

  async updateCacheVersion() {
    try {
      if ('serviceWorker' in navigator && 'caches' in window) {
        const registration = await navigator.serviceWorker.ready;
        
        // Esperar un poco para que el service worker esté completamente listo
        await new Promise(resolve => setTimeout(resolve, 100));
        
        // Obtener todos los nombres de cache
        const cacheNames = await caches.keys();
        const musicCache = cacheNames.find(name => name.includes('musica-inventario'));
        
        if (musicCache) {
          // Extraer la versión del nombre del cache (formato: musica-inventario-v1.4.2)
          const versionMatch = musicCache.match(/musica-inventario-(v[\d\.]+)/);
          if (versionMatch && versionMatch[1]) {
            const version = versionMatch[1];
            this.showVersionBadge(version);
            return;
          }
        }
        
        // Si no se pudo obtener del cache, intentar obtener del service worker
        if (registration.active) {
          // Enviar mensaje al service worker para obtener la versión
          const messageChannel = new MessageChannel();
          messageChannel.port1.onmessage = (event) => {
            if (event.data && event.data.cacheVersion) {
              this.showVersionBadge(event.data.cacheVersion);
            }
          };
          
          registration.active.postMessage({ type: 'GET_CACHE_VERSION' }, [messageChannel.port2]);
          
          // Timeout por si no hay respuesta
          setTimeout(() => {
            if (!this.versionShown) {
              this.showVersionBadge('v1.4.2'); // fallback
            }
          }, 2000);
        } else {
          // Fallback si no hay service worker activo
          this.showVersionBadge('v1.4.2');
        }
      }
    } catch (error) {
      console.log('No se pudo obtener la versión del cache:', error);
      this.showVersionBadge('N/A');
    }
  }

  showVersionBadge(version) {
    const badge = this.querySelector('#cacheVersionBadge');
    const versionSpan = this.querySelector('#cacheVersion');
    if (badge && versionSpan) {
      versionSpan.textContent = version;
      badge.classList.remove('d-none');
      this.versionShown = true;
    }
  }
}
customElements.define("app-navbar", Navbar);
