export default function loadAlphabet(){
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