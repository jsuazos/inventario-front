import { libraryStore } from '../state/libraryStore.js';

import { normalizeGenreTag, splitGenreTags } from '../utils/genreTags.js';
import { normalizeTypeTag, splitTypeTags } from '../utils/typeTags.js';

class Navbar extends HTMLElement {
  constructor() {
    super();
    this.libraryData = [];
    this.currentFocus = -1;
    this.searchTimeout = null;
    this.isSelectingSuggestion = false;
    this.justSelectedSuggestion = false;
    this.versionShown = false;
    this.clickOutsideHandler = null;
    this.searchBadges = [];
    this.filterTimeout = null;
    this.unsubscribeStore = [];
    this.connectionStatusHandler = null;
  }

  connectedCallback() {
    this.innerHTML = `
        <nav class="navbar navbar-expand-lg navbar-dark px-3 sticky-top" style="padding-top: calc(0.5rem + env(safe-area-inset-top, 0px));">
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
                    <input id="searchInput" class="form-control" type="search" placeholder="Buscar artistas, discos, géneros..." autocomplete="off" style="text-transform: lowercase;">
                    
                    <!-- Dropdown de autocompletado -->
                    <div id="searchDropdown" class="search-dropdown position-absolute w-100 mt-1 bg-dark border rounded shadow-lg d-none" style="z-index: 1050; max-height: 300px; overflow-y: auto;">
                        <div id="searchSuggestions" class="search-suggestions">
                            <!-- Las sugerencias se agregarán aquí dinámicamente -->
                        </div>
                    </div>

                </div>
            </div>

            <!-- Lado derecho: badge de versión -->
            <div id="cacheVersionBadge" class="badge bg-info text-dark align-self-center badge-desktop">
                <small>Cache: <span id="cacheVersion">Cargando...</span></small>
            </div>
            <div id="connection-status" class="badge bg-success ms-2 badge-desktop">
                <small>Online</small>
            </div>
            </div>

            <!-- Sidebar oculto -->
            <app-aside></app-aside>
        </nav>
    `;

    console.log('🏗️ Navbar component loaded');
    this.initSearchAutocomplete();
    this.setupConnectionStatus();
    this.updateCacheVersion();

    // Sincronizar badges cuando el store cambie
    const unsubscribeBadges = libraryStore.subscribe(() => {
      const currentBadges = libraryStore.getFilters().searchBadges;
      if (JSON.stringify(this.searchBadges) !== JSON.stringify(currentBadges)) {
        this.searchBadges = currentBadges;
        this.renderBadges();
      }
    });
    this.unsubscribeStore.push(unsubscribeBadges);
  }

  /**
   * Inicializa el sistema de autocompletado
   */
  initSearchAutocomplete() {
    const searchInput = this.querySelector('#searchInput');
    const searchDropdown = this.querySelector('#searchDropdown');
    
    if (!searchInput || !searchDropdown) return;

    this.syncLibraryData();

    // Event listeners para el input
    searchInput.addEventListener('input', (e) => this.handleInput(e));
    searchInput.addEventListener('keydown', (e) => this.handleKeydown(e));
    searchInput.addEventListener('focus', () => this.handleFocus());
    searchInput.addEventListener('blur', () => setTimeout(() => this.hideDropdown(), 150));

    // Event listener para clicks fuera del dropdown - usar arrow function para preservar contexto
    const handleClickOutside = (e) => {
      if (!this.contains(e.target)) {
        this.hideDropdown();
      }
    };
    document.addEventListener('click', handleClickOutside);

    this.clickOutsideHandler = handleClickOutside;
  }

  /**
   * Carga los datos de la biblioteca para autocompletado
   */
  syncLibraryData() {
    const updateLibraryData = ({ allData = [] }) => {
      this.libraryData = Array.isArray(allData) ? allData : [];
    };

    updateLibraryData({ allData: libraryStore.getAllData() });
    this.unsubscribeStore.push(libraryStore.subscribe(updateLibraryData));
  }

  /**
   * Maneja el input del usuario
   */
  handleInput(e) {
    const originalValue = e.target.value;
    const lowerCaseValue = originalValue.toLowerCase();
    
    if (originalValue !== lowerCaseValue) {
      e.target.value = lowerCaseValue;
    }

    if (this.isSelectingSuggestion) {
      this.isSelectingSuggestion = false;
      return;
    }

    const query = e.target.value.trim();

    if (this.filterTimeout) {
      clearTimeout(this.filterTimeout);
    }

    this.filterTimeout = setTimeout(() => {
      libraryStore.setSearchInput(e.target.value);
    }, 120);

    if (this.searchTimeout) {
      clearTimeout(this.searchTimeout);
    }

    if (query.length < 2) {
      this.hideDropdown();
      return;
    }

    this.searchTimeout = setTimeout(() => {
      this.showSuggestions(query);
    }, 200);
  }

  disconnectedCallback() {
    if (this.clickOutsideHandler) {
      document.removeEventListener('click', this.clickOutsideHandler);
      this.clickOutsideHandler = null;
    }

    if (this.searchTimeout) {
      clearTimeout(this.searchTimeout);
      this.searchTimeout = null;
    }

    if (this.filterTimeout) {
      clearTimeout(this.filterTimeout);
      this.filterTimeout = null;
    }

    this.unsubscribeStore.forEach(unsubscribe => unsubscribe());
    this.unsubscribeStore = [];

    if (this.connectionStatusHandler) {
      window.removeEventListener('online', this.connectionStatusHandler);
      window.removeEventListener('offline', this.connectionStatusHandler);
      window.removeEventListener('focus', this.connectionStatusHandler);
      window.removeEventListener('pageshow', this.connectionStatusHandler);
      document.removeEventListener('visibilitychange', this.connectionStatusHandler);
      this.connectionStatusHandler = null;
    }
  }

  /**
   * Maneja navegación con teclado
   */
  handleKeydown(e) {
    const suggestions = this.querySelectorAll('.search-suggestion-item');

    if (e.key === 'Enter') {
      e.preventDefault();
      if (this.currentFocus >= 0 && suggestions[this.currentFocus]) {
        this.selectSuggestion(suggestions[this.currentFocus]);
      } else {
        const searchInput = this.querySelector('#searchInput');
        const term = searchInput.value.trim();
        if (term) {
          this.addBadge(term);
          searchInput.value = '';
          libraryStore.setSearchInput('');
        }
      }
      return;
    }

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
      case 'Escape':
        this.hideDropdown();
        break;
    }
  }

  /**
   * Maneja el foco en el input
   */
  handleFocus() {
    // Si se acaba de seleccionar una sugerencia, no mostrar dropdown
    if (this.justSelectedSuggestion) {
      this.justSelectedSuggestion = false;
      return;
    }

    const searchInput = this.querySelector('#searchInput');
    // Asegurar que el valor esté en minúsculas al hacer foco
    const currentValue = searchInput.value;
    const lowerCaseValue = currentValue.toLowerCase();
    if (currentValue !== lowerCaseValue) {
      searchInput.value = lowerCaseValue;
    }

    const query = searchInput.value.trim();
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
    const artistSuggestions = new Map();
    const otherSuggestions = new Map();
    const maxArtists = 5;
    const maxOthers = 3;

    // Buscar en diferentes campos
    this.libraryData.forEach(item => {
      // Artistas - máxima prioridad
      if (item.Artista && item.Artista.toLowerCase().includes(queryLower)) {
        if (!artistSuggestions.has(`artist-${item.Artista}`)) {
          artistSuggestions.set(`artist-${item.Artista}`, {
            text: item.Artista,
            type: 'Artista',
            icon: '🎤',
            count: this.libraryData.filter(i => i.Artista === item.Artista).length,
            priority: 0 // Máxima prioridad
          });
        }
      }

      // Otros tipos
      if (otherSuggestions.size < maxOthers) {
        // Discos
        if (item.Disco && item.Disco.toLowerCase().includes(queryLower)) {
          if (!otherSuggestions.has(`album-${item.Disco}`) && !artistSuggestions.has(`album-${item.Disco}`)) {
            otherSuggestions.set(`album-${item.Disco}`, {
              text: item.Disco,
              type: 'Disco',
              icon: '💿',
              artist: item.Artista,
              priority: 1
            });
          }
        }

        // Géneros
        splitGenreTags(item.Genero).forEach(genreTag => {
          if (!genreTag.toLowerCase().includes(queryLower)) {
            return;
          }

          const genreKey = `genre-${normalizeGenreTag(genreTag)}`;
          if (!otherSuggestions.has(genreKey) && !artistSuggestions.has(genreKey)) {
            otherSuggestions.set(genreKey, {
              text: genreTag,
              type: 'Género',
              icon: '🎵',
              count: this.libraryData.filter(i =>
                splitGenreTags(i.Genero).some(tag => normalizeGenreTag(tag) === normalizeGenreTag(genreTag))
              ).length,
              priority: 2
            });
          }
        });

        // Tipos
        splitTypeTags(item.Tipo).forEach(typeTag => {
          if (!typeTag.toLowerCase().includes(queryLower)) {
            return;
          }

          const typeKey = `type-${normalizeTypeTag(typeTag)}`;
          if (!otherSuggestions.has(typeKey) && !artistSuggestions.has(typeKey)) {
            otherSuggestions.set(typeKey, {
              text: typeTag,
              type: 'Tipo',
              icon: '📀',
              count: this.libraryData.filter(i =>
                splitTypeTags(i.Tipo).some(tag => normalizeTypeTag(tag) === normalizeTypeTag(typeTag))
              ).length,
              priority: 3
            });
          }
        });

        // Años
        if (item.Año && item.Año.toString().includes(query)) {
          const yearKey = `year-${item.Año}`;
          if (!otherSuggestions.has(yearKey) && !artistSuggestions.has(yearKey)) {
            otherSuggestions.set(yearKey, {
              text: item.Año.toString(),
              type: 'Año',
              icon: '📅',
              count: this.libraryData.filter(i => i.Año === item.Año).length,
              priority: 4
            });
          }
        }
      }
    });

    // Combinar y ordenar: artistas primero, luego otros por prioridad
    const allSuggestions = [
      ...Array.from(artistSuggestions.values()).slice(0, maxArtists),
      ...Array.from(otherSuggestions.values()).slice(0, maxOthers)
    ];

    // Ordenar por prioridad y luego por relevancia
    return allSuggestions
      .sort((a, b) => {
        // Primero por prioridad (artistas tienen prioridad 0)
        if (a.priority !== b.priority) {
          return a.priority - b.priority;
        }

        // Luego por coincidencia exacta
        const aExact = a.text.toLowerCase() === queryLower;
        const bExact = b.text.toLowerCase() === queryLower;
        if (aExact && !bExact) return -1;
        if (!aExact && bExact) return 1;
        
        // Finalmente por conteo (más frecuentes primero)
        return (b.count || 0) - (a.count || 0);
      });
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
    
    this.justSelectedSuggestion = true;
    
    const term = selectedText.toLowerCase().trim();
    this.hideDropdown();
    
    if (term) {
      this.addBadge(term);
    }
    
    searchInput.value = '';
    libraryStore.setSearchInput('');
    searchInput.blur();
  }

  /**
   * Agrega un badge de búsqueda
   * @param {string} term - Término a agregar como badge
   */
  addBadge(term) {
    const trimmed = term.trim().toLowerCase();
    if (!trimmed) return;

    libraryStore.addSearchBadge(trimmed);
    this.searchBadges = libraryStore.getFilters().searchBadges;
    this.renderBadges();
    window.scrollTo({ top: 0, behavior: 'smooth' });
  }

  /**
   * Elimina un badge por índice
   * @param {number} index - Índice del badge a eliminar
   */
  removeBadge(index) {
    libraryStore.removeSearchBadge(index);
    this.searchBadges = libraryStore.getFilters().searchBadges;
    this.renderBadges();
    window.scrollTo({ top: 0, behavior: 'smooth' });
  }

  /**
   * Renderiza los badges de filtros activos
   */
  renderBadges() {
    const container = document.querySelector('.search-badges');
    if (!container) return;

    if (this.searchBadges.length === 0) {
      container.innerHTML = '';
      container.style.display = 'none';
      return;
    }

    container.style.display = 'flex';
    container.innerHTML = this.searchBadges.map((term, index) => `
      <span class="search-badge">
        <span>${term}</span>
        <button class="btn-close btn-close-white" aria-label="Eliminar filtro" data-index="${index}"></button>
      </span>
    `).join('');

    container.querySelectorAll('.btn-close').forEach(btn => {
      btn.addEventListener('click', () => {
        const idx = parseInt(btn.dataset.index, 10);
        this.removeBadge(idx);
      });
    });
  }

  /**
   * Configura el indicador de estado de conexión
   */
  setupConnectionStatus() {
    const statusElement = this.querySelector('#connection-status');
    
    const updateStatus = () => {
      const online = navigator.onLine;
      const cls = online ? 'bg-success' : 'bg-warning';
      const txt = online ? 'Online' : 'Offline';
      const mobileStatus = document.getElementById('connection-status-mobile');

      if (statusElement) {
        statusElement.className = `badge ${cls} ms-2 badge-desktop`;
        statusElement.innerHTML = `<small>${txt}</small>`;
      }
      if (mobileStatus) {
        mobileStatus.className = `badge ${cls}`;
        mobileStatus.innerHTML = `<small>${txt}</small>`;
      }
    };

    updateStatus();
    this.connectionStatusHandler = () => {
      if (document.visibilityState && document.visibilityState !== 'visible' && !navigator.onLine) {
        updateStatus();
        return;
      }

      updateStatus();
    };

    window.addEventListener('online', this.connectionStatusHandler);
    window.addEventListener('offline', this.connectionStatusHandler);
    window.addEventListener('focus', this.connectionStatusHandler);
    window.addEventListener('pageshow', this.connectionStatusHandler);
    document.addEventListener('visibilitychange', this.connectionStatusHandler);
  }

  /**
   * Actualiza el badge con la versión del caché
   */
  updateCacheVersion() {
    if (this.versionShown) return;
    this.versionShown = true;

    try {
      // Método 1: Obtener versión del Service Worker
      if ('serviceWorker' in navigator && navigator.serviceWorker.controller) {
        const messageChannel = new MessageChannel();
        messageChannel.port1.onmessage = (event) => {
          if (event.data && event.data.cacheVersion) {
            this.showVersionBadge(event.data.cacheVersion);
          } else {
            console.log('⚠️ Usando versión por defecto');
            this.showVersionBadge('v1.8.1');
          }
        };

        navigator.serviceWorker.controller.postMessage('GET_CACHE_VERSION', [messageChannel.port2]);

        // Timeout para evitar esperar indefinidamente
        setTimeout(() => {
          if (!this.versionShown) {
            console.log('⚠️ Usando versión por defecto');
            this.showVersionBadge('v1.8.1');
          }
        }, 2000);

      } else {
        // Método 2: Fallback con versión hardcodeada
        console.log('⚠️ Usando versión por defecto');
        this.showVersionBadge('v1.8.1');
      }
    } catch (error) {
      console.error('❌ Error obteniendo versión:', error);
      this.showVersionBadge('Error');
    }
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
      this.showVersionBadge('v1.8.1');

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
    }
    const mobileVersion = document.getElementById('cacheVersion-mobile');
    if (mobileVersion) mobileVersion.textContent = version;
  }

  /**
   * Oculta el dropdown de búsqueda
   */
  hideDropdown() {
    const dropdown = this.querySelector('#searchDropdown');
    if (dropdown) {
      dropdown.classList.add('d-none');
    }
  }

  /**
   * Limpia event listeners cuando el componente se desconecta
   */
  disconnectedCallback() {
    if (this.clickOutsideHandler) {
      document.removeEventListener('click', this.clickOutsideHandler);
      this.clickOutsideHandler = null;
    }
  }
}
customElements.define("app-navbar", Navbar);
