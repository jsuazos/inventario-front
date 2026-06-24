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
      onAddToInventory = null,
      onRemoveWishlist = null,
      onEditWishlist = null,
      onEditInventory = null,
      onRemoveInventory = null,
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
        const discogsId = String(item.ID || item.discogsId || '').trim();
        const discogsReleaseId = discogsId.replace(/^[^0-9]+/, '');
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
        card.className = `col-xxl-2 col-xl-2 col-lg-2 col-md-4 col-sm-6 col-6 h-100`;
        card.innerHTML = `
        <div class="card-with-border rounded-1">
            <div class ="card position-relative overflow-hidden border-0 rounded-1">
            <img src="${imageUrl}" class="" alt="Carátula ${index}">
            <div class="borde-overlay" data-genero="${ generoPrincipal }"></div>
            ${item.Recibido === 'NO' ? '<div class="not-received-badge"><span>NO RECIBIDO</span></div>' : ''}
            <div class="card-img-overlay d-flex flex-column justify-content-end pb-1">
                <div class="position-absolute top-0 start-0 p-3">
                ${discogsReleaseId !== '' ? `<a href="https://www.discogs.com/es/release/${discogsReleaseId}" target="_blank" class="btn btn-dark btn-sm btn-discorgs">Discogs</a>` : '' }
                </div>
                <div class="position-absolute top-0 end-0 d-flex flex-column gap-2 p-3 card-action-group">
                ${wishlistMode && canManageWishlist ? '<button class="btn btn-sm btn-success border-0 btn-wishlist-add card-action-btn" title="Mover al inventario">✓</button>' : ''}
                ${wishlistMode && canManageWishlist ? '<button class="btn btn-sm btn-dark border-0 btn-edit-card card-action-btn" title="Editar wishlist">\n                  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"/><path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"/></svg>\n                </button>' : ''}
                ${wishlistMode && canManageWishlist ? '<button class="btn btn-sm btn-danger btn-wishlist-remove card-action-btn" title="Quitar de wishlist" aria-label="Quitar de wishlist">\n                  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><polyline points="3 6 5 6 21 6"/><path d="M19 6l-1 14a2 2 0 0 1-2 2H8a2 2 0 0 1-2-2L5 6"/><path d="M10 11v6"/><path d="M14 11v6"/><path d="M9 6V4a1 1 0 0 1 1-1h4a1 1 0 0 1 1 1v2"/></svg>\n                </button>' : ''}
                ${showEditButton && !(wishlistMode && canManageWishlist) ? '<button class="btn btn-sm btn-dark border-0 btn-edit-card card-action-btn" title="Editar">\n                  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"/><path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"/></svg>\n                </button>' : ''}
                ${typeof onRemoveInventory === 'function' && !(wishlistMode && canManageWishlist) ? '<button class="btn btn-sm btn-danger btn-inventory-remove card-action-btn" title="Ocultar del inventario" aria-label="Ocultar del inventario">\n                  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><polyline points="3 6 5 6 21 6"/><path d="M19 6l-1 14a2 2 0 0 1-2 2H8a2 2 0 0 1-2-2L5 6"/><path d="M10 11v6"/><path d="M14 11v6"/><path d="M9 6V4a1 1 0 0 1 1-1h4a1 1 0 0 1 1 1v2"/></svg>\n                </button>' : ''}
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

        const addToInventoryButton = card.querySelector('.btn-wishlist-add');
        if (addToInventoryButton && typeof onAddToInventory === 'function') {
          addToInventoryButton.addEventListener('click', async (event) => {
            event.preventDefault();
            event.stopPropagation();

            if (typeof Swal !== 'undefined') {
              const confirmation = await Swal.fire({
                title: 'Mover al inventario',
                text: `Se moverá "${item.Disco}" desde tu wishlist al inventario.`,
                icon: 'question',
                showCancelButton: true,
                confirmButtonText: 'Mover',
                cancelButtonText: 'Cancelar',
                background: '#1a1a1a',
                color: '#fff'
              });

              if (!confirmation.isConfirmed) {
                return;
              }
            }

            addToInventoryButton.disabled = true;
            try {
              await onAddToInventory(item);
            } catch (error) {
              console.error('Error agregando al inventario:', error);
            } finally {
              addToInventoryButton.disabled = false;
            }
          });
        }

        const editButton = card.querySelector('.btn-edit-card');
        if (editButton && typeof onEditWishlist === 'function' && wishlistMode && canManageWishlist) {
          editButton.addEventListener('click', async (event) => {
            event.preventDefault();
            event.stopPropagation();

            editButton.disabled = true;
            try {
              await onEditWishlist(item);
            } catch (error) {
              console.error('Error editando wishlist:', error);
            } finally {
              editButton.disabled = false;
            }
          });
        }

        if (editButton && typeof onEditInventory === 'function' && !wishlistMode) {
          editButton.addEventListener('click', async (event) => {
            event.preventDefault();
            event.stopPropagation();

            editButton.disabled = true;
            try {
              await onEditInventory(item);
            } catch (error) {
              console.error('Error editando inventario:', error);
            } finally {
              editButton.disabled = false;
            }
          });
        }

        const removeInventoryButton = card.querySelector('.btn-inventory-remove');
        if (removeInventoryButton && typeof onRemoveInventory === 'function' && !wishlistMode) {
          removeInventoryButton.addEventListener('click', async (event) => {
            event.preventDefault();
            event.stopPropagation();

            if (typeof Swal !== 'undefined') {
              const confirmation = await Swal.fire({
                title: 'Quitar del inventario',
                text: `"${item.Disco}" dejará de ser visible en el inventario.`,
                icon: 'warning',
                showCancelButton: true,
                confirmButtonText: 'Quitar',
                cancelButtonText: 'Cancelar',
                background: '#1a1a1a',
                color: '#fff'
              });

              if (!confirmation.isConfirmed) {
                return;
              }
            }

            removeInventoryButton.disabled = true;
            try {
              await onRemoveInventory(item);

              if (typeof Swal !== 'undefined') {
                Swal.fire({
                  toast: true,
                  position: 'top-end',
                  icon: 'success',
                  title: 'Ocultado del inventario',
                  showConfirmButton: false,
                  timer: 1800,
                  background: '#1a1a1a',
                  color: '#fff'
                });
              }
            } catch (error) {
              console.error('Error quitando del inventario:', error);
            } finally {
              removeInventoryButton.disabled = false;
            }
          });
        }

        const removeWishlistButton = card.querySelector('.btn-wishlist-remove');
        if (removeWishlistButton && typeof onRemoveWishlist === 'function') {
          removeWishlistButton.addEventListener('click', async (event) => {
            event.preventDefault();
            event.stopPropagation();

            if (typeof Swal !== 'undefined') {
              const confirmation = await Swal.fire({
                title: 'Quitar de wishlist',
                text: `Se eliminará "${item.Disco}" de tu wishlist. Esta acción no se puede deshacer.`,
                icon: 'warning',
                showCancelButton: true,
                confirmButtonText: 'Quitar',
                cancelButtonText: 'Cancelar',
                background: '#1a1a1a',
                color: '#fff'
              });

              if (!confirmation.isConfirmed) {
                return;
              }
            }

            removeWishlistButton.disabled = true;
            try {
              await onRemoveWishlist(item);

              if (typeof Swal !== 'undefined') {
                Swal.fire({
                  toast: true,
                  position: 'top-end',
                  icon: 'success',
                  title: 'Eliminado de tu wishlist',
                  showConfirmButton: false,
                  timer: 1800,
                  background: '#1a1a1a',
                  color: '#fff'
                });
              }
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
