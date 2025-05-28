export default async function fetchArtistMBID(artist) {
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