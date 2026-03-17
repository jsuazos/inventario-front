import displayLibrary from './libraryDisplay.js';
import { libraryStore } from '../state/libraryStore.js';

export function filterLibrary(libraryData) {
    const searchText = searchInput.value.toLowerCase();
    const type = filterType.value;
    const genre = filterGenre.value;
    const artist = filterArtist.value;
    const year = filterYear.value;

    // Actualizar en el store
    libraryStore.updateFilters({
      search: searchText,
      type: type,
      genre: genre,
      artist: artist,
      year: year
    });

    const filtered = libraryStore.getFilteredData();
    displayLibrary(filtered);
}

export function clearFilters(libraryData) {
    document.getElementById('resetButton').addEventListener('click', () => {
    filterType.value = '';
    filterGenre.value = '';
    filterArtist.value = '';
    filterYear.value = '';
    searchInput.value = '';

    // Limpiar en el store
    libraryStore.clearFilters();

    // Limpiar banner si existe
    const banner = document.getElementById('artistBanner');
    if (banner) banner.innerHTML = '';

    const grid = document.getElementById('libraryGrid');
    if (grid) grid.innerHTML = '';

    displayLibrary(libraryStore.getFilteredData());
  });
}
