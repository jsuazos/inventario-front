export default function normalizeLibraryItem(item = {}) {
  return {
    ID: item.ID || '',
    Artista: item.Artista || '',
    Disco: item.Disco || '',
    Año: item.Año || '',
    Genero: item.Genero || '',
    Tipo: item.Tipo || '',
    Recibido: item.Recibido || '',
    img: item.img || '',
    imgFULL: item.imgFULL || '',
    Visible: item.Visible || '',
    Orden: item.Orden || '',
    Origen: item.Origen || '',
    OrigenISO: item.OrigenISO || '',
  };
}
