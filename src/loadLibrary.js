import toggleLoader from "./toggleLoader.js";
import populateFilters from "./populateFilters.js";
import displayLibrary from "./displayLibrary.js";
import aplicarColoresPorGenero from "./aplicarColoresPorGenero.js";

export default async function loadLibrary(libraryData) {
    toggleLoader(true);
    if (libraryData === null || libraryData.length === 0) {
      
    await fetch("https://inventario-server-pw1j.onrender.com/api/inventario")
      .then(res => res.json())
      .then(data => {
        libraryData = data.data || [];
        localStorage.setItem('libraryData', JSON.stringify(libraryData));
      });
    }
    populateFilters(libraryData);
    displayLibrary(libraryData);
    aplicarColoresPorGenero();
    toggleLoader(false);
  }