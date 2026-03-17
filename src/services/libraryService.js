import { toggleLoader } from '../utils/ui.js';
import displayLibrary from '../utils/libraryDisplay.js';
import aplicarColoresPorGenero from '../utils/aplicarColoresPorGenero.js';
import obtenerTopEstilos from '../utils/obtenerTopEstilos.js';
import { loadAlphabet } from '../utils/ui.js';
import configService from './configService.js';
import obtenerGeneros from '../utils/obtenerGeneros.js';
import fillSelect from '../utils/filters.js';
import { libraryStore } from '../state/libraryStore.js';

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
      console.error('Error fetching library:', e);
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


