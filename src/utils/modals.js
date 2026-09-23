import { fetchConStatusOk } from '../services/api.js';
import configService from '../services/configService.js';
import { libraryStore } from '../state/libraryStore.js';
import { authStore } from '../state/authStore.js';
import { closeStoredSession } from '../services/authService.js';

export function clearLibrary() {
    const btn = document.getElementById('btn-clear-library');
    if (!btn) {
        console.warn('clearLibrary: botón btn-clear-library no encontrado');
        return;
    }
    btn.addEventListener('click', () => {
        Swal.fire({
        title: '¿Limpiar biblioteca?',
        text: 'Esta acción eliminará los datos guardados localmente.',
        icon: 'warning',
        showCancelButton: true,
        confirmButtonText: 'Sí, limpiar',
        cancelButtonText: 'Cancelar',
        reverseButtons: true,
        background: '#1a1a1a',
        color: '#fff',
        backdrop: 'rgba(0,0,0,0.85)',
        customClass: {
            popup: 'animate__animated animate__zoomIn',
            confirmButton: 'btn btn-danger',
            cancelButton: 'btn btn-secondary me-2'
        },
        buttonsStyling: false
        }).then(async (result) => {
        if (result.isConfirmed) {
            await libraryStore.clearLibrary();
            location.reload();
        }
        });
  });
}

export function showRegisterModal() {
  Swal.fire({
    title: 'Crear cuenta',
    html:
      `<div class="login-form-grid">
         <input type="text" id="swal-usuario" class="swal2-input login-swal-input" placeholder="Usuario" autocomplete="off" autocapitalize="none" autocorrect="off" spellcheck="false">
         <div class="login-password-wrap">
           <input type="password" id="swal-contrasena" class="swal2-input login-swal-input login-password-input" placeholder="Contraseña" autocomplete="off" autocapitalize="none" autocorrect="off" spellcheck="false">
           <button type="button" id="toggle-password" class="login-password-toggle" tabindex="-1" aria-label="Mostrar u ocultar contraseña">
             <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
               <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"></path>
               <circle cx="12" cy="12" r="3"></circle>
             </svg>
           </button>
         </div>
         <p style="color:#888;font-size:0.8rem;margin:8px 0 0;text-align:center">El usuario puede contener letras, números y guión bajo</p>
       </div>`,
    confirmButtonText: 'Crear cuenta',
    showCancelButton: true,
    cancelButtonText: 'Cancelar',
    background: '#1a1a1a',
    color: '#fff',
    backdrop: 'rgba(0,0,0,0.85)',
    customClass: {
      popup: 'login-swal-popup',
      htmlContainer: 'login-swal-html',
    },
    didOpen: () => {
      const toggle = document.getElementById('toggle-password');
      const input = document.getElementById('swal-contrasena');
      if (toggle && input) {
        toggle.addEventListener('click', () => {
          const isPassword = input.type === 'password';
          input.type = isPassword ? 'text' : 'password';
          const svg = toggle.querySelector('svg');
          svg.innerHTML = isPassword
            ? '<path d="M17.94 17.94A10.07 10.07 0 0 1 12 20c-7 0-11-8-11-8a18.45 18.45 0 0 1 5.06-5.94"></path><path d="M9.9 4.24A9.12 9.12 0 0 1 12 4c7 0 11 8 11 8a18.5 18.5 0 0 1-2.16 3.19"></path><line x1="23" y1="1" x2="1" y2="23"></line><path d="M14.12 14.12a3 3 0 1 1-4.24-4.24"></path>'
            : '<path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"></path><circle cx="12" cy="12" r="3"></circle>';
        });
      }
    },
    preConfirm: async () => {
      const usuario = document.getElementById('swal-usuario').value.trim();
      const contrasena = document.getElementById('swal-contrasena').value;

      if (!usuario || !contrasena) {
        Swal.showValidationMessage('Debe ingresar usuario y contraseña');
        return false;
      }

      if (usuario.length < 3) {
        Swal.showValidationMessage('El usuario debe tener al menos 3 caracteres');
        return false;
      }

      if (contrasena.length < 4) {
        Swal.showValidationMessage('La contraseña debe tener al menos 4 caracteres');
        return false;
      }

      if (!/^[a-zA-Z0-9_]+$/.test(usuario)) {
        Swal.showValidationMessage('Solo letras, números y guión bajo');
        return false;
      }

      try {
        const { apiUrl } = await configService();
        const data = await fetchConStatusOk(`${apiUrl}/register`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ usuario, contrasena })
        });

        return data;
      } catch (error) {
        Swal.showValidationMessage(error.message);
        return false;
      }
    }
  }).then(result => {
    if (result.isConfirmed && result.value) {
      authStore.login(result.value.usuario);
      updateLoginUI();
      Swal.fire({
        icon: 'success',
        title: `¡Bienvenido, ${result.value.usuario}!`,
        html: `
          <div style="text-align:left;color:#ccc;line-height:1.7;font-size:0.9rem">
            <p style="margin:0 0 12px">Tu cuenta se creó correctamente. Aquí tienes algunos consejos para empezar:</p>
            <ul style="margin:0;padding-left:18px">
              <li>Usa el botón <strong style="color:#fff">+</strong> en la esquina inferior derecha para agregar discos a tu inventario.</li>
              <li>Filtra tu colección por artista, género o año usando la barra de búsqueda.</li>
              <li>Agrega discos a tu <strong style="color:#fff">wishlist</strong> desde el menú lateral y muévelos al inventario cuando los consigas.</li>
              <li>Mantente online para recibir notificaciones de cambios en tu biblioteca.</li>
            </ul>
          </div>
        `,
        confirmButtonText: 'Comenzar',
        background: '#1a1a1a',
        color: '#fff',
        backdrop: 'rgba(0,0,0,0.85)',
        customClass: {
          confirmButton: 'btn btn-info',
        },
        buttonsStyling: false,
      });
    }
  });
}

export function showLoginModal() {
  Swal.fire({
    title: 'Iniciar sesión',
    html:
      `<div class="login-form-grid">
         <input type="text" id="swal-usuario" class="swal2-input login-swal-input" placeholder="Usuario" autocomplete="off" autocapitalize="none" autocorrect="off" spellcheck="false">
         <div class="login-password-wrap">
           <input type="password" id="swal-contrasena" class="swal2-input login-swal-input login-password-input" placeholder="Contraseña" autocomplete="off" autocapitalize="none" autocorrect="off" spellcheck="false">
           <button type="button" id="toggle-password" class="login-password-toggle" tabindex="-1" aria-label="Mostrar u ocultar contraseña">
             <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
               <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"></path>
               <circle cx="12" cy="12" r="3"></circle>
             </svg>
           </button>
         </div>
         <p style="color:#888;font-size:0.85rem;margin:12px 0 0;text-align:center">
¿No tienes cuenta?
            <a href="#" id="link-to-register" style="color:#0dcaf0;text-decoration:none">Regístrate</a>
         </p>
       </div>`,
    confirmButtonText: 'Ingresar',
    focusConfirm: false,
    showCancelButton: true,
    background: '#1a1a1a',
    color: '#fff',
    backdrop: 'rgba(0,0,0,0.85)',
    customClass: {
      popup: 'login-swal-popup',
      htmlContainer: 'login-swal-html',
    },
    didOpen: () => {
      const toggle = document.getElementById('toggle-password');
      const input = document.getElementById('swal-contrasena');
      if (toggle && input) {
        toggle.addEventListener('click', () => {
          const isPassword = input.type === 'password';
          input.type = isPassword ? 'text' : 'password';
          const svg = toggle.querySelector('svg');
          svg.innerHTML = isPassword
            ? '<path d="M17.94 17.94A10.07 10.07 0 0 1 12 20c-7 0-11-8-11-8a18.45 18.45 0 0 1 5.06-5.94"></path><path d="M9.9 4.24A9.12 9.12 0 0 1 12 4c7 0 11 8 11 8a18.5 18.5 0 0 1-2.16 3.19"></path><line x1="23" y1="1" x2="1" y2="23"></line><path d="M14.12 14.12a3 3 0 1 1-4.24-4.24"></path>'
            : '<path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"></path><circle cx="12" cy="12" r="3"></circle>';
        });
      }

      const link = document.getElementById('link-to-register');
      if (link) {
        link.addEventListener('click', (e) => {
          e.preventDefault();
          Swal.close();
          setTimeout(showRegisterModal, 200);
        });
      }
    },
    preConfirm: async () => {
      const usuario = document.getElementById('swal-usuario').value.trim();
      const contrasena = document.getElementById('swal-contrasena').value;

      if (!usuario || !contrasena) {
        Swal.showValidationMessage('Debe ingresar usuario y contraseña');
        return false;
      }

      try {
        const { apiUrl } = await configService();
        const data = await fetchConStatusOk(`${apiUrl}/login`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ usuario, contrasena })
        });

        return data;
      } catch (error) {
        Swal.showValidationMessage(error.message);
        return false;
      }
    }
  }).then(result => {
    if (result.isConfirmed && result.value) {
      authStore.login(result.value.usuario);
      updateLoginUI();
      Swal.fire({
        icon: 'success',
        title: `¡Bienvenido, ${result.value.usuario}!`,
        background: '#1a1a1a',
        color: '#fff',
        backdrop: 'rgba(0,0,0,0.85)',
        timer: 1500,
        showConfirmButton: false
      });
    }
  });
}

function showLogoutConfirm() {
  Swal.fire({
    title: 'Cerrar sesión',
    text: `¿Cerrar sesión de ${authStore.user}?`,
    icon: 'question',
    showCancelButton: true,
    confirmButtonText: 'Sí, cerrar sesión',
    cancelButtonText: 'Cancelar',
    reverseButtons: true,
    background: '#1a1a1a',
    color: '#fff',
    backdrop: 'rgba(0,0,0,0.85)',
    customClass: {
      confirmButton: 'btn btn-danger',
      cancelButton: 'btn btn-secondary me-2'
    },
    buttonsStyling: false
  }).then(async result => {
    if (result.isConfirmed) {
      try {
        await closeStoredSession();
      } catch (error) {
        console.warn('No se pudo cerrar la sesión remota:', error);
      }
      authStore.logout();
      updateLoginUI();
      Swal.fire({
        icon: 'info',
        title: 'Sesión cerrada',
        background: '#1a1a1a',
        color: '#fff',
        backdrop: 'rgba(0,0,0,0.85)',
        timer: 1000,
        showConfirmButton: false
      });
    }
  });
}

export function updateLoginUI() {
  const btn = document.getElementById('btnLogin');
  if (!btn) return;

  if (authStore.isLoggedIn) {
    btn.innerHTML = `
      <svg width="20" height="20" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round">
        <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4"/>
        <polyline points="16 17 21 12 16 7"/>
        <line x1="21" y1="12" x2="9" y2="12"/>
      </svg>`;
    btn.title = 'Cerrar sesión';
  } else {
    btn.innerHTML = `
      <svg width="20" height="20" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round">
        <circle cx="12" cy="8" r="4"/>
        <path d="M4 21v-1a5 5 0 0 1 5-5h6a5 5 0 0 1 5 5v1"/>
      </svg>`;
    btn.title = 'Iniciar sesión';
  }
}

export function modalLogin() {
  const btn = document.getElementById('btnLogin');
  if (!btn) {
    console.warn('modalLogin: botón btnLogin no encontrado');
    return;
  }
  btn.addEventListener('click', () => {
    if (authStore.isLoggedIn) {
      showLogoutConfirm();
    } else {
      showLoginModal();
    }
  });

  const sidebarBtn = document.getElementById('btnLogoutSidebar');
  if (sidebarBtn) {
    sidebarBtn.addEventListener('click', showLogoutConfirm);
  }
}
