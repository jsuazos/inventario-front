import { libraryStore } from '../state/libraryStore.js';

export function filterLibrary() {
    const recibido = document.querySelector('input[name="filterRecibido"]:checked')?.value || '';

    libraryStore.updateFilters({
      recibido: recibido
    });
}

// export function clearFilters(libraryData) {
//     document.getElementById('resetButton').addEventListener('click', () => {
//     filterType.value = '';
//     filterGenre.value = '';
//     filterArtist.value = '';
//     filterYear.value = '';
//     searchInput.value = '';
    
//     // Resetear el filtro de Recibido a "Todos"
//     document.getElementById('filterRecibidoTodos').checked = true;

//     // Limpiar en el store
//     libraryStore.clearFilters();

//     // Limpiar banner si existe
//     const banner = document.getElementById('artistBanner');
//     if (banner) banner.innerHTML = '';

//     const grid = document.getElementById('libraryGrid');
//     if (grid) grid.innerHTML = '';

//     displayLibrary(libraryStore.getFilteredData());
//   });
// }
