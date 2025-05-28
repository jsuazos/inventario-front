import obtenerColorPorGenero from './obtenerColorPorGenero.js';
import hexToRgba from './hexToRgba.js';

export default function aplicarColoresPorGenero() {

    document.querySelectorAll('.borde-overlay').forEach(overlay => {
        const genero = overlay.dataset.genero;
        const color = obtenerColorPorGenero(genero);
        
        overlay.style.borderTop = `10px solid ${hexToRgba(color, 0.7)}`;
        overlay.style.borderBottom = `10px solid ${hexToRgba(color, 0.7)}`;
        overlay.style.borderLeft = `10px solid ${hexToRgba(color, 0.7)}`;
        overlay.style.borderRight = `35px solid ${hexToRgba(color, 0.7)}`;

        overlay.addEventListener('mouseenter', () => {
        overlay.style.borderTop = `10px solid ${hexToRgba(color, 1)}`;
        overlay.style.borderBottom = `10px solid ${hexToRgba(color, 1)}`;
        overlay.style.borderLeft = `10px solid ${hexToRgba(color, 1)}`;
        overlay.style.borderRight = `35px solid ${hexToRgba(color, 1)}`;
        });

        overlay.addEventListener('mouseleave', () => {
        overlay.style.borderTop = `10px solid ${hexToRgba(color, 0.7)}`;
        overlay.style.borderBottom = `10px solid ${hexToRgba(color, 0.7)}`;
        overlay.style.borderLeft = `10px solid ${hexToRgba(color, 0.7)}`;
        overlay.style.borderRight = `35px solid ${hexToRgba(color, 0.7)}`;
        });
    });

}