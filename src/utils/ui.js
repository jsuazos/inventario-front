export function toggleLoader (show) {
    const loader = document.getElementById('loader');
    if (loader) {
        loader.style.display = show ? 'block' : 'none';
        if (show) {
        // searchInput.setAttribute('disabled', 'disabled');
        filterType.setAttribute('disabled', 'disabled');
        filterGenre.setAttribute('disabled', 'disabled');
        filterArtist.setAttribute('disabled', 'disabled');
        filterYear.setAttribute('disabled', 'disabled');
        } else {
        // searchInput.removeAttribute('disabled');
        filterType.removeAttribute('disabled');
        filterGenre.removeAttribute('disabled');
        filterArtist.removeAttribute('disabled');
        filterYear.removeAttribute('disabled');
        }
    }
}

export function toggleSidebar() {
    const tSidebar = document.getElementById("toggleSidebar");
    const sidebar = document.getElementById("sidebar");

    tSidebar.addEventListener("click", () => {
        sidebar.classList.toggle("show");
        document.body.classList.toggle("sidebar-open");
    });

    // Cerrar al hacer clic fuera
    document.addEventListener("click", (e) => {
    if (!sidebar.contains(e.target) && !tSidebar.contains(e.target)) {
        sidebar.classList.remove("show");
        document.body.classList.remove("sidebar-open");
    }
    });
}

export function loadAlphabet(){
    // Recorre cada enlace del índice alfabético
    document.querySelectorAll('#alphabet a').forEach(link => {
        const targetId = link.getAttribute('href').replace('#', ''); // ej: letra-A
        const target = document.getElementById(targetId);

        if (!target) {
        link.classList.add('text-muted'); // Añade clase para indicar que no hay destino
        link.style.pointerEvents = 'none'; // Desactiva el enlace si no hay destino
        // link.style.display = 'none'; // Oculta la letra si no hay destino
        }
    });
}
