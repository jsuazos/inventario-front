import obtenerConfiguracionActiva from "./obtenerConfiguracionActiva.js";

export default async function fetchArtistBanner(mbid) {
    const { apiUrl } = await obtenerConfiguracionActiva();
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