class AppFooter extends HTMLElement {
  connectedCallback() {
    const year = new Date().getFullYear();
    this.innerHTML = `
      <footer class="footer bg-dark text-white text-center p-5 mt-5">
        <p>© ${year} Mi biblioteca musical</p>
      </footer>
    `;
  }
}
customElements.define('app-footer', AppFooter);