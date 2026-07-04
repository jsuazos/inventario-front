export default function normalizeLibraryItem(item = {}) {
  return {
    id: item.id,
    ID: item.ID || '',
    Artista: item.Artista || '',
    Disco: item.Disco || '',
    Año: item.Año || '',
    Genero: item.Genero || '',
    Tipo: item.Tipo || '',
    Formato: item.Formato || '',
    Estilo: item.Estilo || '',
    Disqueria: item.Disqueria || '',
    Catalogo: item.Catalogo || '',
    Recibido: item.Recibido || '',
    img: item.img || '',
    imgFULL: item.imgFULL || '',
    Visible: item.Visible || '',
    Orden: item.Orden || '',
    Origen: item.Origen || '',
    OrigenISO: item.OrigenISO || '',
  };
}
