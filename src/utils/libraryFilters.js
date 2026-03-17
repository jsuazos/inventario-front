import displayLibrary from './libraryDisplay.js';

export function filterLibrary(libraryData) {
    const searchText = searchInput.value.toLowerCase();
    const type = filterType.value;
    const genre = filterGenre.value;
    const artist = filterArtist.value;
    const year = filterYear.value;

    const filtered = libraryData.filter(item => {
      return (!type || item.Tipo === type)
        // && (!genre || item.Genero === genre)
        && (!genre || item.Genero.includes(genre))
        && (!artist || item.Artista === artist)
        && (!year || item.Año.toString() === year)
        && (item.Tipo.toLowerCase().includes(searchText) || item.Genero.toLowerCase().includes(searchText) || item.Disco.toLowerCase().includes(searchText) || item.Artista.toLowerCase().includes(searchText) || item.Año.toString().includes(searchText));
    });
    displayLibrary(filtered);
  }

export function clearFilters(libraryData) {
    document.getElementById('resetButton').addEventListener('click', () => {
    filterType.value = '';
    filterGenre.value = '';
    filterArtist.value = '';
    filterYear.value = '';
    searchInput.value = '';

    // Limpiar banner si existe
    const banner = document.getElementById('artistBanner');
    if (banner) banner.innerHTML = '';

    const grid = document.getElementById('libraryGrid');
    if (grid) grid.innerHTML = '';

    displayLibrary(libraryData);
  });
}
