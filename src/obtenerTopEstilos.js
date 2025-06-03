export default function obtenerTopEstilos() {
  const lista = document.getElementById("top-estilos-list");
  if (!lista) return;

  const cards = document.querySelectorAll(".borde-overlay[data-genero]");
  const contador = {};

  cards.forEach(card => {
    const genero = card.getAttribute("data-genero").trim().toLowerCase();
    if (genero) {
      contador[genero] = (contador[genero] || 0) + 1;
    }
  });

  const top10 = Object.entries(contador)
    .sort((a, b) => b[1] - a[1])
    .slice(0, 10);

  lista.innerHTML = "";
  top10.forEach(([genero, cantidad]) => {
    const linea = document.createElement("div");
    linea.innerHTML = `${genero.charAt(0).toUpperCase() + genero.slice(1)} <span class="badge bg-secondary">${cantidad}</span>`;
    lista.appendChild(linea);
  });
}
