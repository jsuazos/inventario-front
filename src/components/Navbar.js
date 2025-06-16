class Navbar extends HTMLElement {
  connectedCallback() {
    this.innerHTML = `
        <nav class="navbar navbar-expand-lg navbar-dark px-3 sticky-top">
            <div class="d-flex w-100 align-items-center gap-2">
            <!-- Botón hamburguesa -->
            <button id="toggleSidebar" class="btn btn-outline-light p-2">
                <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" fill="currentColor" class="bi bi-list"
                viewBox="0 0 16 16">
                <path fill-rule="evenodd"
                    d="M2.5 12a.5.5 0 0 1 .5-.5h10a.5.5 0 0 1 0 1H3a.5.5 0 0 1-.5-.5m0-4a.5.5 0 0 1 .5-.5h10a.5.5 0 0 1 0 1H3a.5.5 0 0 1-.5-.5m0-4a.5.5 0 0 1 .5-.5h10a.5.5 0 0 1 0 1H3a.5.5 0 0 1-.5-.5" />
                </svg>
            </button>

            <!-- Input de búsqueda -->
            <div class="flex-grow-1">
                <input id="searchInput" class="form-control" type="search" placeholder="Buscar..." autocomplete="off">
            </div>
            </div>

            <!-- Sidebar oculto -->
            <app-aside></app-aside>
        </nav>
    `;
  }
}
customElements.define("app-navbar", Navbar);
