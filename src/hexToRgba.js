export default function hexToRgba(hex, alpha = 1) {
    // Elimina el símbolo #
    hex = hex.replace(/^#/, '');

    // Expande colores cortos como #123 a #112233
    if (hex.length === 3) {
        hex = hex.split('').map(char => char + char).join('');
    }

    // Extrae componentes
    const bigint = parseInt(hex, 16);
    const r = (bigint >> 16) & 255;
    const g = (bigint >> 8) & 255;
    const b = bigint & 255;

    return `rgba(${r}, ${g}, ${b}, ${alpha})`;
}