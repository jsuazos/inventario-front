class Navbar extends HTMLElement {
  constructor() {
    super();
    this.libraryData = [];
    this.currentFocus = -1;
    this.searchTimeout = null;
  }

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

                <!-- Input de búsqueda con autocompletado -->
                <div class="flex-grow-1 position-relative">
                    <input id="searchInput" class="form-control" type="search" placeholder="Buscar artistas, discos, géneros..." autocomplete="off">
                    
                    <!-- Dropdown de autocompletado -->
                    <div id="searchDropdown" class="search-dropdown position-absolute w-100 mt-1 bg-dark border rounded shadow-lg d-none" style="z-index: 1050; max-height: 300px; overflow-y: auto;">
                        <div id="searchSuggestions" class="search-suggestions">
                            <!-- Las sugerencias se agregarán aquí dinámicamente -->
                        </div>
                    </div>
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
    this.initSearchAutocomplete();
    // Obtener y mostrar la versión del cache después de que se cargue
    this.updateCacheVersion();
  }

  /**
   * Inicializa el sistema de autocompletado
   */
  initSearchAutocomplete() {
    const searchInput = this.querySelector('#searchInput');
    const searchDropdown = this.querySelector('#searchDropdown');

    if (!searchInput || !searchDropdown) return;

    // Cargar datos de la biblioteca cuando estén disponibles
    this.loadLibraryData();

    // Event listeners para el input
    searchInput.addEventListener('input', (e) => this.handleInput(e));
    searchInput.addEventListener('keydown', (e) => this.handleKeydown(e));
    searchInput.addEventListener('focus', () => this.handleFocus());
    searchInput.addEventListener('blur', () => setTimeout(() => this.hideDropdown(), 150));

    // Event listener para clicks fuera del dropdown
    document.addEventListener('click', (e) => {
      if (!this.contains(e.target)) {
        this.hideDropdown();
      }
    });
  }

  /**
   * Carga los datos de la biblioteca para autocompletado
   */
  async loadLibraryData() {
    try {
      // Intentar obtener datos del localStorage primero
      const storedData = localStorage.getItem('libraryData');
      if (storedData) {
        this.libraryData = JSON.parse(storedData);
        console.log('📚 Datos de biblioteca cargados para autocompletado:', this.libraryData.length, 'items');
      }

      // También escuchar por actualizaciones de datos
      window.addEventListener('libraryDataLoaded', (e) => {
        this.libraryData = e.detail;
        console.log('📚 Datos de biblioteca actualizados para autocompletado:', this.libraryData.length, 'items');
      });
    } catch (error) {
      console.error('❌ Error cargando datos para autocompletado:', error);
    }
  }

  /**
   * Maneja el input del usuario
   */
  handleInput(e) {
    const query = e.target.value.trim();
    
    // Limpiar timeout anterior
    if (this.searchTimeout) {
      clearTimeout(this.searchTimeout);
    }

    if (query.length < 2) {
      this.hideDropdown();
      return;
    }

    // Debounce para evitar búsquedas excesivas
    this.searchTimeout = setTimeout(() => {
      this.showSuggestions(query);
    }, 200);
  }

  /**
   * Maneja navegación con teclado
   */
  handleKeydown(e) {
    const suggestions = this.querySelectorAll('.search-suggestion-item');
    
    if (!suggestions.length) return;

    switch (e.key) {
      case 'ArrowDown':
        e.preventDefault();
        this.currentFocus = Math.min(this.currentFocus + 1, suggestions.length - 1);
        this.updateFocus();
        break;
      case 'ArrowUp':
        e.preventDefault();
        this.currentFocus = Math.max(this.currentFocus - 1, 0);
        this.updateFocus();
        break;
      case 'Enter':
        e.preventDefault();
        if (this.currentFocus >= 0 && suggestions[this.currentFocus]) {
          this.selectSuggestion(suggestions[this.currentFocus]);
        }
        break;
      case 'Escape':
        this.hideDropdown();
        break;
    }
  }

  /**
   * Maneja el foco en el input
   */
  handleFocus() {
    const query = this.querySelector('#searchInput').value.trim();
    if (query.length >= 2) {
      this.showSuggestions(query);
    }
  }

  /**
   * Muestra las sugerencias de autocompletado
   */
  showSuggestions(query) {
    this.query = query; // Guardar la consulta actual
    if (!this.libraryData.length) return;

    const suggestions = this.generateSuggestions(query);
    const suggestionsContainer = this.querySelector('#searchSuggestions');
    const dropdown = this.querySelector('#searchDropdown');

    if (!suggestions.length) {
      this.hideDropdown();
      return;
    }

    suggestionsContainer.innerHTML = suggestions.map(suggestion => 
      this.createSuggestionHTML(suggestion)
    ).join('');

    dropdown.classList.remove('d-none');
    this.currentFocus = -1;

    // Agregar event listeners a las sugerencias
    suggestionsContainer.querySelectorAll('.search-suggestion-item').forEach((item, index) => {
      item.addEventListener('click', () => this.selectSuggestion(item));
      item.addEventListener('mouseenter', () => {
        this.currentFocus = index;
        this.updateFocus();
      });
    });
  }

  /**
   * Genera sugerencias basadas en la consulta
   */
  generateSuggestions(query) {
    const queryLower = query.toLowerCase();
    const suggestions = new Map(); // Usar Map para evitar duplicados
    const maxSuggestions = 8;

    // Buscar en diferentes campos
    this.libraryData.forEach(item => {
      // Artistas
      if (item.Artista && item.Artista.toLowerCase().includes(queryLower)) {
        if (!suggestions.has(`artist-${item.Artista}`)) {
          suggestions.set(`artist-${item.Artista}`, {
            text: item.Artista,
            type: 'Artista',
            icon: '🎤',
            count: this.libraryData.filter(i => i.Artista === item.Artista).length
          });
        }
      }

      // Discos
      if (item.Disco && item.Disco.toLowerCase().includes(queryLower)) {
        if (!suggestions.has(`album-${item.Disco}`)) {
          suggestions.set(`album-${item.Disco}`, {
            text: item.Disco,
            type: 'Disco',
            icon: '💿',
            artist: item.Artista
          });
        }
      }

      // Géneros
      if (item.Genero && item.Genero.toLowerCase().includes(queryLower)) {
        if (!suggestions.has(`genre-${item.Genero}`)) {
          suggestions.set(`genre-${item.Genero}`, {
            text: item.Genero,
            type: 'Género',
            icon: '🎵',
            count: this.libraryData.filter(i => i.Genero === item.Genero).length
          });
        }
      }

      // Tipos
      if (item.Tipo && item.Tipo.toLowerCase().includes(queryLower)) {
        if (!suggestions.has(`type-${item.Tipo}`)) {
          suggestions.set(`type-${item.Tipo}`, {
            text: item.Tipo,
            type: 'Tipo',
            icon: '📀',
            count: this.libraryData.filter(i => i.Tipo === item.Tipo).length
          });
        }
      }

      // Años
      if (item.Año && item.Año.toString().includes(query)) {
        const yearKey = `year-${item.Año}`;
        if (!suggestions.has(yearKey)) {
          suggestions.set(yearKey, {
            text: item.Año.toString(),
            type: 'Año',
            icon: '📅',
            count: this.libraryData.filter(i => i.Año === item.Año).length
          });
        }
      }
    });

    // Convertir a array y ordenar por relevancia
    return Array.from(suggestions.values())
      .sort((a, b) => {
        // Priorizar coincidencias exactas
        const aExact = a.text.toLowerCase() === queryLower;
        const bExact = b.text.toLowerCase() === queryLower;
        if (aExact && !bExact) return -1;
        if (!aExact && bExact) return 1;
        
        // Luego por tipo (artistas primero)
        const typeOrder = { 'Artista': 0, 'Disco': 1, 'Género': 2, 'Tipo': 3, 'Año': 4 };
        const aOrder = typeOrder[a.type] || 5;
        const bOrder = typeOrder[b.type] || 5;
        if (aOrder !== bOrder) return aOrder - bOrder;
        
        // Finalmente por conteo (más frecuentes primero)
        return (b.count || 0) - (a.count || 0);
      })
      .slice(0, maxSuggestions);
  }

  /**
   * Crea el HTML para una sugerencia
   */
  createSuggestionHTML(suggestion) {
    const subtitle = suggestion.artist ? `por ${suggestion.artist}` : 
                    suggestion.count ? `(${suggestion.count} items)` : '';
    
    return `
      <div class="search-suggestion-item">
        <span class="search-suggestion-icon">${suggestion.icon}</span>
        <span class="search-suggestion-text">${this.highlightMatch(suggestion.text, this.query)}</span>
        <span class="search-suggestion-type">${suggestion.type}</span>
      </div>
    `;
  }

  /**
   * Resalta las coincidencias en el texto
   */
  highlightMatch(text, query) {
    if (!query) return text;
    const regex = new RegExp(`(${query.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')})`, 'gi');
    return text.replace(regex, '<mark>$1</mark>');
  }

  /**
   * Actualiza el foco visual en las sugerencias
   */
  updateFocus() {
    const suggestions = this.querySelectorAll('.search-suggestion-item');
    suggestions.forEach((item, index) => {
      if (index === this.currentFocus) {
        item.classList.add('active');
      } else {
        item.classList.remove('active');
      }
    });
  }

  /**
   * Selecciona una sugerencia
   */
  selectSuggestion(suggestionElement) {
    const textElement = suggestionElement.querySelector('.search-suggestion-text');
    const selectedText = textElement ? textElement.textContent : suggestionElement.textContent;
    
    const searchInput = this.querySelector('#searchInput');
    searchInput.value = selectedText;
    
    this.hideDropdown();
    
    // Trigger search
    searchInput.dispatchEvent(new Event('input'));
    searchInput.focus();
  }

  /**
   * Oculta el dropdown
   */
  hideDropdown() {
    const dropdown = this.querySelector('#searchDropdown');
    if (dropdown) {
      dropdown.classList.add('d-none');
    }
    this.currentFocus = -1;
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
