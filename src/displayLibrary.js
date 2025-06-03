import toggleLoader from "./toggleLoader.js";
import aplicarColoresPorGenero from "./aplicarColoresPorGenero.js";
import fetchArtistDetails from "./fetchArtistDetails.js";

export default async function displayLibrary(items) {
    toggleLoader(true);
    const artistBanner = document.getElementById('artistBanner');
    const grid = document.getElementById('libraryGrid');
    const counter = document.getElementById('resultCount');
    grid.innerHTML = '';
    artistBanner.innerHTML = '';
    counter.textContent = `Mostrando ${items.length} resultados ${!navigator.onLine ? '(la información puede que no este actualizada ya que no tienes conexión a internet)' : ''}`;

    // si sólo hay un artista, mostrar cabecera con datos del artista
    const artistFilter = filterArtist.value;
    if (artistFilter) {
      if (navigator.onLine) {
        await fetchArtistDetails(artistFilter);
      }
      
    }
    
    items.forEach((item, index) => {
        const imageUrl =  item.imgFULL && 
                        item.imgFULL.length > 0 && 
                        item.imgFULL !== 'No matching results' && 
                        item.imgFULL !== '#ERROR!' ? 
                        item.imgFULL : item.img && item.img.length > 10 ? item.img : 'https://via.placeholder.com/80x80?text=🎵';

        
        const firstLetterPrev = grid.querySelector(`.letra-${item.Artista.toUpperCase().charAt(0)}`);
        const firstLetter = item.Artista.toUpperCase().charAt(0);
        let letterHeader = '';

        const divLetra = document.createElement('div');
        divLetra.id = `letra-${firstLetter}`;
        divLetra.className = `letra-${firstLetter} text-uppercase text-left fw-bold fs-5 mt-3`;

        const card = document.createElement('div');
        const generoPrincipal = item.Genero.toLowerCase().split(',')[0];
        card.className = `col-xxl-2 col-xl-2 col-lg-2 col-md-4 col-sm-6 col-6 h-100`;
        card.innerHTML = `
        <div class="card-with-border rounded-1">
            <div class ="card position-relative overflow-hidden border-0 rounded-1">
            <img src="${imageUrl}" class="" alt="Carátula ${index}">
            <div class="borde-overlay" data-genero="${ generoPrincipal }"></div>
            <div class="card-img-overlay d-flex flex-column justify-content-end pb-1">
                <div class="position-absolute top-0 start-0 d-flex gap-2 p-3">
                ${item.ID !== '' ? `<a href="https://www.discogs.com/es/release/${ item.ID.slice(1)}" target="_blank" class="btn btn-dark btn-sm btn-discorgs">Discogs</a>` : '' }"
                </div>
                <ul class="list-unstyled text-white">
                <li class="fw-bold text-hide">${ item.Artista }</li>
                <li class="text-hide"><small>${item.Disco}</small></li>
                <li class="text-hide"><small>${item.Año}</small></li>
                <li><span class="badge badge-type mt-1">${item.Tipo}</span></li>
                </ul>
            </div>
          </div>
          <div class="side-label px-1 py-3">${ item.Genero.toUpperCase().substring(0, 15) }</div>
          <!--<img class="side-img" src="https://flagcdn.com/${item.OrigenISO.toLowerCase()}.svg" alt="Bandera de ${item.Origen}" title="${item.Origen}" width="25"/>-->
        </div>
        `;
        grid.appendChild(card);

        if (!firstLetterPrev) {
            card.before(divLetra);
        }
    });
    aplicarColoresPorGenero();
    toggleLoader(false);
}