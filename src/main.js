// main.js
import './components/Navbar.js';
import './components/Aside.js';
import './components/Filters.js';
import './components/Loader.js';
import './components/LoginModal.js';
import './components/Alphabet.js';
import './components/Footer.js';

import { loadLibrary, checkForUpdatesInBackground } from "./services/libraryService.js";
import { filterLibrary } from "./utils/libraryFilters.js";
import { closeSidebar, toggleSidebar } from "./utils/ui.js";
// import { clearFilters } from "./utils/libraryFilters.js";
import { clearLibrary, modalLogin, updateLoginUI } from "./utils/modals.js";
import { authStore } from "./state/authStore.js";
import displayLibrary from "./utils/libraryDisplay.js";
import { libraryStore } from "./state/libraryStore.js";
import { wishlistStore } from './state/wishlistStore.js';
import { errorHandler } from "./services/errorHandler.js";
import { setupOnlineOfflineHandlers } from './services/dbService.js';
import { loadArtistCatalog } from './services/artistCatalogService.js';
import { subscribe, isSubscribed, isSupported, syncExistingSubscription } from './services/pushService.js';
import { getPublicWishlist, getWishlistUsers } from './services/wishlistService.js';
import { enrichWishlistItemWithDiscogs } from './services/discogsService.js';
import { addToInventory, markInventoryReceived, removeFromInventory, updateInventory } from './services/inventoryService.js';
import { splitTypeTags } from './utils/typeTags.js';

let backgroundCheckTimeout = null;
let lastBackgroundCheckAt = 0;
let publicWishlistView = {
  user: '',
  items: [],
};
let publicWishlistUsers = [];
let globalActionMenu = null;
let wishlistStatusFilter = 'all';
const WISHLIST_STATUS_OPTIONS = [
  { value: 'wishlist', label: 'Wishlist' },
  { value: 'pedido', label: 'Pedido' },
  { value: 'comprado', label: 'Comprado' },
];

function normalizeWishlistStatus(status) {
  const normalized = String(status || 'wishlist').trim().toLowerCase();
  return WISHLIST_STATUS_OPTIONS.some(option => option.value === normalized) ? normalized : 'wishlist';
}

function getWishlistStatusLabel(status) {
  return WISHLIST_STATUS_OPTIONS.find(option => option.value === status)?.label || 'Wishlist';
}

function filterWishlistItemsByStatus(items) {
  if (wishlistStatusFilter === 'all') {
    return items;
  }

  return items.filter(item => normalizeWishlistStatus(item.status) === wishlistStatusFilter);
}

function syncGlobalActionDock() {
  const wrapper = document.getElementById('global-action-menu');
  const slot = document.getElementById('global-action-subscribe-slot');
  if (!wrapper || !slot) {
    return;
  }

  const hasSubscribeButton = !!slot.querySelector('#push-subscribe-btn');
  wrapper.classList.toggle('has-subscribe-button', hasSubscribeButton);
}

window.addEventListener("DOMContentLoaded", async () => {
  // Inicializar el store desde localStorage/IndexedDB
  await libraryStore.init();

  // Suscribirse a cambios del store para refrescar la vista
  // Registrado temprano para capturar todas las notificaciones
  libraryStore.subscribe((state) => {
    if (!state.isLoading) {
      renderCurrentView().catch(() => {});
    }
  });
  wishlistStore.subscribe(() => {
    renderCurrentView().catch(() => {});
  });

  // Restaurar sesión si existe token válido
  authStore.init();
  updateLoginUI();

  // Sincronizar clase auth-editor en body con el estado de login
  const toggleAuthEditor = ({ isLoggedIn }) => {
    document.body.classList.toggle('auth-editor', isLoggedIn);
  };
  toggleAuthEditor({ isLoggedIn: authStore.isLoggedIn });
  authStore.subscribe(async ({ isLoggedIn }) => {
    toggleAuthEditor({ isLoggedIn });

    if (isLoggedIn) {
      try {
        await wishlistStore.loadMine();
      } catch (error) {
        console.error('No se pudo cargar la wishlist del usuario:', error);
      }
    } else {
      wishlistStore.clear();
      if (parseRoute().mode === 'wishlist' && parseRoute().user === 'me') {
        window.location.hash = '#biblioteca';
        return;
      }
    }

    renderCurrentView().catch(() => {});
  });

  if (authStore.isLoggedIn) {
    try {
      await wishlistStore.loadMine();
    } catch (error) {
      console.error('No se pudo cargar la wishlist inicial:', error);
    }
  }
  
  // Configurar manejo de conexión
  setupOnlineOfflineHandlers();
  
  let libraryData = libraryStore.getAllData();

  libraryData = await loadLibrary(libraryData);

  // Cargar catálogo de artistas desde la API
  if (navigator.onLine) {
    loadArtistCatalog();
  }

  // El filtro en vivo del input se maneja desde Navbar.js vía libraryStore.setSearchInput()

  // Event listeners para el filtro de Recibido
  document.querySelectorAll('input[name="filterRecibido"]').forEach(radio => {
    radio.addEventListener("change", filterLibrary);
  });

  toggleSidebar();
  clearLibrary();

  modalLogin();
  setupGlobalActionMenu();

  window.addEventListener('hashchange', () => {
    closeSidebar();
    syncRouteView().catch(() => {});
  });

  await syncRouteView();

  setupBackgroundRefresh();

  if ("serviceWorker" in navigator) {
    try {
      navigator.serviceWorker.register("./service-worker.js");
    } catch (error) {
      errorHandler.handleNetworkError(error, 'serviceWorkerRegistration');
    }
  }

  if (navigator.serviceWorker && navigator.serviceWorker.controller) {
    navigator.serviceWorker.controller.postMessage("GET_CACHE_VERSION");

    navigator.serviceWorker.addEventListener("message", (event) => {
      if (!event.data?.cacheVersion) {
        return;
      }

      const version = event.data.cacheVersion;
      console.info(`Versión del caché: ${version}`);
      document.getElementById(
        "cache-version"
      ).textContent = `Versión: ${version}`;
    });
  }

  // Push notifications: adaptado para iOS (requiere Home Screen + user gesture)
  await setupPushNotifications();
});

function isIOS() {
  return /iphone|ipad|ipod/i.test(navigator.userAgent);
}

function triggerBackgroundRefresh(delay = 0) {
  const currentData = libraryStore.getAllData();
  const now = Date.now();

  if (!navigator.onLine || !currentData || currentData.length === 0) {
    return;
  }

  if (now - lastBackgroundCheckAt < 30000) {
    return;
  }

  clearTimeout(backgroundCheckTimeout);
  backgroundCheckTimeout = setTimeout(() => {
    lastBackgroundCheckAt = Date.now();
    checkForUpdatesInBackground();
  }, delay);
}

function setupBackgroundRefresh() {
  // Carga inicial
  triggerBackgroundRefresh(3000);

  // Cuando la app vuelve al frente (incluye abrir desde notificación)
  window.addEventListener('focus', () => {
    triggerBackgroundRefresh(1000);
  });

  window.addEventListener('pageshow', () => {
    triggerBackgroundRefresh(1000);
  });

  document.addEventListener('visibilitychange', () => {
    if (document.visibilityState === 'visible') {
      triggerBackgroundRefresh(1000);
    }
  });
}

function isSameInventoryItem(left = {}, right = {}) {
  if (left.Orden && right.Orden) {
    return String(left.Orden) === String(right.Orden);
  }

  return String(left.ID || '') === String(right.ID || '') &&
    String(left.Artista || '') === String(right.Artista || '') &&
    String(left.Disco || '') === String(right.Disco || '') &&
    String(left.Año || '') === String(right.Año || '') &&
    String(left.Recibido || '') === String(right.Recibido || '');
}

function upsertInventoryItemLocally(originalItem, updatedItem, { removeIfHidden = false, addIfMissing = false } = {}) {
  const currentData = libraryStore.getAllData();
  const nextData = [...currentData];
  const index = nextData.findIndex(item => isSameInventoryItem(item, originalItem));

  if (removeIfHidden && updatedItem?.Visible === 'NO') {
    if (index !== -1) {
      nextData.splice(index, 1);
    }
    libraryStore.loadData(nextData);
    return;
  }

  if (index !== -1) {
    nextData[index] = { ...nextData[index], ...updatedItem };
  } else if (addIfMissing && updatedItem?.Visible !== 'NO') {
    nextData.unshift(updatedItem);
  }

  libraryStore.loadData(nextData);
}

async function setupPushNotifications() {
  if (!isSupported()) return;
  if (Notification.permission === 'denied') return;

  // Verificar suscripción real (no solo localStorage)
  if (isSubscribed()) {
    const registration = await navigator.serviceWorker.ready;
    const sub = await registration.pushManager.getSubscription();
    if (sub) {
      await syncExistingSubscription();
      return;
    }
    // Suscripción inválida, limpiar flag para mostrar el botón
    localStorage.removeItem('push-subscribed');
  }

  if (isIOS() && !window.navigator.standalone) {
    showInstallBanner();
    return;
  }

  showSubscribeBell();
}

function parseRoute() {
  const hash = window.location.hash.replace(/^#/, '').trim();

  if (!hash || hash === 'biblioteca') {
    return { mode: 'library' };
  }

  if (hash === 'wishlists') {
    return { mode: 'wishlists' };
  }

  const match = hash.match(/^wishlist\/(.+)$/i);
  if (match) {
    return { mode: 'wishlist', user: decodeURIComponent(match[1]) };
  }

  return { mode: 'library' };
}

function toggleFiltersVisibility(isVisible) {
  const filters = document.querySelector('app-filters');
  if (filters) {
    filters.style.display = isVisible ? '' : 'none';
  }
}

function buildWishlistBanner(label, isOwnView) {
  const routeUser = isOwnView ? 'me' : encodeURIComponent(label);
  const filterButtons = [
    { value: 'all', label: 'Todos' },
    ...WISHLIST_STATUS_OPTIONS,
  ].map(option => `
    <button type="button" class="wishlist-filter-chip ${wishlistStatusFilter === option.value ? 'is-active' : ''}" data-status-filter="${option.value}">
      ${option.label}
    </button>
  `).join('');

  return `
    <div class="d-flex flex-column flex-md-row justify-content-between align-items-md-center gap-2 mb-3 p-3 rounded-3" style="background: rgba(255,255,255,0.06); border: 1px solid rgba(255,255,255,0.08);">
      <div>
        <small class="text-info text-uppercase">Wishlist pública</small>
        <h4 class="text-white mb-1">Wishlist de ${label}</h4>
        <p class="text-secondary mb-0">Disponible públicamente dentro de la app.</p>
        <div class="wishlist-filter-chip-row mt-3">${filterButtons}</div>
      </div>
      <div class="d-flex gap-2 align-items-center">
        <a href="#biblioteca" class="btn btn-outline-light btn-sm">Volver a biblioteca</a>
        <button id="copy-wishlist-link" class="btn btn-info btn-sm text-dark" data-route="#wishlist/${routeUser}">Copiar enlace</button>
      </div>
    </div>
  `;
}

function buildWishlistsBanner(usersCount) {
  return `
    <div class="d-flex flex-column flex-md-row justify-content-between align-items-md-center gap-2 mb-3 p-3 rounded-3" style="background: rgba(255,255,255,0.06); border: 1px solid rgba(255,255,255,0.08);">
      <div>
        <small class="text-info text-uppercase">Comunidad</small>
        <h4 class="text-white mb-1">Wishlists públicas</h4>
        <p class="text-secondary mb-0">Explora las listas públicas disponibles dentro de la app.</p>
      </div>
      <div class="text-secondary small">${usersCount} usuario${usersCount === 1 ? '' : 's'} con wishlist pública</div>
    </div>
  `;
}

function attachWishlistBannerActions() {
  const copyButton = document.getElementById('copy-wishlist-link');

  document.querySelectorAll('[data-status-filter]').forEach(button => {
    button.onclick = async () => {
      wishlistStatusFilter = button.dataset.statusFilter || 'all';
      await renderCurrentView();
    };
  });

  if (!copyButton) {
    return;
  }

  copyButton.onclick = async () => {
    const route = copyButton.dataset.route || '#biblioteca';
    const url = `${window.location.origin}${window.location.pathname}${route}`;

    try {
      await navigator.clipboard.writeText(url);
      if (typeof Swal !== 'undefined') {
        Swal.fire({
          toast: true,
          position: 'top-end',
          icon: 'success',
          title: 'Enlace copiado',
          showConfirmButton: false,
          timer: 1800,
          background: '#1a1a1a',
          color: '#fff'
        });
      }
    } catch (error) {
      console.error('No se pudo copiar el enlace de wishlist:', error);
    }
  };
}

async function openWishlistFormModal(initialData = {}, { title = 'Agregar a mi wishlist', confirmText = 'Guardar' } = {}) {
  if (typeof Swal === 'undefined') {
    return null;
  }

  const availableTypes = [...new Set(
    libraryStore.getAllData().flatMap(item => splitTypeTags(item.Tipo))
  )].sort((a, b) => a.localeCompare(b));

  const defaultTypes = ['Vinilo', 'CD', 'Cassette', 'DVD'];
  const wishlistTypes = [...new Set([...defaultTypes, ...availableTypes])];

  const tipoOptions = wishlistTypes.map(tipo => {
    return `<option value="${tipo}">${tipo}</option>`;
  }).join('');
  const statusOptions = WISHLIST_STATUS_OPTIONS.map(status => {
    const selected = (initialData.status || 'wishlist') === status.value ? 'selected' : '';
    return `<option value="${status.value}" ${selected}>${status.label}</option>`;
  }).join('');

  return Swal.fire({
    title,
    background: '#1a1a1a',
    color: '#fff',
    confirmButtonText: confirmText,
    showCancelButton: true,
    cancelButtonText: 'Cancelar',
    focusConfirm: false,
    customClass: {
      popup: 'wishlist-swal-popup',
      htmlContainer: 'wishlist-swal-html',
    },
    html: `
      <div class="wishlist-form-grid">
        <input id="wishlist-artista" class="swal2-input" placeholder="Artista" autocomplete="off" value="${initialData.Artista || ''}">
        <input id="wishlist-disco" class="swal2-input" placeholder="Disco" autocomplete="off" value="${initialData.Disco || ''}">
        <div class="wishlist-form-row wishlist-form-row-2">
          <input id="wishlist-anio" class="swal2-input" placeholder="Año" autocomplete="off" value="${initialData.Año || ''}">
          <input id="wishlist-discogs" class="swal2-input" placeholder="ID Discogs" autocomplete="off" value="${initialData.discogsId || initialData.ID || ''}">
        </div>
        <select id="wishlist-tipo" class="swal2-select wishlist-type-select">
          <option value="">Selecciona un tipo</option>
          ${tipoOptions}
        </select>
        <select id="wishlist-status" class="swal2-select wishlist-type-select">
          ${statusOptions}
        </select>
        <textarea id="wishlist-notes" class="swal2-textarea" placeholder="Notas (opcional)">${initialData.notes || ''}</textarea>
      </div>
    `,
    didOpen: () => {
      const discogsInput = document.getElementById('wishlist-discogs');
      const tipoSelect = document.getElementById('wishlist-tipo');
      const statusSelect = document.getElementById('wishlist-status');

      if (tipoSelect && initialData.Tipo) {
        tipoSelect.value = initialData.Tipo;
      }

      if (statusSelect) {
        statusSelect.value = initialData.status || 'wishlist';
      }

      if (discogsInput) {
        discogsInput.value = discogsInput.value.replace(/\D+/g, '');
        discogsInput.addEventListener('input', () => {
          discogsInput.value = discogsInput.value.replace(/\D+/g, '');
        });
      }
    },
    preConfirm: () => {
      const Artista = document.getElementById('wishlist-artista')?.value.trim();
      const Disco = document.getElementById('wishlist-disco')?.value.trim();
      const Año = document.getElementById('wishlist-anio')?.value.trim();
      const Tipo = document.getElementById('wishlist-tipo')?.value.trim();
      const status = document.getElementById('wishlist-status')?.value.trim() || 'wishlist';
      const discogsId = document.getElementById('wishlist-discogs')?.value.replace(/\D+/g, '').trim();
      const notes = document.getElementById('wishlist-notes')?.value.trim();

      if (!Artista || !Disco) {
        Swal.showValidationMessage('Artista y disco son obligatorios');
        return false;
      }

      return {
        rowId: initialData.rowId || '',
        Artista,
        Disco,
        Año,
        Tipo,
        discogsId,
        status,
        notes,
        Genero: '',
        img: '',
        imgFULL: '',
        Recibido: 'NO',
      };
    }
  });
}

async function openInventoryFormModal(initialData = {}, { title, confirmText = 'Guardar', recibidoDefault = 'SI' } = {}) {
  if (typeof Swal === 'undefined') {
    return null;
  }

  const availableTypes = [...new Set(
    libraryStore.getAllData().flatMap(item => splitTypeTags(item.Tipo))
  )].sort((a, b) => a.localeCompare(b));

  const defaultTypes = ['Vinilo', 'CD', 'Cassette', 'DVD'];
  const wishlistTypes = [...new Set([...defaultTypes, ...availableTypes])];

  const tipoOptions = wishlistTypes.map(tipo => {
    return `<option value="${tipo}">${tipo}</option>`;
  }).join('');

  return Swal.fire({
    title: title || (recibidoDefault === 'NO' ? 'Agregar al inventario (No recibido)' : 'Agregar al inventario'),
    background: '#1a1a1a',
    color: '#fff',
    confirmButtonText: confirmText,
    showCancelButton: true,
    cancelButtonText: 'Cancelar',
    focusConfirm: false,
    customClass: {
      popup: 'wishlist-swal-popup',
      htmlContainer: 'wishlist-swal-html',
    },
    html: `
      <div class="wishlist-form-grid">
        <input id="wishlist-artista" class="swal2-input" placeholder="Artista" autocomplete="off" value="${initialData.Artista || ''}">
        <input id="wishlist-disco" class="swal2-input" placeholder="Disco" autocomplete="off" value="${initialData.Disco || ''}">
        <div class="wishlist-form-row wishlist-form-row-2">
          <input id="wishlist-anio" class="swal2-input" placeholder="Año" autocomplete="off" value="${initialData.Año || ''}">
          <input id="wishlist-discogs" class="swal2-input" placeholder="ID Discogs" autocomplete="off" value="${initialData.discogsId || initialData.ID || ''}">
        </div>
        <select id="wishlist-tipo" class="swal2-select wishlist-type-select">
          <option value="">Selecciona un tipo</option>
          ${tipoOptions}
        </select>
      </div>
    `,
    didOpen: () => {
      const discogsInput = document.getElementById('wishlist-discogs');
      const tipoSelect = document.getElementById('wishlist-tipo');

      if (tipoSelect && initialData.Tipo) {
        tipoSelect.value = initialData.Tipo;
      }

      if (discogsInput) {
        discogsInput.value = discogsInput.value.replace(/\D+/g, '');
        discogsInput.addEventListener('input', () => {
          discogsInput.value = discogsInput.value.replace(/\D+/g, '');
        });
      }
    },
    preConfirm: () => {
      const Artista = document.getElementById('wishlist-artista')?.value.trim();
      const Disco = document.getElementById('wishlist-disco')?.value.trim();
      const Año = document.getElementById('wishlist-anio')?.value.trim();
      const Tipo = document.getElementById('wishlist-tipo')?.value.trim();
      const discogsId = document.getElementById('wishlist-discogs')?.value.replace(/\D+/g, '').trim();
      if (!Artista || !Disco) {
        Swal.showValidationMessage('Artista y disco son obligatorios');
        return false;
      }

      return {
        ...initialData,
        Artista,
        Disco,
        Año,
        Tipo,
        discogsId,
        Genero: '',
        img: '',
        imgFULL: '',
        Recibido: initialData.Recibido || recibidoDefault,
      };
    }
  });
}

async function openInventoryAddModal(recibido = 'SI') {
  const result = await openInventoryFormModal({}, { recibidoDefault: recibido });

  if (!result?.isConfirmed || !result.value) {
    return;
  }

  try {
    const enrichedItem = await enrichWishlistItemWithDiscogs(result.value);
    const savedItem = await addToInventory(enrichedItem);
    upsertInventoryItemLocally(savedItem, savedItem, { addIfMissing: true });

    if (typeof Swal !== 'undefined') {
      Swal.fire({
        toast: true,
        position: 'top-end',
        icon: 'success',
        title: recibido === 'NO' ? 'Agregado al inventario como no recibido' : 'Agregado al inventario',
        showConfirmButton: false,
        timer: 1800,
        background: '#1a1a1a',
        color: '#fff'
      });
    }
  } catch (error) {
    console.error('No se pudo agregar al inventario:', error);
    if (typeof Swal !== 'undefined') {
      Swal.fire({
        icon: 'error',
        title: 'No se pudo guardar',
        text: 'Intenta nuevamente en unos segundos.',
        background: '#1a1a1a',
        color: '#fff'
      });
    }
  }
}

async function openInventoryEditModal(item) {
  const result = await openInventoryFormModal(item, {
    title: 'Editar inventario',
    confirmText: 'Guardar cambios',
    recibidoDefault: item.Recibido || 'SI',
  });

  if (!result?.isConfirmed || !result.value) {
    return;
  }

  try {
    const enrichedItem = await enrichWishlistItemWithDiscogs(result.value);
    const updatedItem = await updateInventory(item, enrichedItem);
    upsertInventoryItemLocally(item, updatedItem);

    if (typeof Swal !== 'undefined') {
      Swal.fire({
        toast: true,
        position: 'top-end',
        icon: 'success',
        title: 'Inventario actualizado',
        showConfirmButton: false,
        timer: 1800,
        background: '#1a1a1a',
        color: '#fff'
      });
    }
  } catch (error) {
    console.error('No se pudo editar el inventario:', error);
    if (typeof Swal !== 'undefined') {
      Swal.fire({
        icon: 'error',
        title: 'No se pudo guardar',
        text: 'Intenta nuevamente en unos segundos.',
        background: '#1a1a1a',
        color: '#fff'
      });
    }
  }
}

async function openWishlistAddModal() {
  const result = await openWishlistFormModal();

  if (!result.isConfirmed || !result.value) {
    return;
  }

      try {
        const enrichedItem = await enrichWishlistItemWithDiscogs(result.value);
        await wishlistStore.add(enrichedItem);
        await syncRouteView();
        Swal.fire({
          toast: true,
          position: 'top-end',
      icon: 'success',
      title: 'Disco agregado a tu wishlist',
      showConfirmButton: false,
      timer: 1800,
      background: '#1a1a1a',
      color: '#fff'
    });
  } catch (error) {
    console.error('No se pudo agregar a la wishlist:', error);
    Swal.fire({
      icon: 'error',
      title: 'No se pudo guardar',
      text: 'Intenta nuevamente en unos segundos.',
      background: '#1a1a1a',
      color: '#fff'
    });
  }
}

async function openWishlistEditModal(item) {
  const result = await openWishlistFormModal(item, {
    title: 'Editar wishlist',
    confirmText: 'Guardar cambios',
  });

  if (!result?.isConfirmed || !result.value) {
    return;
  }

  try {
    const enrichedItem = await enrichWishlistItemWithDiscogs(result.value);
    await wishlistStore.update(item.rowId, enrichedItem);
    await syncRouteView();
    Swal.fire({
      toast: true,
      position: 'top-end',
      icon: 'success',
      title: 'Wishlist actualizada',
      showConfirmButton: false,
      timer: 1800,
      background: '#1a1a1a',
      color: '#fff'
    });
  } catch (error) {
    console.error('No se pudo editar la wishlist:', error);
    Swal.fire({
      icon: 'error',
      title: 'No se pudo guardar',
      text: 'Intenta nuevamente en unos segundos.',
      background: '#1a1a1a',
      color: '#fff'
    });
  }
}

function setupGlobalActionMenu() {
  if (globalActionMenu) {
    return;
  }

  const wrapper = document.createElement('div');
  wrapper.id = 'global-action-menu';
  wrapper.className = 'global-action-menu d-none';
  wrapper.innerHTML = `
    <div class="global-action-items">
      <button type="button" class="global-action-item" data-action="recibido">Recibido</button>
      <button type="button" class="global-action-item" data-action="no-recibido">No Recibido</button>
      <button type="button" class="global-action-item" data-action="wishlist">Wishlist</button>
    </div>
    <div class="global-action-dock">
      <div id="global-action-subscribe-slot" class="global-action-subscribe-slot"></div>
      <button type="button" id="global-action-toggle" class="global-action-toggle" aria-expanded="false" aria-label="Abrir acciones rápidas">+</button>
    </div>
  `;
  document.body.appendChild(wrapper);
  globalActionMenu = wrapper;
  syncGlobalActionDock();

  const toggleButton = wrapper.querySelector('#global-action-toggle');
  const toggleMenu = (forceOpen) => {
    const isOpen = typeof forceOpen === 'boolean'
      ? forceOpen
      : !wrapper.classList.contains('is-open');

    wrapper.classList.toggle('is-open', isOpen);
    toggleButton?.setAttribute('aria-expanded', String(isOpen));
  };

  toggleButton?.addEventListener('click', (event) => {
    event.preventDefault();
    toggleMenu();
  });

  wrapper.querySelectorAll('.global-action-item').forEach(button => {
    button.addEventListener('click', async () => {
      const action = button.dataset.action;
      toggleMenu(false);

      if (action === 'wishlist') {
        await openWishlistAddModal();
        return;
      }

      if (action === 'recibido') {
        await openInventoryAddModal('SI');
        return;
      }

      if (action === 'no-recibido') {
        await openInventoryAddModal('NO');
        return;
      }

      if (typeof Swal !== 'undefined') {
        Swal.fire({
          icon: 'info',
          title: 'Próximamente',
          text: `La opción "${button.textContent}" estará disponible en una siguiente iteración.`,
          background: '#1a1a1a',
          color: '#fff'
        });
      }
    });
  });

  document.addEventListener('click', (event) => {
    if (!wrapper.contains(event.target)) {
      toggleMenu(false);
    }
  });

  authStore.subscribe(({ isLoggedIn }) => {
    wrapper.classList.toggle('d-none', !isLoggedIn);
    if (!isLoggedIn) {
      toggleMenu(false);
    }
  });

  wrapper.classList.toggle('d-none', !authStore.isLoggedIn);
}

async function syncRouteView() {
  const route = parseRoute();

  if (route.mode === 'wishlist') {
    toggleFiltersVisibility(false);

    if (route.user === 'me') {
      if (!authStore.isLoggedIn) {
        window.location.hash = '#biblioteca';
        return;
      }

      publicWishlistView = {
        user: authStore.user,
        items: wishlistStore.getItems(),
      };
    } else {
      publicWishlistView = {
        user: route.user,
        items: await getPublicWishlist(route.user),
      };
    }
  } else if (route.mode === 'wishlists') {
    toggleFiltersVisibility(false);
    wishlistStatusFilter = 'all';
    publicWishlistUsers = await getWishlistUsers();
  } else {
    toggleFiltersVisibility(true);
    wishlistStatusFilter = 'all';
  }

  await renderCurrentView();
}

async function renderCurrentView() {
  const route = parseRoute();
  const artistBanner = document.getElementById('artistBanner');
  const grid = document.getElementById('libraryGrid');
  const counter = document.getElementById('resultCount');

  if (route.mode === 'wishlist') {
    const isOwnView = route.user === 'me';
    const label = isOwnView ? (authStore.user || 'Mi usuario') : publicWishlistView.user || route.user;
    const sourceItems = isOwnView ? wishlistStore.getItems() : publicWishlistView.items;
    const items = filterWishlistItemsByStatus(sourceItems);
    const filterLabel = wishlistStatusFilter === 'all' ? 'Todos' : getWishlistStatusLabel(wishlistStatusFilter);

    await displayLibrary(items, {
      counterText: `Wishlist de ${label} · ${filterLabel} · ${items.length} item${items.length === 1 ? '' : 's'}`,
      bannerHtml: buildWishlistBanner(label, isOwnView),
      fetchArtistBanner: false,
      wishlistMode: true,
      canManageWishlist: isOwnView,
      onAddToInventory: async (item) => {
        const enrichedItem = await enrichWishlistItemWithDiscogs({
          ...item,
          Recibido: 'SI',
        });

        const savedItem = await addToInventory(enrichedItem);
        await wishlistStore.remove(item.rowId);
        upsertInventoryItemLocally(savedItem, savedItem, { addIfMissing: true });

        if (typeof Swal !== 'undefined') {
          Swal.fire({
            toast: true,
            position: 'top-end',
            icon: 'success',
            title: 'Agregado al inventario',
            showConfirmButton: false,
            timer: 1800,
            background: '#1a1a1a',
            color: '#fff'
          });
        }
      },
      onEditWishlist: async (item) => {
        await openWishlistEditModal(item);
      },
      onRemoveWishlist: async (item) => {
        await wishlistStore.remove(item.rowId);
      },
    });
    attachWishlistBannerActions();
    return;
  }

  if (route.mode === 'wishlists') {
    if (!artistBanner || !grid || !counter) {
      return;
    }

    counter.textContent = `Wishlists públicas · ${publicWishlistUsers.length} usuario${publicWishlistUsers.length === 1 ? '' : 's'}`;
    artistBanner.innerHTML = buildWishlistsBanner(publicWishlistUsers.length);
    grid.innerHTML = '';

    if (window.alphabetObserver) {
      window.alphabetObserver.disconnect();
      window.alphabetObserver = null;
    }

    if (!publicWishlistUsers.length) {
      grid.innerHTML = '<div class="col-12"><div class="alert alert-secondary">Todavía no hay wishlists públicas para mostrar.</div></div>';
      return;
    }

    publicWishlistUsers.forEach(user => {
      const card = document.createElement('div');
      card.className = 'col-12 col-sm-6 col-lg-4 col-xl-3';
      card.innerHTML = `
        <a href="#wishlist/${encodeURIComponent(user)}" class="wishlist-user-card text-decoration-none d-block h-100">
          <div class="wishlist-user-card__inner h-100">
            <div class="wishlist-user-card__icon">♡</div>
            <div>
              <small class="text-info text-uppercase d-block mb-1">Wishlist pública</small>
              <h5 class="text-white mb-1">${user}</h5>
              <p class="text-secondary mb-0 small">Ver discos deseados de ${user}</p>
            </div>
          </div>
        </a>
      `;
      grid.appendChild(card);
    });

    return;
  }

  await displayLibrary(libraryStore.getFilteredData(), {
    onEditInventory: async (item) => {
      await openInventoryEditModal(item);
    },
    onMarkReceived: async (item) => {
      const updatedItem = await markInventoryReceived(item);
      upsertInventoryItemLocally(item, updatedItem);
    },
    onRemoveInventory: async (item) => {
      const updatedItem = await removeFromInventory(item);
      upsertInventoryItemLocally(item, updatedItem, { removeIfHidden: true });
    },
  });
}

function showInstallBanner() {
  if (document.getElementById('ios-install-banner')) {
    return;
  }

  const banner = document.createElement('div');
  banner.id = 'ios-install-banner';
  document.body.classList.add('ios-install-banner-visible');
  banner.style.cssText = `
    position: fixed; bottom: 24px; left: 20px; right: 20px;
    z-index: 10000; background: #1a1a2e; color: #fff;
    border: 1px solid #0dcaf0; border-radius: 12px;
    padding: 16px; box-shadow: 0 4px 20px rgba(0,0,0,0.5);
    font-size: 14px; max-width: 400px; margin: 0 auto;
  `;
  banner.innerHTML = `
    <div style="display:flex;align-items:flex-start;gap:12px">
      <span style="font-size:28px">📱</span>
      <div style="flex:1">
        <strong style="color:#0dcaf0">Agrega esta app a tu pantalla de inicio</strong>
        <p style="margin:6px 0 0;color:#ccc;font-size:13px">
          Para recibir notificaciones cuando haya cambios en la biblioteca:
        </p>
        <ol style="margin:8px 0 0;padding-left:18px;color:#aaa;font-size:12px;line-height:1.6">
          <li>Toca <strong style="color:#fff">Compartir</strong> (cuadro con flecha ↑)</li>
          <li>Desplázate y toca <strong style="color:#fff">Agregar a Inicio</strong></li>
          <li>Toca <strong style="color:#fff">Agregar</strong> (arriba a la derecha)</li>
        </ol>
      </div>
      <button id="close-install-banner" style="
        background:none;border:none;color:#888;font-size:20px;
        cursor:pointer;padding:0;line-height:1;flex-shrink:0
      ">×</button>
    </div>
  `;
  document.body.appendChild(banner);

  document.getElementById('close-install-banner').onclick = () => {
    document.body.classList.remove('ios-install-banner-visible');
    banner.remove();
  };
}

function showSubscribeBell() {
  const existing = document.getElementById('push-subscribe-btn');
  if (existing) {
    existing.remove();
  }

  const btn = document.createElement('button');
  btn.id = 'push-subscribe-btn';
  btn.className = 'push-subscribe-fab';
  btn.title = 'Activar notificaciones de cambios';
  btn.style.cssText = `
    width: 58px; height: 58px; border-radius: 50%; border: none;
    background: #0dcaf0; color: #000; font-size: 22px;
    cursor: pointer; box-shadow: 0 3px 12px rgba(13,202,240,0.4);
    display: flex; align-items: center; justify-content: center;
    transition: transform 0.2s;
  `;
  btn.textContent = '🔔';
  btn.onmouseenter = () => btn.style.transform = 'scale(1.1)';
  btn.onmouseleave = () => btn.style.transform = 'scale(1)';
  btn.onclick = async () => {
    btn.disabled = true;
    btn.style.opacity = '0.7';
    const ok = await subscribe();
    if (ok || Notification.permission === 'granted') {
      btn.remove();
      syncGlobalActionDock();
      return;
    }

    if (!ok && Notification.permission !== 'denied') {
      btn.disabled = false;
      btn.style.opacity = '1';
    }
  };

  const slot = document.getElementById('global-action-subscribe-slot');
  if (slot) {
    slot.appendChild(btn);
    syncGlobalActionDock();
    return;
  }

  document.body.appendChild(btn);
}

// Manejar mensajes del service worker para sincronización
if ('serviceWorker' in navigator) {
  navigator.serviceWorker.addEventListener('message', (event) => {
    if (event.data?.type === 'SYNC_COMPLETE') {
      console.log('🔄 Sincronización completada:', event.data.data);
      triggerBackgroundRefresh(500);
      return;
    }

    if (event.data?.type === 'NOTIFICATION_OPENED') {
      triggerBackgroundRefresh(500);
    }
  });
}
