class Filters extends HTMLElement {
  connectedCallback() {
    this.innerHTML = `
        <div class="mb-3 text-end d-none d-lg-block"></div>
            <div class="row mb-3 d-none d-lg-flex">
            <div class="col-md-2">
              <div class="form-check form-check-inline mt-2">
                <input class="form-check-input" type="radio" name="filterRecibido" id="filterRecibidoTodos" value="" checked>
                <label class="form-check-label" for="filterRecibidoTodos">Todos</label>
              </div>
              <div class="form-check form-check-inline mt-2 ms-2">
                <input class="form-check-input" type="radio" name="filterRecibido" id="filterRecibidoSI" value="SI">
                <label class="form-check-label" for="filterRecibidoSI">Recibidos</label>
              </div>
              <div class="form-check form-check-inline mt-2 ms-2">
                <input class="form-check-input" type="radio" name="filterRecibido" id="filterRecibidoNO" value="NO">
                <label class="form-check-label" for="filterRecibidoNO">No Recibidos</label>
              </div>
            </div>
            <div class="col-md-2"><select id="filterType" class="form-select">
                <option value="">Tipo</option>
                </select></div>
            <div class="col-md-2"><select id="filterGenre" class="form-select">
                <option value="">Género</option>
                </select></div>
            <div class="col-md-2"><select id="filterArtist" class="form-select">
                <option value="">Artista</option>
                </select></div>
            <div class="col-md-1"><select id="filterYear" class="form-select">
                <option value="">Año</option>
                </select></div>
            <div class="col-md-1"><button id="resetButton" class="btn btn-secondary w-100">←</button></div>
            </div>
    `;
  }
}
customElements.define("app-filters", Filters);