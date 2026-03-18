class Navbar extends HTMLElement {
  connectedCallback() {
    this.innerHTML = `
        <nav class="navbar navbar-expand-lg navbar-dark px-3 sticky-top">
            <div class="d-flex w-100 align-items-center justify-content-between gap-2 flex-wrap">
            <!-- Lado izquierdo: botón y búsqueda -->
            <div class="d-flex align-items-center gap-2 flex-grow-1" style="min-width: 200px;">
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
            </div>

            <!-- Lado derecho: badge de versión -->
            <div id="cacheVersionBadge" class="badge bg-info text-dark align-self-center">
                <small>Cache: <span id="cacheVersion">Cargando...</span></small>
            </div>
            </div>

            <!-- Sidebar oculto -->
            <app-aside></app-aside>
        </nav>
    `;

    console.log('🏗️ Navbar component loaded');
    // Obtener y mostrar la versión del cache después de que se cargue
    this.updateCacheVersion();
  }

  async updateCacheVersion() {
    try {
      console.log('🔍 Intentando obtener versión del cache...');

      // Método 1: Obtener versión del nombre del cache
      if ('caches' in window) {
        const cacheNames = await caches.keys();
        console.log('📦 Caches encontrados:', cacheNames);

        const musicCache = cacheNames.find(name => name.includes('musica-inventario'));
        if (musicCache) {
          console.log('🎵 Cache encontrado:', musicCache);
          const versionMatch = musicCache.match(/musica-inventario-(v[\d\.]+)/);
          if (versionMatch && versionMatch[1]) {
            console.log('✅ Versión obtenida:', versionMatch[1]);
            this.showVersionBadge(versionMatch[1]);
            return;
          }
        }
      }

      // Método 2: Fallback con versión hardcodeada
      console.log('⚠️ Usando versión por defecto');
      this.showVersionBadge('v1.4.3');

    } catch (error) {
      console.error('❌ Error obteniendo versión:', error);
      this.showVersionBadge('Error');
    }
  }

  showVersionBadge(version) {
    const badge = this.querySelector('#cacheVersionBadge');
    const versionSpan = this.querySelector('#cacheVersion');
    if (badge && versionSpan) {
      versionSpan.textContent = version;
      console.log('🏷️ Badge actualizado con versión:', version);
      this.versionShown = true;
    } else {
      console.error('❌ No se encontraron elementos del badge');
    }
  }
}
customElements.define("app-navbar", Navbar);
