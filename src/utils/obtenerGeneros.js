import { splitGenreTags } from './genreTags.js';

export default function obtenerGeneros(inventario) {
  return [...new Set(inventario.flatMap(elem => splitGenreTags(elem.Genero)))];
}
