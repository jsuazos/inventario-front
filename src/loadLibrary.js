import toggleLoader from "./toggleLoader.js";
import populateFilters from "./populateFilters.js";
import displayLibrary from "./displayLibrary.js";
import aplicarColoresPorGenero from "./aplicarColoresPorGenero.js";
import obtenerTopEstilos from './obtenerTopEstilos.js';
import loadAlphabet from "./loadAlphabet.js";

export default async function loadLibrary(libraryData) {
  toggleLoader(true);

  if ((libraryData === null || libraryData.length === 0) && navigator.onLine) {
    await fetch("https://inventario-server-pw1j.onrender.com/api/inventario")
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
