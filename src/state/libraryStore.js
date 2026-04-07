/**
 * Store centralizado para gestionar el estado de la biblioteca
 * Actúa como intermediario entre servicios y componentes
 */

import { storageService } from '../services/storageService.js';

export class LibraryStore {
  constructor() {
    this.data = [];
    this.filteredData = [];
    this.filters = {
      search: '',
      type: '',
      genre: '',
      artist: '',
      year: '',
      recibido: '',
      sortBy: ''
    };
    this.listeners = [];
    this.isLoading = false;
  }

  /**
   * Inicializa el store desde storage
   */
  init() {
    this.data = storageService.getLibraryData();
    this.applyFilters();
    this.notifyListeners();
  }

  /**
   * Carga datos desde API (si es necesario)
   * @param {Array} apiData - Datos desde API
   */
  loadData(apiData) {
    if (apiData && apiData.length > 0) {
      this.data = apiData;
      storageService.saveLibraryData(this.data);
      this.applyFilters();
      this.notifyListeners();
    }
  }

  /**
   * Actualiza los filtros y recalcula datos filtrados
   * @param {Object} newFilters - Nuevos valores de filtros
   */
  updateFilters(newFilters) {
    this.filters = { ...this.filters, ...newFilters };
    this.applyFilters();
    this.notifyListeners();
  }

  /**
   * Aplica los filtros al dataset
   */
  applyFilters() {
    const { search, type, genre, artist, year, recibido, sortBy } = this.filters;

    this.filteredData = this.data.filter(item => {
      const matchSearch = 
        item.Tipo.toLowerCase().includes(search) ||
        item.Genero.toLowerCase().includes(search) ||
        item.Disco.toLowerCase().includes(search) ||
        item.Artista.toLowerCase().includes(search) ||
        item.Año.toString().includes(search);

      const matchType = !type || item.Tipo === type;
      const matchGenre = !genre || item.Genero.includes(genre);
      const matchArtist = !artist || item.Artista === artist;
      const matchYear = !year || item.Año.toString() === year;
      const matchRecibido = !recibido || (item.Recibido && item.Recibido === recibido);

      return matchSearch && matchType && matchGenre && matchArtist && matchYear && matchRecibido;
    });

    if (sortBy === 'orden') {
      this.filteredData.sort((a, b) => (parseFloat(b.Orden) || 0) - (parseFloat(a.Orden) || 0));
    } else if (sortBy === 'anio') {
      this.filteredData.sort((a, b) => (parseInt(a.Año) || 0) - (parseInt(b.Año) || 0));
    } else if (sortBy === 'genero') {
      this.filteredData.sort((a, b) => a.Genero.localeCompare(b.Genero));
    } else if (sortBy === 'artistAsc') {
      this.filteredData.sort((a, b) => a.Artista.localeCompare(b.Artista));
    } else if (sortBy === 'artistDesc') {
      this.filteredData.sort((a, b) => b.Artista.localeCompare(a.Artista));
    }
  }

  /**
   * Limpia todos los filtros
   */
  // clearFilters() {
  //   this.filters = {
  //     search: '',
  //     type: '',
  //     genre: '',
  //     artist: '',
  //     year: '',
  //     recibido: ''
  //   };
  //   this.filteredData = [...this.data];
  //   this.notifyListeners();
  // }

  /**
   * Limpia toda la biblioteca
   */
  clearLibrary() {
    this.data = [];
    this.filteredData = [];
    storageService.clearLibraryData();
    this.notifyListeners();
  }

  /**
   * Obtiene datos filtrados
   * @returns {Array} Datos filtrados actuales
   */
  getFilteredData() {
    return this.filteredData;
  }

  /**
   * Obtiene todos los datos
   * @returns {Array} Todos los datos sin filtrar
   */
  getAllData() {
    return this.data;
  }

  /**
   * Obtiene los filtros actuales
   * @returns {Object} Objeto con filtros actuales
   */
  getFilters() {
    return this.filters;
  }

  /**
   * Establece estado de carga
   */
  setLoading(loading) {
    this.isLoading = loading;
    this.notifyListeners();
  }

  /**
   * Obtiene estado de carga
   */
  getLoading() {
    return this.isLoading;
  }

  /**
   * Se suscribe a cambios del store
   * @param {Function} callback - Función a ejecutar cuando cambia el estado
   */
  subscribe(callback) {
    this.listeners.push(callback);
    return () => {
      this.listeners = this.listeners.filter(cb => cb !== callback);
    };
  }

  /**
   * Notifica a todos los listeners de cambios
   */
  notifyListeners() {
    this.listeners.forEach(callback => {
      callback({
        data: this.filteredData,
        allData: this.data,
        filters: this.filters,
        isLoading: this.isLoading
      });
    });
  }

  /**
   * Obtiene estadísticas de la biblioteca
   * @returns {Object} Objeto con estadísticas
   */
  getStats() {
    const stats = {
      totalItems: this.data.length,
      filteredItems: this.filteredData.length,
      genres: new Set(this.data.flatMap(item => 
        item.Genero.split(',').map(g => g.trim())
      )).size,
      artists: new Set(this.data.map(item => item.Artista)).size,
      years: new Set(this.data.map(item => item.Año)).size
    };
    return stats;
  }
}

// Instancia singleton del store
export const libraryStore = new LibraryStore();
