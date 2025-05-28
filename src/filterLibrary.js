import displayLibrary from "./displayLibrary.js";

export default function filterLibrary(libraryData) {
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