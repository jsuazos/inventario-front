// main.js
import loadLibrary from './loadLibrary.js';
import filterLibrary from './filterLibrary.js';
import displayLibrary from "./displayLibrary.js";

window.addEventListener('DOMContentLoaded', () => {

  let libraryData = navigator.onLine ? JSON.parse(localStorage.getItem('libraryData')) : [];

  searchInput.addEventListener('input', () => filterLibrary(libraryData));
  filterType.addEventListener('change', () => filterLibrary(libraryData));
  filterGenre.addEventListener('change', () => filterLibrary(libraryData));
  filterArtist.addEventListener('change', () => filterLibrary(libraryData));
  filterYear.addEventListener('change', () => filterLibrary(libraryData));

  document.addEventListener('click', function (e) {
    if (e.target.classList.contains('card-title')) {
      const index = e.target.getAttribute('data-index');
      const item = libraryData[index];
      document.getElementById('discoModalLabel').textContent = item.Disco;
      document.getElementById('discoModalBody').innerHTML = `
        <img src="${item.img || 'https://via.placeholder.com/300x300?text=🎵'}" class="img-fluid mb-3">
        <p><strong>Artista:</strong> ${item.Artista}</p>
        <p><strong>Tipo:</strong> ${item.Tipo}</p>
        <p><strong>Género:</strong> ${item.Genero}</p>
        <p><strong>Año:</strong> ${item.Año}</p>
      `;
      const modal = new bootstrap.Modal(document.getElementById('discoModal'));
      modal.show();
    }
    if (e.target.classList.contains('artist-link')) {
      e.preventDefault();
      const artist = e.target.getAttribute('data-artist');
      filterArtist.value = artist;
      filterLibrary(libraryData);
    }
  });

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

  loadLibrary(libraryData);

  
  const toggleSidebar = document.getElementById("toggleSidebar");
  const sidebar = document.getElementById("sidebar");

  toggleSidebar.addEventListener("click", () => {
    sidebar.classList.toggle("show");
    document.body.classList.toggle("sidebar-open");
  });

  // Cerrar al hacer clic fuera
  document.addEventListener("click", (e) => {
    if (!sidebar.contains(e.target) && !toggleSidebar.contains(e.target)) {
      sidebar.classList.remove("show");
      document.body.classList.remove("sidebar-open");
    }
  });
});