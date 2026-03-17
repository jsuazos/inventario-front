import { toggleLoader } from '../utils/ui.js';
import displayLibrary from '../utils/libraryDisplay.js';
import aplicarColoresPorGenero from '../utils/aplicarColoresPorGenero.js';
import obtenerTopEstilos from '../utils/obtenerTopEstilos.js';
import { loadAlphabet } from '../utils/ui.js';
import configService from './configService.js';
import obtenerGeneros from '../utils/obtenerGeneros.js';
import fillSelect from '../utils/filters.js';

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

  if ((libraryData === null || libraryData.length === 0) && navigator.onLine) {
    const { apiUrl } = await configService();
    const url = `${apiUrl.replace(/\/$/, "")}/inventario`;

    await fetch(url)
      .then(res => res.json())
      .then(data => {
        libraryData = data.data || [];
        libraryData.sort((a, b) => {

          const claveA = a.Artista.toLowerCase() + ' ' + a.Año;
          const claveB = b.Artista.toLowerCase() + ' ' + b.Año;

          return claveA.localeCompare(claveB);
        });

        localStorage.setItem('libraryData', JSON.stringify(libraryData));
      })
      .catch(e => console.error('Error fetching library:', e));
  }

  populateFilters(libraryData || []);
  displayLibrary(libraryData || []);
  aplicarColoresPorGenero();
  // Llamar a obtenerTopEstilos después de aplicar los colores para asegurarnos
  // de que los estilos están aplicados antes de calcular el top
  requestAnimationFrame(() => {
    obtenerTopEstilos();
    loadAlphabet();
  });
  toggleLoader(false);

  return libraryData;
}

