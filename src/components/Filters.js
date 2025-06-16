class Filters extends HTMLElement {
  connectedCallback() {
    this.innerHTML = `
        <div class="mb-3 text-end d-none d-lg-block"></div>
            <div class="row mb-3 d-none d-lg-flex">
            <div class="col-md-3"><select id="filterType" class="form-select">
                <option value="">Tipo</option>
                </select></div>
            <div class="col-md-3"><select id="filterGenre" class="form-select">
                <option value="">Género</option>
                </select></div>
            <div class="col-md-3"><select id="filterArtist" class="form-select">
                <option value="">Artista</option>
                </select></div>
            <div class="col-md-2"><select id="filterYear" class="form-select">
                <option value="">Año</option>
                </select></div>
            <div class="col-md-1"><button id="resetButton" class="btn btn-secondary w-100">←</button></div>
            </div>
    `;
  }
}
customElements.define("app-filters", Filters);