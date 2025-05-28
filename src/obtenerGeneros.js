export default function obtenerGeneros (inventario) {
    let generos = [];
    inventario.forEach(elem => {
      if (elem.Genero.includes(',')) {
        generos.push(...elem.Genero.replaceAll(', ', ',').split(','));
      } else {
        generos.push(elem.Genero);
      }

      generos = [...new Set(generos)];
    });

    // CORRECCION, AGREGA DOS VECES World & Country y con back slash 
    let index = generos.indexOf(`"World & Country"`);
    if (index !== -1) {
      generos.splice(index, 1);
    }

    return generos;
  };