import { toggleLoader } from './ui.js';
import aplicarColoresPorGenero from './aplicarColoresPorGenero.js';
import fetchArtistDetails from '../services/artistService.js';

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
        let imageUrl =  item.imgFULL && 
                        item.imgFULL.length > 0 && 
                        item.imgFULL !== 'No matching results' && 
                        item.imgFULL !== '#ERROR!' ? 
                        item.imgFULL : item.img && item.img.length > 10 ? item.img : '';
        // https://e7.pngegg.com/pngimages/615/599/png-clipart-phonograph-record-lp-record-compact-disc-compact-cassette-cd-r-vinyl-group-cdr-album-thumbnail.png

        // Diferencia imagen segun tipo
        if (item.Tipo.toLowerCase() === 'vinilo' && imageUrl === '') {
          imageUrl = 'https://upload.wikimedia.org/wikipedia/commons/thumb/b/b6/12in-Vinyl-LP-Record-Angle.jpg/330px-12in-Vinyl-LP-Record-Angle.jpg';
        } else if (item.Tipo.toLowerCase() === 'cd' && !imageUrl) {
          imageUrl = 'https://encrypted-tbn0.gstatic.com/images?q=tbn:ANd9GcRMvn4Yy63ntOeR9vSFVLaa8yn0Nzv_kz1p1Q&s';
        } else if (!imageUrl) {
          imageUrl = 'https://i.pinimg.com/originals/62/e6/1a/62e61ad9aedd381bb24f768c09d416f6.jpg';
        }


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
            ${item.Recibido === 'NO' ? '<div class="not-received-badge"><span>NO RECIBIDO</span></div>' : ''}
            <div class="card-img-overlay d-flex flex-column justify-content-end pb-1">
                <div class="position-absolute top-0 start-0 d-flex gap-2 p-3">
                ${item.ID !== '' ? `<a href="https://www.discogs.com/es/release/${ item.ID.slice(1)}" target="_blank" class="btn btn-dark btn-sm btn-discorgs">Discogs</a>` : '' }
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
