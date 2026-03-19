class Filters extends HTMLElement {
  connectedCallback() {
    this.innerHTML = `
        <div class="mb-3 text-end d-lg-block"></div>
            <div class="row mb-3 d-lg-flex">
            <div class="col-md-12">
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
        </div>
    `;
  }
}
customElements.define("app-filters", Filters);