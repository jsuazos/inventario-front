const generoColores = {};

const paleta = [
"#b02121",
"#47237b",
"#6C5CE7",
"#00B894",
"#0984E3",
"#E17055",
"#74B9FF",
"#55EFC4" 
];

export default function obtenerColorPorGenero(genero) {
    if (!generoColores[genero]) {
        const index = Object.keys(generoColores).length % paleta.length;
        generoColores[genero] = paleta[index];
    }
    return generoColores[genero];
}