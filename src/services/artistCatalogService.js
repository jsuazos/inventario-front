import configService from './configService.js';

let catalog = null;

export async function loadArtistCatalog() {
  if (catalog) return catalog;

  try {
    const { apiUrl } = await configService();
    const url = `${apiUrl.replace(/\/$/, '')}/artistas`;
    const res = await fetch(url);
    const data = await res.json();
    catalog = (data.data || []).reduce((map, entry) => {
      map[entry.Artista.toLowerCase()] = {
        name: entry.Artista,
        count: entry.Cantidad,
        mbid: entry.ID || null
      };
      return map;
    }, {});
  } catch {
    catalog = {};
  }

  return catalog;
}

export function getArtistFromCatalog(artistName) {
  if (!catalog) return null;
  return catalog[artistName.toLowerCase()] || null;
}
