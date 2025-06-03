// main.js
import loadLibrary from './loadLibrary.js';
import filterLibrary from './filterLibrary.js';
import displayLibrary from "./displayLibrary.js";

window.addEventListener('DOMContentLoaded', () => {

  let recorder;  
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

  // Recorre cada enlace del índice alfabético
  document.querySelectorAll('#alphabet a').forEach(link => {
    const targetId = link.getAttribute('href').replace('#', ''); // ej: letra-A
    const target = document.getElementById(targetId);

    if (!target) {
      link.classList.add('text-muted'); // Añade clase para indicar que no hay destino
      link.style.pointerEvents = 'none'; // Desactiva el enlace si no hay destino
      // link.style.display = 'none'; // Oculta la letra si no hay destino
    }
  });

  document.getElementById('btn-clear-library').addEventListener('click', () => {
    Swal.fire({
      title: '¿Limpiar biblioteca?',
      text: 'Esta acción eliminará los datos guardados localmente.',
      icon: 'warning',
      showCancelButton: true,
      confirmButtonText: 'Sí, limpiar',
      cancelButtonText: 'Cancelar',
      reverseButtons: true,
      background: '#1a1a1a',
      color: '#fff',
      backdrop: 'rgba(0,0,0,0.85)',
      customClass: {
        popup: 'animate__animated animate__zoomIn',
        confirmButton: 'btn btn-danger',
        cancelButton: 'btn btn-secondary me-2'
      },
      buttonsStyling: false
    }).then((result) => {
      if (result.isConfirmed) {
        localStorage.removeItem('libraryData');
        location.reload();
      }
    });
  });


if ('serviceWorker' in navigator) {
  navigator.serviceWorker.register('/service-worker.js').then(reg => {
    reg.onupdatefound = () => {
      const newWorker = reg.installing;
      newWorker.onstatechange = () => {
        if (newWorker.state === 'installed' && navigator.serviceWorker.controller) {
          console.log("Nueva versión disponible. Recargando...");
          window.location.reload(); // Forzar recarga si hay nueva versión
        }
      };
    };
  });
}
  // if (navigator.serviceWorker.controller) {
  //   console.log("Service Worker activo y controlado por:", navigator.serviceWorker.controller);
  // } else {
  //   console.log("Service Worker no está activo.");
  // }

  // // Verificar si hay actualizaciones pendientes
  // navigator.serviceWorker.ready.then(reg => {
  //   if (reg.waiting) {
  //     reg.waiting.postMessage({ action: 'skipWaiting' });
  //   }
  // });

});