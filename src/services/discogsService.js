import { apiClient } from './api.js';

const COUNTRY_TO_ISO = {
  argentina: 'ar',
  australia: 'au',
  austria: 'at',
  belgium: 'be',
  brazil: 'br',
  canada: 'ca',
  chile: 'cl',
  colombia: 'co',
  denmark: 'dk',
  finland: 'fi',
  france: 'fr',
  germany: 'de',
  greece: 'gr',
  ireland: 'ie',
  italy: 'it',
  japan: 'jp',
  mexico: 'mx',
  netherlands: 'nl',
  newzealand: 'nz',
  norway: 'no',
  peru: 'pe',
  poland: 'pl',
  portugal: 'pt',
  spain: 'es',
  sweden: 'se',
  switzerland: 'ch',
  uk: 'gb',
  us: 'us',
  usa: 'us',
  'united kingdom': 'gb',
  'united states': 'us',
};

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

function cleanDiscogsName(value = '') {
  return String(value || '').replace(/\s*\(\d+\)\s*$/u, '').trim();
}

function normalizeCountryToIso(country = '') {
  const normalized = String(country || '').trim().toLowerCase();
  return COUNTRY_TO_ISO[normalized] || '';
}

function getLabelData(data = {}) {
  const firstLabel = data.labels?.[0] || {};
  const firstCompany = data.companies?.[0] || {};
  const source = firstLabel.name ? firstLabel : firstCompany;

  return {
    Disqueria: cleanDiscogsName(source.name || ''),
    Catalogo: source.catno && source.catno !== 'none' ? source.catno : '',
  };
}

function getStylesData(data = {}) {
  const genres = Array.isArray(data.genres) ? data.genres.filter(Boolean) : [];
  const styles = Array.isArray(data.styles) ? data.styles.filter(Boolean) : [];

  return {
    Genero: genres.join(', '),
    Estilo: styles.join(', '),
  };
}

function getFormatData(formats = []) {
  const primaryFormat = formats[0] || {};
  const descriptions = Array.isArray(primaryFormat.descriptions) ? primaryFormat.descriptions.filter(Boolean) : [];

  return {
    Tipo: normalizeDiscogsType(formats),
    Formato: descriptions.join(', '),
  };
}

function toWishlistDiscogsData(data = {}) {
  const labelData = getLabelData(data);
  const stylesData = getStylesData(data);
  const formatData = getFormatData(data.formats || []);
  const origen = data.country || '';

  return {
    discogsId: data.id ? String(data.id) : '',
    img: data.thumb || data.cover_image || '',
    imgFULL: data.images?.[0]?.uri || data.cover_image || data.thumb || '',
    Año: data.year ? String(data.year) : '',
    Tipo: formatData.Tipo,
    Formato: formatData.Formato,
    Genero: stylesData.Genero,
    Estilo: stylesData.Estilo,
    Disqueria: labelData.Disqueria,
    Catalogo: labelData.Catalogo,
    Origen: origen,
    Pais: origen,
    OrigenISO: normalizeCountryToIso(origen),
    PaisISO: normalizeCountryToIso(origen),
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

  const formatData = getFormatData(firstResult.format ? [{ name: firstResult.format[0], descriptions: firstResult.format }] : []);

  return {
    discogsId: firstResult.id ? String(firstResult.id) : '',
    img: firstResult.thumb || firstResult.cover_image || '',
    imgFULL: firstResult.cover_image || firstResult.thumb || '',
    Año: firstResult.year ? String(firstResult.year) : '',
    Tipo: formatData.Tipo,
    Formato: formatData.Formato,
    Genero: Array.isArray(firstResult.genre) ? firstResult.genre.join(', ') : '',
    Estilo: Array.isArray(firstResult.style) ? firstResult.style.join(', ') : '',
    Disqueria: Array.isArray(firstResult.label) ? cleanDiscogsName(firstResult.label[0] || '') : '',
    Catalogo: firstResult.catno || '',
    Origen: firstResult.country || '',
    Pais: firstResult.country || '',
    OrigenISO: normalizeCountryToIso(firstResult.country || ''),
    PaisISO: normalizeCountryToIso(firstResult.country || ''),
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
          Formato: item.Formato || exact.Formato || '',
          Genero: item.Genero || exact.Genero || '',
          Estilo: item.Estilo || exact.Estilo || '',
          Disqueria: item.Disqueria || exact.Disqueria || '',
          Catalogo: item.Catalogo || exact.Catalogo || '',
          Origen: item.Origen || exact.Origen || '',
          Pais: item.Pais || exact.Pais || '',
          OrigenISO: item.OrigenISO || exact.OrigenISO || '',
          PaisISO: item.PaisISO || exact.PaisISO || '',
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
      Formato: item.Formato || search.Formato || '',
      Genero: item.Genero || search.Genero || '',
      Estilo: item.Estilo || search.Estilo || '',
      Disqueria: item.Disqueria || search.Disqueria || '',
      Catalogo: item.Catalogo || search.Catalogo || '',
      Origen: item.Origen || search.Origen || '',
      Pais: item.Pais || search.Pais || '',
      OrigenISO: item.OrigenISO || search.OrigenISO || '',
      PaisISO: item.PaisISO || search.PaisISO || '',
    };
  } catch (error) {
    console.warn('No se pudo enriquecer wishlist con Discogs:', error.message);
    return item;
  }
}
