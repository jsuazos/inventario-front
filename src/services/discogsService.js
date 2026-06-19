import { apiClient } from './api.js';

function normalizeDiscogsType(formats = []) {
  const primaryFormat = formats[0]?.name || '';
  if (!primaryFormat) {
    return '';
  }

  const lower = primaryFormat.toLowerCase();
  if (lower.includes('vinyl')) return 'Vinilo';
  if (lower.includes('cd')) return 'CD';
  if (lower.includes('cassette')) return 'Cassette';
  if (lower.includes('dvd')) return 'DVD';
  return primaryFormat;
}

function toWishlistDiscogsData(data = {}) {
  return {
    discogsId: data.id ? String(data.id) : '',
    img: data.thumb || data.cover_image || '',
    imgFULL: data.images?.[0]?.uri || data.cover_image || data.thumb || '',
    Año: data.year ? String(data.year) : '',
    Tipo: normalizeDiscogsType(data.formats || []),
    Genero: Array.isArray(data.genres) ? data.genres.join(', ') : '',
  };
}

export async function getDiscogsReleaseData(discogsId) {
  const normalizedId = String(discogsId || '').replace(/^[^0-9]+/, '').trim();
  if (!normalizedId) {
    return null;
  }

  const data = await apiClient.get(`/discogs/release/${normalizedId}`, { timeout: 15000 });
  return toWishlistDiscogsData(data);
}

export async function searchDiscogsReleaseData(query) {
  if (!query?.trim()) {
    return null;
  }

  const data = await apiClient.get(`/discogs?q=${encodeURIComponent(query)}`, { timeout: 15000 });
  const firstResult = data.results?.[0];
  if (!firstResult) {
    return null;
  }

  return {
    discogsId: firstResult.id ? String(firstResult.id) : '',
    img: firstResult.thumb || firstResult.cover_image || '',
    imgFULL: firstResult.cover_image || firstResult.thumb || '',
    Año: firstResult.year ? String(firstResult.year) : '',
    Tipo: normalizeDiscogsType(firstResult.format ? [{ name: firstResult.format[0] }] : []),
    Genero: Array.isArray(firstResult.genre) ? firstResult.genre.join(', ') : '',
  };
}

export async function enrichWishlistItemWithDiscogs(item) {
  try {
    if (item.discogsId) {
      const exact = await getDiscogsReleaseData(item.discogsId);
      if (exact) {
        return {
          ...item,
          discogsId: exact.discogsId || item.discogsId,
          img: exact.img || item.img || '',
          imgFULL: exact.imgFULL || item.imgFULL || '',
          Año: item.Año || exact.Año || '',
          Tipo: item.Tipo || exact.Tipo || '',
          Genero: item.Genero || exact.Genero || '',
        };
      }
    }

    const query = [item.Artista, item.Disco].filter(Boolean).join(' ');
    const search = await searchDiscogsReleaseData(query);
    if (!search) {
      return item;
    }

    return {
      ...item,
      discogsId: item.discogsId || search.discogsId || '',
      img: search.img || item.img || '',
      imgFULL: search.imgFULL || item.imgFULL || '',
      Año: item.Año || search.Año || '',
      Tipo: item.Tipo || search.Tipo || '',
      Genero: item.Genero || search.Genero || '',
    };
  } catch (error) {
    console.warn('No se pudo enriquecer wishlist con Discogs:', error.message);
    return item;
  }
}
