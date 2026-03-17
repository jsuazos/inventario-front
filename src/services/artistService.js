import configService from './configService.js';
import { errorHandler } from './errorHandler.js';

// Sistema de rate limiting para evitar 429 errors
export class RateLimiter {
  constructor(maxConcurrent = 2, delay = 1000) {
    this.maxConcurrent = maxConcurrent;
    this.delay = delay;
    this.running = 0;
    this.queue = [];
  }

  async execute(fn) {
    return new Promise((resolve, reject) => {
      this.queue.push({ fn, resolve, reject });
      this.processQueue();
    });
  }

  async processQueue() {
    if (this.running >= this.maxConcurrent || this.queue.length === 0) {
      return;
    }

    this.running++;
    const { fn, resolve, reject } = this.queue.shift();

    try {
      const result = await fn();
      resolve(result);
    } catch (error) {
      reject(error);
    } finally {
      this.running--;
      // Delay antes de procesar la siguiente solicitud
      setTimeout(() => this.processQueue(), this.delay);
    }
  }
}

const imageRateLimiter = new RateLimiter(1, 2000); // Máximo 1 solicitud cada 2 segundos

async function fetchArtistMBID(artist) {
  return imageRateLimiter.execute(async () => {
    try {
      const res = await fetch(`https://musicbrainz.org/ws/2/artist/?query=artist:${encodeURIComponent(artist)}&fmt=json`, {
        signal: AbortSignal.timeout(5000) // 5 segundos timeout
      });
      const data = await res.json();
      if (data.artists && data.artists.length > 0) {
        return data.artists[0].id;
      }
    } catch (e) {
      errorHandler.handleNetworkError(e, 'fetchArtistMBID');
    }
    return null;
  });
}

async function fetchArtistBanner(mbid) {
  return imageRateLimiter.execute(async () => {
    const { apiUrl } = await configService();
    const base = apiUrl.replace(/\/$/, "");
    const fanartUrl = `${base}/fanart?mbid=${mbid}`;

    try {
      const res = await fetch(fanartUrl, {
        signal: AbortSignal.timeout(5000) // 5 segundos timeout
      });
      if (!res.ok) return {};
      const data = await res.json();
      return {
        background: data.artistbackground?.[0]?.url || null,
        logo: data.hdmusiclogo?.[0]?.url || null
      };
    } catch (e) {
      errorHandler.handleNetworkError(e, 'fetchArtistBanner');
    }
    return {};
  });
}

let artistDetails = {};

export default async function fetchArtistDetails(artist) {
  // Verificar si ya tenemos los datos en cache
  if (artistDetails[artist]) {
    displayArtistBanner(artistDetails[artist]);
    return artistDetails[artist];
  }

  return imageRateLimiter.execute(async () => {
    try {
      const { apiUrl } = await configService();
      const base = apiUrl.replace(/\/$/, "");

      // Fetch datos de Discogs con timeout
      const discogsRes = await fetch(`${base}/discogs?q=${encodeURIComponent(artist)}`, {
        signal: AbortSignal.timeout(5000)
      });
      const discogsData = await discogsRes.json();

      let profileData = {};
      if (discogsData.results && discogsData.results.length > 0) {
        const profileRes = await fetch(discogsData.results[0].resource_url, {
          signal: AbortSignal.timeout(5000)
        });
        profileData = await profileRes.json();
      }

      // Obtener MBID y datos de Fanart.tv
      const mbid = await fetchArtistMBID(artist);
      const fanartData = mbid ? await fetchArtistBanner(mbid) : {};

      artistDetails[artist] = {
        id: profileData.id || null,
        name: profileData.name || artist,
        image: fanartData.background || (profileData.images ? profileData.images[0]?.uri : null),
        logo: fanartData.logo || null,
        bio: profileData.profile || 'Sin descripción disponible.',
        mbid: mbid
      };

      displayArtistBanner(artistDetails[artist]);
      return artistDetails[artist];
    } catch (e) {
      errorHandler.handleApiError(e, 'fetchArtistDetails');
      // Devolver datos básicos si hay error
      const fallbackData = {
        id: null,
        name: artist,
        image: null,
        logo: null,
        bio: 'Información no disponible temporalmente.'
      };
      displayArtistBanner(fallbackData);
      return fallbackData;
    }
  });
}

function displayArtistBanner(artistData) {
  const bannerContainer = document.getElementById('artistBanner');
  if (bannerContainer) {
    bannerContainer.innerHTML = '';
    const wrapper = document.createElement('div');
    wrapper.className = 'p-4 mb-4 text-white rounded artist-banner';

    // Solo usar imagen de background si existe y no es de Discogs (para evitar 429)
    if (artistData.image && !artistData.image.includes('discogs.com')) {
      wrapper.style.background = `linear-gradient(rgba(0,0,0,0.6), rgba(0,0,0,0.6)), url('${artistData.image}') center/cover no-repeat`;
    } else {
      wrapper.style.background = 'linear-gradient(rgba(0,0,0,0.8), rgba(0,0,0,0.8))';
    }

    wrapper.innerHTML = `
      <div class="position-relative d-flex align-items-center gap-3 flex-wrap">
        ${artistData.logo ? `<img src="${artistData.logo}" alt="logo" style="max-height: 150px;">` : `<h2 class="m-0 my-5">${artistData.name}</h2>`}

        <div class="position-absolute top-0 end-0 d-flex gap-2 p-2">
          ${artistData.id ? `<a href="https://www.discogs.com/es/artist/${encodeURIComponent(artistData.id)}" target="_blank" class="btn btn-outline-light btn-sm">Discogs</a>` : ''}
          ${artistData.mbid ? `<a href="https://musicbrainz.org/artist/${artistData.mbid}" target="_blank" class="btn btn-outline-light btn-sm">MusicBrainz</a>` : ''}
        </div>
      </div>
      <!--<p class="mt-2">${artistData.bio}</p>-->
    `;

    bannerContainer.appendChild(wrapper);
  }
}
