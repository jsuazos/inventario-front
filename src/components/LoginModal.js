class LoginModal extends HTMLElement {
  connectedCallback() {
    this.innerHTML = `
      <button id="btnLogin" class="btn btn-outline-light border-0">
        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg" aria-hidden="true">
          <path d="M16 11V8a4 4 0 1 0-8 0v3" stroke="#ffffff" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"/>
          <rect x="5" y="11" width="14" height="10" rx="2.5" stroke="#ffffff" stroke-width="1.8"/>
          <circle cx="12" cy="16" r="1.2" fill="#ffffff"/>
        </svg>
      </button>
    `;
  }
}
customElements.define('login-modal', LoginModal);
