import { toggleLoader, loadAlphabet } from './ui.js';
import aplicarColoresPorGenero from './aplicarColoresPorGenero.js';
import fetchArtistDetails from '../services/artistService.js';

export default async function displayLibrary(items, options = {}) {
    const artistBanner = document.getElementById('artistBanner');
    const grid = document.getElementById('libraryGrid');
    const counter = document.getElementById('resultCount');

    const {
      counterText = null,
      bannerHtml = '',
      fetchArtistBanner = true,
      wishlistMode = false,
      canManageWishlist = false,
      onRemoveWishlist = null,
      showEditButton = true,
    } = options;

    if (!grid || !artistBanner || !counter) {
        console.warn('displayLibrary: elementos del DOM no encontrados');
        return;
    }

    toggleLoader(true);

    if (window.alphabetObserver) {
        window.alphabetObserver.disconnect();
        window.alphabetObserver = null;
    }
    grid.innerHTML = '';
    artistBanner.innerHTML = '';
    counter.textContent = counterText || `Mostrando ${items.length} resultados ${!navigator.onLine ? '(la información puede que no este actualizada ya que no tienes conexión a internet)' : ''}`;

    if (bannerHtml) {
      artistBanner.innerHTML = bannerHtml;
    }

    // si sólo hay un artista, mostrar cabecera con datos del artista
    const uniqueArtists = [...new Set(items.map(i => i.Artista))];
    if (!bannerHtml && fetchArtistBanner && uniqueArtists.length === 1 && navigator.onLine) {
      fetchArtistDetails(uniqueArtists[0]);
    }
    
    items.forEach((item, index) => {
        const tipo = String(item.Tipo || '');
        const genero = String(item.Genero || '');
        const artista = String(item.Artista || '');
        let imageUrl =  item.imgFULL && 
                        item.imgFULL.length > 0 && 
                        item.imgFULL !== 'No matching results' && 
                        item.imgFULL !== '#ERROR!' ? 
                        item.imgFULL : item.img && item.img.length > 10 ? item.img : '';
        // https://e7.pngegg.com/pngimages/615/599/png-clipart-phonograph-record-lp-record-compact-disc-compact-cassette-cd-r-vinyl-group-cdr-album-thumbnail.png

        // Diferencia imagen segun tipo
        if (tipo.toLowerCase() === 'vinilo' && imageUrl === '') {
          imageUrl = 'https://upload.wikimedia.org/wikipedia/commons/thumb/b/b6/12in-Vinyl-LP-Record-Angle.jpg/330px-12in-Vinyl-LP-Record-Angle.jpg';
        } else if (tipo.toLowerCase() === 'cd' && !imageUrl) {
          imageUrl = 'https://encrypted-tbn0.gstatic.com/images?q=tbn:ANd9GcRMvn4Yy63ntOeR9vSFVLaa8yn0Nzv_kz1p1Q&s';
        } else if (!imageUrl) {
          imageUrl = 'https://i.pinimg.com/originals/62/e6/1a/62e61ad9aedd381bb24f768c09d416f6.jpg';
        }


        const firstLetterPrev = grid.querySelector(`.letra-${artista.toUpperCase().charAt(0)}`);
        const firstLetter = artista.toUpperCase().charAt(0) || '#';
        let letterHeader = '';

        const divLetra = document.createElement('div');
        divLetra.id = `letra-${firstLetter}`;
        divLetra.className = `letra-${firstLetter} text-uppercase text-left fw-bold fs-5 mt-3`;

        const card = document.createElement('div');
        const generoPrincipal = genero.toLowerCase().split(',')[0] || 'sin-genero';
        const discogsId = item.ID || item.discogsId || '';
        card.className = `col-xxl-2 col-xl-2 col-lg-2 col-md-4 col-sm-6 col-6 h-100`;
        card.innerHTML = `
        <div class="card-with-border rounded-1">
            <div class ="card position-relative overflow-hidden border-0 rounded-1">
            <img src="${imageUrl}" class="" alt="Carátula ${index}">
            <div class="borde-overlay" data-genero="${ generoPrincipal }"></div>
            ${item.Recibido === 'NO' ? '<div class="not-received-badge"><span>NO RECIBIDO</span></div>' : ''}
            <div class="card-img-overlay d-flex flex-column justify-content-end pb-1">
                <div class="position-absolute top-0 start-0 d-flex gap-2 p-3">
                ${discogsId !== '' ? `<a href="https://www.discogs.com/es/release/${String(discogsId).replace(/^D/, '')}" target="_blank" class="btn btn-dark btn-sm btn-discorgs">Discogs</a>` : '' }
                ${wishlistMode && canManageWishlist ? '<button class="btn btn-sm btn-dark btn-wishlist-remove" title="Quitar de mi wishlist">×</button>' : ''}
                ${showEditButton ? '<button class="btn btn-sm btn-outline-info border-0 btn-edit-card" title="Editar">\n                  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"/><path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"/></svg>\n                </button>' : ''}
                </div>
                <ul class="list-unstyled text-white">
                 <li class="fw-bold text-hide">${ artista }</li>
                 <li class="text-hide"><small>${item.Disco}</small></li>
                 <li class="text-hide"><small>${item.Año}</small></li>
                 <li><span class="badge badge-type mt-1">${tipo || 'Wishlist'}</span></li>
                 </ul>
            </div>
          </div>
          <div class="side-label px-1 py-3" ${item.Recibido === 'NO' ? 'style="z-index: -1;"' : ''}>${ genero.toUpperCase().substring(0, 15) || 'WISHLIST' }</div>
        </div>
        `;

        const removeWishlistButton = card.querySelector('.btn-wishlist-remove');
        if (removeWishlistButton && typeof onRemoveWishlist === 'function') {
          removeWishlistButton.addEventListener('click', async (event) => {
            event.preventDefault();
            event.stopPropagation();

            removeWishlistButton.disabled = true;
            try {
              await onRemoveWishlist(item);
            } catch (error) {
              console.error('Error actualizando wishlist:', error);
            } finally {
              removeWishlistButton.disabled = false;
            }
          });
        }

        grid.appendChild(card);

        if (!firstLetterPrev) {
            card.before(divLetra);
        }
    });
    aplicarColoresPorGenero();
    loadAlphabet();
    toggleLoader(false);
}
