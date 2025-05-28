import obtenerGeneros from "./obtenerGeneros.js";
import fillSelect from "./fillSelect.js";

export default function populateFilters(libraryData) {
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