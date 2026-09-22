// main.js
import './components/Navbar.js';
import './components/Aside.js';
import './components/Filters.js';
import './components/Loader.js';
import './components/LoginModal.js';
import './components/Alphabet.js';
import './components/Footer.js';

import { loadLibrary, checkForUpdatesInBackground, fetchLibraryFromApi } from "./services/libraryService.js";
import obtenerTopEstilos from "./utils/obtenerTopEstilos.js";
import { filterLibrary } from "./utils/libraryFilters.js";
import { closeSidebar, toggleSidebar } from "./utils/ui.js";
// import { clearFilters } from "./utils/libraryFilters.js";
import { clearLibrary, modalLogin, updateLoginUI, showLoginModal, showRegisterModal } from "./utils/modals.js";
import { authStore } from "./state/authStore.js";
import displayLibrary from "./utils/libraryDisplay.js";
import { libraryStore } from "./state/libraryStore.js";
import { wishlistStore } from './state/wishlistStore.js';
import { errorHandler } from "./services/errorHandler.js";
import { setupOnlineOfflineHandlers } from './services/dbService.js';
import { loadArtistCatalog } from './services/artistCatalogService.js';
import { subscribe, isSubscribed, isSupported, syncExistingSubscription } from './services/pushService.js';

import { enrichWishlistItemWithDiscogs } from './services/discogsService.js';
import { addToInventory, getHiddenInventory, markInventoryReceived, removeFromInventory, restoreInventoryItem, updateInventory } from './services/inventoryService.js';
import { splitTypeTags } from './utils/typeTags.js';

let backgroundCheckTimeout = null;
let lastBackgroundCheckAt = 0;
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
  // Restaurar sesión antes de abrir la caché correspondiente al usuario.
  authStore.init();

  // Inicializar el store desde localStorage/IndexedDB
  await libraryStore.init(authStore.user);

  // Suscribirse a cambios del store para refrescar la vista
  // Registrado temprano para capturar todas las notificaciones
  libraryStore.subscribe(async (state) => {
    if (!state.isLoading) {
      await renderCurrentView();
      requestAnimationFrame(() => obtenerTopEstilos());
    }
  });
  wishlistStore.subscribe(() => {
    renderCurrentView().catch(() => {});
  });

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
        await libraryStore.switchUser(authStore.user);
        await wishlistStore.loadMine();
        const freshData = await fetchLibraryFromApi();
        libraryStore.loadData(freshData);
        await setupPushNotifications();
      } catch (error) {
        console.error('No se pudo cargar la data del usuario:', error);
      }
    } else {
      await libraryStore.switchUser(null);
      if (parseRoute().mode === 'wishlist' && parseRoute().user === 'me') {
        window.location.hash = '#biblioteca';
        return;
      }
    }

    await syncRouteView();
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
  
  await loadLibrary(libraryStore.getAllData());

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

window.addEventListener('library-refresh-requested', async () => {
  if (!authStore.isLoggedIn || !navigator.onLine) {
    return;
  }

  libraryStore.setLoading(true);
  try {
    const freshData = await fetchLibraryFromApi(true);
    libraryStore.loadData(freshData);
  } catch (error) {
    errorHandler.handleNetworkError(error, 'actualización manual de biblioteca');
  } finally {
    libraryStore.setLoading(false);
  }
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
  if (!authStore.isLoggedIn) return;
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

  if (hash === 'wishlist/me') {
    return { mode: 'wishlist', user: 'me' };
  }

  if (hash === 'ocultos') {
    return { mode: 'hidden' };
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

function buildHiddenInventoryBanner() {
  return `
    <div class="d-flex flex-column flex-md-row justify-content-between align-items-md-center gap-2 mb-3 p-3 rounded-3" style="background: rgba(255,255,255,0.06); border: 1px solid rgba(255,255,255,0.08);">
      <div>
        <small class="text-info text-uppercase">Inventario</small>
        <h4 class="text-white mb-1">Discos ocultos</h4>
        <p class="text-secondary mb-0">Restáuralos cuando quieras volver a mostrarlos en tu biblioteca.</p>
      </div>
      <a href="#biblioteca" class="btn btn-outline-light btn-sm">Volver a biblioteca</a>
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
        text: 'Intenta de nuevo en unos segundos.',
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
        text: 'Intenta de nuevo en unos segundos.',
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
      text: 'Intenta de nuevo en unos segundos.',
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
      text: 'Intenta de nuevo en unos segundos.',
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
      <button type="button" class="global-action-item" data-action="ocultos">Discos ocultos</button>
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

      if (action === 'ocultos') {
        window.location.hash = '#ocultos';
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

  if (route.mode === 'wishlist' || route.mode === 'hidden') {
    toggleFiltersVisibility(false);

    if (!authStore.isLoggedIn) {
      window.location.hash = '#biblioteca';
      return;
    }
  } else {
    toggleFiltersVisibility(true);
    wishlistStatusFilter = 'all';
  }

  await renderCurrentView();
}

function renderLandingPage() {
  toggleFiltersVisibility(false);
  const artistBanner = document.getElementById('artistBanner');
  const grid = document.getElementById('libraryGrid');
  const counter = document.getElementById('resultCount');
  if (artistBanner) artistBanner.innerHTML = '';
  if (counter) counter.textContent = '';
  if (grid) {
    grid.innerHTML = `
      <div class="landing-wrapper">
        <div class="landing-hero">
          <div class="landing-hero-icon">🎵</div>
          <h1 class="landing-title">Mi Música</h1>
          <p class="landing-subtitle">Gestiona tu colección musical personal</p>
          <p class="landing-description">
            Agrega discos de vinilo, CD, cassettes y más. Explora tu biblioteca por género, artista o año.
            Crea tu wishlist con los discos que quieres conseguir y descubre nueva música.
          </p>
          <p class="landing-free">Completamente gratis, sin límites ni suscripciones.</p>
        </div>

        <div class="landing-features">
          <div class="landing-feature-card">
            <div class="landing-feature-icon">💿</div>
            <h3>Inventario personal</h3>
            <p>Organiza tu colección con filtros por género, artista, año y tipo de soporte.</p>
          </div>
          <div class="landing-feature-card">
            <div class="landing-feature-icon">♡</div>
            <h3>Wishlist</h3>
            <p>Guarda los discos que quieres conseguir y llévalos a tu inventario cuando los recibas.</p>
          </div>
          <div class="landing-feature-card">
            <div class="landing-feature-icon">📊</div>
            <h3>Estadísticas</h3>
            <p>Visualiza tu colección con el Top 10 de géneros y rankings por estilo.</p>
          </div>
          <div class="landing-feature-card">
            <div class="landing-feature-icon">🔔</div>
            <h3>Notificaciones</h3>
            <p>Recibe alertas cuando haya actualizaciones en tu biblioteca, incluso sin abrir la app.</p>
          </div>
        </div>

        <div class="landing-preview">
          <h2 class="landing-preview-title">Así se ve tu biblioteca</h2>
          <p class="landing-preview-desc">Cada disco aparece como una tarjeta con carátula, artista, año y tipo de soporte. Puedes editar, filtrar y organizar todo desde un solo lugar.</p>
          <div class="landing-preview-grid">
            <div class="landing-preview-card">
              <div class="landing-preview-img" style="background:linear-gradient(135deg,#1a1a2e,#16213e);">
                <span style="font-size:3rem;opacity:0.3;">💿</span>
              </div>
              <div class="landing-preview-info">
                <strong>Pink Floyd</strong>
                <small>The Dark Side of the Moon</small>
                <span class="badge badge-type mt-1">Vinilo</span>
              </div>
            </div>
            <div class="landing-preview-card">
              <div class="landing-preview-img" style="background:linear-gradient(135deg,#2d1b1b,#1a1a1a);">
                <span style="font-size:3rem;opacity:0.3;">💿</span>
              </div>
              <div class="landing-preview-info">
                <strong>Nirvana</strong>
                <small>Nevermind</small>
                <span class="badge badge-type mt-1">CD</span>
              </div>
            </div>
            <div class="landing-preview-card">
              <div class="landing-preview-img" style="background:linear-gradient(135deg,#1b2d1b,#1a1a1a);">
                <span style="font-size:3rem;opacity:0.3;">💿</span>
              </div>
              <div class="landing-preview-info">
                <strong>Miles Davis</strong>
                <small>Kind of Blue</small>
                <span class="badge badge-type mt-1">Vinilo</span>
              </div>
            </div>
            <div class="landing-preview-card">
              <div class="landing-preview-img" style="background:linear-gradient(135deg,#2d2d1b,#1a1a2e);">
                <span style="font-size:3rem;opacity:0.3;">💿</span>
              </div>
              <div class="landing-preview-info">
                <strong>Daft Punk</strong>
                <small>Random Access Memories</small>
                <span class="badge badge-type mt-1">CD</span>
              </div>
            </div>
          </div>
        </div>

        <div class="landing-steps">
          <h2 class="landing-steps-title">Primeros pasos</h2>
          <div class="landing-steps-grid">
            <div class="landing-step">
              <span class="landing-step-num">1</span>
              <div class="landing-step-body">
                <strong>Crea tu cuenta</strong>
                <p>Regístrate con un nombre de usuario y contraseña. Tus datos estarán protegidos.</p>
              </div>
            </div>
            <div class="landing-step">
              <span class="landing-step-num">2</span>
              <div class="landing-step-body">
                <strong>Agrega tu colección</strong>
                <p>Usa el botón + para añadir discos al inventario. Puedes marcar si ya los recibiste o están en camino.</p>
              </div>
            </div>
            <div class="landing-step">
              <span class="landing-step-num">3</span>
              <div class="landing-step-body">
                <strong>Organiza y filtra</strong>
                <p>Busca por artista, disco o género. Filtra por recibidos, ordena alfabéticamente y explora tu colección.</p>
              </div>
            </div>
            <div class="landing-step">
              <span class="landing-step-num">4</span>
              <div class="landing-step-body">
                <strong>Crea tu wishlist</strong>
                <p>Guarda discos que quieres conseguir y muévelos al inventario cuando los recibas.</p>
              </div>
            </div>
          </div>
        </div>

        <div class="landing-cta">
          <p class="landing-cta-text">¿Ya tienes cuenta?</p>
          <button class="btn btn-info btn-lg landing-btn" id="landing-login-btn">Iniciar sesión</button>
          <p class="landing-cta-divider"><span>o</span></p>
          <button class="btn btn-outline-info btn-lg landing-btn" id="landing-register-btn">Crear cuenta nueva</button>
        </div>

        <div class="landing-creator">
          <p>Desarrollado por <strong>Javier Suazo</strong> &middot; <a href="https://github.com/jsuazos" target="_blank" rel="noopener">GitHub</a></p>
          <p class="landing-creator-version">Versión 2.0 &middot; Supabase + Express</p>
        </div>
      </div>
    `;

    setTimeout(() => {
      document.getElementById('landing-login-btn')?.addEventListener('click', showLoginModal);
      document.getElementById('landing-register-btn')?.addEventListener('click', showRegisterModal);
    }, 0);
  }
}

async function renderCurrentView() {
  const route = parseRoute();
  const artistBanner = document.getElementById('artistBanner');

  if (!authStore.isLoggedIn) {
    renderLandingPage();
    return;
  }

  if (route.mode === 'wishlist') {
    const items = filterWishlistItemsByStatus(wishlistStore.getItems());
    const filterLabel = wishlistStatusFilter === 'all' ? 'Todos' : getWishlistStatusLabel(wishlistStatusFilter);

    await displayLibrary(items, {
      counterText: `Mi wishlist · ${filterLabel} · ${items.length} item${items.length === 1 ? '' : 's'}`,
      bannerHtml: buildWishlistBanner(authStore.user || 'Mi usuario', true),
      fetchArtistBanner: false,
      wishlistMode: true,
      canManageWishlist: true,
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

  if (route.mode === 'hidden') {
    const items = await getHiddenInventory();

    await displayLibrary(items, {
      counterText: `Discos ocultos · ${items.length} item${items.length === 1 ? '' : 's'}`,
      bannerHtml: buildHiddenInventoryBanner(),
      fetchArtistBanner: false,
      showEditButton: false,
      onRestoreInventory: async (item) => {
        const restoredItem = await restoreInventoryItem(item);
        upsertInventoryItemLocally(item, restoredItem, { addIfMissing: true });
        await renderCurrentView();

        if (typeof Swal !== 'undefined') {
          Swal.fire({
            toast: true,
            position: 'top-end',
            icon: 'success',
            title: 'Restaurado en tu biblioteca',
            showConfirmButton: false,
            timer: 1800,
            background: '#1a1a1a',
            color: '#fff'
          });
        }

        return restoredItem;
      },
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
      return updatedItem;
    },
    onRestoreInventory: async (item) => {
      const restoredItem = await restoreInventoryItem(item);
      upsertInventoryItemLocally(item, restoredItem, { addIfMissing: true });
      return restoredItem;
    },
  });

  const hasItems = libraryStore.getAllData().length > 0;
  const helpEl = document.querySelector('.dashboard-help');
  if (!hasItems && !helpEl && artistBanner) {
    artistBanner.insertAdjacentHTML('beforebegin', `
      <div class="dashboard-help">
        <h4>Bienvenido a tu biblioteca</h4>
        <div class="dashboard-help-grid">
          <div class="dashboard-help-item"><strong>+</strong> Agrega discos con el bot&oacute;n +</div>
          <div class="dashboard-help-item"><strong>&#9776;</strong> Men&uacute; lateral para wishlist y top 10</div>
          <div class="dashboard-help-item"><strong>&#128269;</strong> Busca por artista, disco o g&eacute;nero</div>
          <div class="dashboard-help-item"><strong>&#128228;</strong> Mueve wishlist al inventario</div>
        </div>
      </div>`);
  } else if (hasItems && helpEl) {
    helpEl.remove();
  }
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
