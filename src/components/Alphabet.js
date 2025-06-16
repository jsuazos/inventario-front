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
      </div>
    `;
  }
}
customElements.define('app-alphabet', Alphabet);
