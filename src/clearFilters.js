import displayLibrary from "./displayLibrary.js";

export default function clearFilters(libraryData) {
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