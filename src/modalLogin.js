import obtenerConfiguracionActiva from "./obtenerConfiguracionActiva.js";
import fetchConStatusOk from "./fetchConStatusOk.js";

export default function modalLogin() {
  document.getElementById('btnLogin').addEventListener('click', () => {
    Swal.fire({
      title: 'Iniciar sesión',
      html:
        `<input type="text" id="swal-usuario" class="swal2-input" placeholder="Usuario">
         <input type="password" id="swal-contrasena" class="swal2-input" placeholder="Contraseña">`,
      confirmButtonText: 'Ingresar',
      focusConfirm: false,
      showCancelButton: true,
      background: '#1a1a1a',
      color: '#fff',
      backdrop: 'rgba(0,0,0,0.85)',
      preConfirm: async () => {
        const usuario = document.getElementById('swal-usuario').value.trim();
        const contrasena = document.getElementById('swal-contrasena').value;

        if (!usuario || !contrasena) {
          Swal.showValidationMessage('Debe ingresar usuario y contraseña');
          return false;
        }

        try {
          const { apiUrl } = await obtenerConfiguracionActiva();
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
        Swal.fire({
          icon: 'success',
          title: '¡Bienvenido!',
          background: '#1a1a1a',
          color: '#fff',
          backdrop: 'rgba(0,0,0,0.85)',
          text: result.value.mensaje
        });
      }
    });
  });
}
