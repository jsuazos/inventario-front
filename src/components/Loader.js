class Loader extends HTMLElement {
  connectedCallback() {
    this.innerHTML = `
        <div id="loader" class="text-center my-5" style="display: none;">
        <div class="vinyl-loader"></div>
        <p class="text-white mt-2">Cargando música...</p>
        </div>
        `;
  }
}
customElements.define("app-loader", Loader);