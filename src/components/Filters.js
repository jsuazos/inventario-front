class Filters extends HTMLElement {
  connectedCallback() {
    this.innerHTML = `
        <div class="mb-3 text-end d-lg-block"></div>
            <div class="row mb-3 d-lg-flex align-items-center" style="gap: 0.5rem;">
              <div class="col-auto">
                <div class="recibido-filter mt-2">
                  <input type="radio" name="filterRecibido" id="filterRecibidoTodos" value="" checked>
                  <label for="filterRecibidoTodos">Todos</label>

                  <input type="radio" name="filterRecibido" id="filterRecibidoSI" value="SI">
                  <label for="filterRecibidoSI">Recibidos</label>

                  <input type="radio" name="filterRecibido" id="filterRecibidoNO" value="NO">
                  <label for="filterRecibidoNO">No Recibidos</label>

                  <span class="recibido-filter-slider"></span>
                </div>
              </div>
              <div class="col-auto ms-lg-auto">
                <div class="sort-filter-wrapper position-relative">
                  <div class="sort-filter mt-2">
                    <button id="sortDropdownButton" type="button">
                      <span class="sort-label">Ordenar</span> <span class="ms-1">⇅</span>
                    </button>
                  </div>
                  <div id="sortDropdownMenu" class="position-absolute mt-1 p-2 d-none" style="right:0; min-width:220px; z-index:2000;">
                    <button class="sort-option" data-sort="artistAsc">Ordenar A-Z (Artista)</button>
                    <button class="sort-option" data-sort="artistDesc">Ordenar Z-A (Artista)</button>
                    <button class="sort-option" data-sort="orden" disabled>Ordenar por compra (Orden)</button>
                    <button class="sort-option" data-sort="anio" disabled>Ordenar por año</button>
                    <button class="sort-option" data-sort="genero" disabled>Ordenar por género</button>
                  </div>
                </div>
              </div>
            </div>
    `;

    this.initSortDropdown();
  }

  initSortDropdown() {
    const button = this.querySelector('#sortDropdownButton');
    const menu = this.querySelector('#sortDropdownMenu');
    const options = this.querySelectorAll('.sort-option');

    button.addEventListener('click', (e) => {
      e.stopPropagation();
      import('../state/libraryStore.js').then(({ libraryStore }) => {
        const currentSort = libraryStore.getFilters().sortBy;
        options.forEach(opt => {
          opt.classList.toggle('active', opt.dataset.sort === currentSort);
        });
      });
      menu.classList.toggle('d-none');
    });

    options.forEach(option => {
      option.addEventListener('click', (e) => {
        e.preventDefault();
        e.stopPropagation();

        const sortBy = e.currentTarget.dataset.sort;
        const label = e.currentTarget.textContent.trim();

        options.forEach(opt => opt.classList.remove('active'));
        e.currentTarget.classList.add('active');

        button.innerHTML = `${label} <span class="ms-1">⇅</span>`;
        menu.classList.add('d-none');

        import('../state/libraryStore.js').then(({ libraryStore }) => {
          libraryStore.updateFilters({ sortBy });
        });
      });
    });

    document.addEventListener('click', () => {
      menu.classList.add('d-none');
    });
  }
}
if (!customElements.get("app-filters")) {
  customElements.define("app-filters", Filters);
}