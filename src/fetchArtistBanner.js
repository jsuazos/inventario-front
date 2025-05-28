export default async function fetchArtistBanner(mbid) {
    const fanartUrl = `https://inventario-server-pw1j.onrender.com/api/fanart?mbid=${mbid}`;
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