class Alphabet extends HTMLElement {
  connectedCallback() {
    const letras = Array.from({ length: 26 }, (_, i) =>
      String.fromCharCode(65 + i)
    ); // A-Z

    const enlaces = letras
      .map(
        letra =>
          `<a href="#letra-${letra}" class="letra-tag" aria-label="Letra ${letra}">${letra}</a>`
      )
      .join('');

    this.innerHTML = `
      <div id="alphabet" class="alphabet-index fixed-bottom-ios pb-4">
        ${enlaces}
        <div class="badge-mobile d-none justify-content-center gap-2 mt-1">
          <div id="cacheVersionBadge-mobile" class="badge bg-info text-dark">
            <small>Cache: <span id="cacheVersion-mobile">-</span></small>
          </div>
          <div id="connection-status-mobile" class="badge bg-success">
            <small>Online</small>
          </div>
        </div>
      </div>
    `;
  }
}
customElements.define('app-alphabet', Alphabet);
