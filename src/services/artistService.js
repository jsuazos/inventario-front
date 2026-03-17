import configService from './configService.js';

async function fetchArtistMBID(artist) {
    try {
      const res = await fetch(`https://musicbrainz.org/ws/2/artist/?query=artist:${encodeURIComponent(artist)}&fmt=json`);
      const data = await res.json();
      if (data.artists && data.artists.length > 0) {
        return data.artists[0].id;
      }
    } catch (e) {
      console.warn('MusicBrainz error:', e);
    }
    return null;
  }

async function fetchArtistBanner(mbid) {
    const { apiUrl } = await configService();
    const base = apiUrl.replace(/\/$/, "");
    const fanartUrl = `${base}/fanart?mbid=${mbid}`;

    try {
      const res = await fetch(fanartUrl);
      if (!res.ok) return {};
      const data = await res.json();
      return {
        background: data.artistbackground?.[0]?.url || null,
        logo: data.hdmusiclogo?.[0]?.url || null
      };
    } catch (e) {
      console.warn('Fanart.tv error:', e);
    }
    return {};
  }

let artistDetails = {};

export default async function fetchArtistDetails(artist) {
    try {
      const { apiUrl } = await configService();
      const base = apiUrl.replace(/\/$/, "");
      const discogsRes = await fetch(`${base}/discogs?q=${encodeURIComponent(artist)}`);
      const discogsData = await discogsRes.json();
      let profileData = {};
      if (discogsData.results && discogsData.results.length > 0) {
        const profileRes = await fetch(discogsData.results[0].resource_url);
        profileData = await profileRes.json();
      }

      const mbid = await fetchArtistMBID(artist);
      const fanartData = mbid ? await fetchArtistBanner(mbid) : {};

      artistDetails[artist] = {
        id: profileData.id || null,
        name: profileData.name || artist,
        image: fanartData.background || (profileData.images ? profileData.images[0]?.uri : null),
        logo: fanartData.logo || null,
        bio: profileData.profile || 'Sin descripción disponible.'
      };

      // Mostrar encabezado con logo si existe
      const bannerContainer = document.getElementById('artistBanner');
      if (bannerContainer) {
        bannerContainer.innerHTML = '';
        const wrapper = document.createElement('div');
        wrapper.className = 'p-4 mb-4 text-white rounded artist-banner';
        wrapper.style.background = `linear-gradient(rgba(0,0,0,0.6), rgba(0,0,0,0.6)), url('${artistDetails[artist].image}') center/cover no-repeat`;

        wrapper.innerHTML = `
          <div class="position-relative d-flex align-items-center gap-3 flex-wrap">
            ${artistDetails[artist].logo ? `<img src="${artistDetails[artist].logo}" alt="logo" style="max-height: 150px;">` : `<h2 class="m-0 my-5">${artistDetails[artist].name}</h2>`}

            <div class="position-absolute top-0 end-0 d-flex gap-2 p-2">
              ${mbid ? `<a href="https://www.discogs.com/es/artist/${encodeURIComponent(artistDetails[artist].id)}" target="_blank" class="btn btn-outline-light btn-sm">Discogs</a>` : ''}
              ${mbid ? `<a href="https://musicbrainz.org/artist/${mbid}" target="_blank" class="btn btn-outline-light btn-sm">MusicBrainz</a>` : ''}
            </div>
          </div>
          <!--<p class="mt-2">${artistDetails[artist].bio}</p>-->
        `;

        bannerContainer.appendChild(wrapper);
      }

      return artistDetails[artist];
    } catch (e) {
      console.error('Error obteniendo datos del artista', e);
    }
    return null;
  }
