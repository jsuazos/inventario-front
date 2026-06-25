import { fetchConStatusOk } from '../services/api.js';
import configService from '../services/configService.js';
import { storageService } from '../services/storageService.js';
import { libraryStore } from '../state/libraryStore.js';
import { authStore } from '../state/authStore.js';

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

function showLoginModal() {
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
      authStore.login(result.value.token, result.value.usuario);
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
  }).then(result => {
    if (result.isConfirmed) {
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
    btn.innerHTML = `<span style="font-size:0.8rem;color:#0dcaf0">${authStore.user}</span>`;
    btn.title = 'Cerrar sesión';
  } else {
    btn.innerHTML = `<svg width="16px" height="16px" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg" stroke="#ffffff"><g id="SVGRepo_bgCarrier" stroke-width="0"></g><g id="SVGRepo_tracerCarrier" stroke-linecap="round" stroke-linejoin="round"></g><g id="SVGRepo_iconCarrier"> <path d="M10.0909 11.9629L19.3636 8.63087V14.1707C18.8126 13.8538 18.1574 13.67 17.4545 13.67C15.4964 13.67 13.9091 15.096 13.9091 16.855C13.9091 18.614 15.4964 20.04 17.4545 20.04C19.4126 20.04 21 18.614 21 16.855C21 16.855 21 16.8551 21 16.855L21 7.49236C21 6.37238 21 5.4331 20.9123 4.68472C20.8999 4.57895 20.8852 4.4738 20.869 4.37569C20.7845 3.86441 20.6352 3.38745 20.347 2.98917C20.2028 2.79002 20.024 2.61055 19.8012 2.45628C19.7594 2.42736 19.716 2.39932 19.6711 2.3722L19.6621 2.36679C18.8906 1.90553 18.0233 1.93852 17.1298 2.14305C16.2657 2.34086 15.1944 2.74368 13.8808 3.23763L11.5963 4.09656C10.9806 4.32806 10.4589 4.52419 10.0494 4.72734C9.61376 4.94348 9.23849 5.1984 8.95707 5.57828C8.67564 5.95817 8.55876 6.36756 8.50501 6.81203C8.4545 7.22978 8.45452 7.7378 8.45455 8.33743V16.1307C7.90347 15.8138 7.24835 15.63 6.54545 15.63C4.58735 15.63 3 17.056 3 18.815C3 20.574 4.58735 22 6.54545 22C8.50355 22 10.0909 20.574 10.0909 18.815C10.0909 18.815 10.0909 18.8151 10.0909 18.815L10.0909 11.9629Z" fill="#1C274C"></path> </g></svg>`;
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
}
