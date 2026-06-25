import { authStore } from '../state/authStore.js';
import { closeSidebar } from '../utils/ui.js';

class Aside extends HTMLElement {
  constructor() {
    super();
    this._unsubscribe = null;
  }

  connectedCallback() {
    this.innerHTML = `
        <aside id="sidebar" class="bg-dark text-white px-3 pt-3 pb-5 sidebar-custom d-flex flex-column min-vh-100">
        <div class="d-flex justify-content-between align-items-center">
            <h5 class="mb-4">Explorar</h5>
            <login-modal></login-modal>
        </div>

        <div id="admin-section" class="d-none">
          <hr class="border-secondary">
          <h6 class="text-info mb-2">Administración</h6>
          <div id="admin-controls">
            <p class="small text-secondary mb-0">Sesión: <span id="admin-username" class="text-info"></span></p>
          </div>
          <hr class="border-secondary">
        </div>

        <ul class="nav flex-column">
            <li class="nav-item"><a class="nav-link text-white" href="#biblioteca">🎵 Biblioteca</a></li>
            <li class="nav-item d-none" id="wishlist-link-item"><a class="nav-link text-white" id="wishlist-link" href="#wishlist/me">♡ Mi wishlist</a></li>
            <li class="nav-item mx-3">
            <div class="top-estilos">
                <h6>🔥 Top 10</h6>
                <div id="top-estilos-list" class="top-lista mx-4"></div>
            </div>
            </li>

        </ul>



        <!-- Esto se empuja al fondo -->
        <div class="mt-auto">
            <div class="d-flex justify-content-between align-items-center">
            <p id="cache-version" class="my-0"></p>
            <button id="btn-clear-library" class="btn btn-outline-light">
                <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" fill="currentColor"
                    class="bi bi-arrow-clockwise" viewBox="0 0 16 16">
                    <path fill-rule="evenodd" d="M8 3a5 5 0 1 0 4.546 2.914.5.5 0 0 1 .908-.417A6 6 0 1 1 8 2z" />
                    <path
                    d="M8 4.466V.534a.25.25 0 0 1 .41-.192l2.36 1.966c.12.1.12.284 0 .384L8.41 4.658A.25.25 0 0 1 8 4.466" />
                </svg>
            </button>
            </div>
        </div>
        </aside>
    `;

    this._unsubscribe = authStore.subscribe(({ isLoggedIn, user }) => {
      const adminSection = this.querySelector('#admin-section');
      const usernameSpan = this.querySelector('#admin-username');
      const wishlistLinkItem = this.querySelector('#wishlist-link-item');
      const wishlistLink = this.querySelector('#wishlist-link');
      if (adminSection) {
        adminSection.classList.toggle('d-none', !isLoggedIn);
      }
      if (wishlistLinkItem) {
        wishlistLinkItem.classList.toggle('d-none', !isLoggedIn);
      }
      if (usernameSpan && user) {
        usernameSpan.textContent = user;
      }
      if (wishlistLink && user) {
        wishlistLink.textContent = `♡ Wishlist de ${user}`;
      }
    });

    this.querySelectorAll('.nav-link').forEach(link => {
      link.addEventListener('click', () => {
        if (window.matchMedia('(max-width: 991.98px)').matches) {
          closeSidebar();
        }
      });
    });

    const clearLibraryButton = this.querySelector('#btn-clear-library');
    if (clearLibraryButton) {
      clearLibraryButton.addEventListener('click', () => {
        if (window.matchMedia('(max-width: 991.98px)').matches) {
          closeSidebar();
        }
      });
    }
  }

  disconnectedCallback() {
    if (this._unsubscribe) {
      this._unsubscribe();
    }
  }
}
customElements.define('app-aside', Aside);
