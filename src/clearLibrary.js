export default function clearLibrary() {
    document.getElementById('btn-clear-library').addEventListener('click', () => {
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
        }).then((result) => {
        if (result.isConfirmed) {
            localStorage.removeItem('libraryData');
            location.reload();
        }
        });
  });
}