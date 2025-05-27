// main.js

window.addEventListener('DOMContentLoaded', () => {

  let libraryData = navigator.onLine ? JSON.parse(localStorage.getItem('libraryData')) : [];
  let artistDetails = {};

  const searchInput = document.getElementById('searchInput');
  const filterType = document.getElementById('filterType');
  const filterGenre = document.getElementById('filterGenre');
  const filterArtist = document.getElementById('filterArtist');
  const filterYear = document.getElementById('filterYear');

  async function loadLibrary() {
    toggleLoader(true);
    if (libraryData === null || libraryData.length === 0) {
      
    await fetch("https://inventario-server-pw1j.onrender.com/api/inventario")
      .then(res => res.json())
      .then(data => {
        libraryData = data.data || [];
        localStorage.setItem('libraryData', JSON.stringify(libraryData));
      });
    }
    populateFilters();
    displayLibrary(libraryData);
    aplicarColoresPorGenero();
    toggleLoader(false);
  }

  function populateFilters() {
    const types = new Set(), genres = new Set(), artists = new Set(), years = new Set();
    libraryData.forEach(item => {
      types.add(item.Tipo);
      artists.add(item.Artista);
      years.add(item.Año);
    });
    obtenerGeneros(libraryData).forEach(genero => genres.add(genero));
    fillSelect('filterType', types);
    fillSelect('filterGenre', genres);
    fillSelect('filterArtist', artists);
    fillSelect('filterYear', years);
  }

  function fillSelect(id, values) {
    const select = document.getElementById(id);
    [...values].sort().forEach(v => {
      if(v === '') return;
      const option = document.createElement('option');
      option.value = v;
      option.textContent = v;
      select.appendChild(option);
    });
  }

  async function fetchArtistBanner(mbid) {
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

  async function fetchArtistDetails(artist) {
    try {
      const discogsRes = await fetch(`https://inventario-server-pw1j.onrender.com/api/discogs?q=${encodeURIComponent(artist)}`);
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

  async function displayLibrary(items) {
    toggleLoader(true);
    const artistBanner = document.getElementById('artistBanner');
    const grid = document.getElementById('libraryGrid');
    const counter = document.getElementById('resultCount');
    grid.innerHTML = '';
    artistBanner.innerHTML = '';
    counter.textContent = `Mostrando ${items.length} resultados ${!navigator.onLine ? '(la información puede que no este actualizada ya que no tienes conexión a internet)' : ''}`;

    // si sólo hay un artista, mostrar cabecera con datos del artista
    const artistFilter = filterArtist.value;
    if (artistFilter) {
      if (navigator.onLine) {
        await fetchArtistDetails(artistFilter);
      }
      
    }

    items.forEach((item, index) => {
      const imageUrl =  item.imgFULL && 
                        item.imgFULL.length > 0 && 
                        item.imgFULL !== 'No matching results' && 
                        item.imgFULL !== '#ERROR!' ? 
                        item.imgFULL : item.img && item.img.length > 10 ? item.img : 'https://via.placeholder.com/80x80?text=🎵';
      const card = document.createElement('div');
      const generoPrincipal = item.Genero.toLowerCase().split(',')[0];
      card.className = 'col-xxl-2 col-xl-2 col-lg-2 col-md-4 col-sm-6 col-6 h-100';
      card.innerHTML = `
        <div class="card-with-border rounded-1">
          <div class ="card position-relative overflow-hidden border-0 rounded-1">
            <img src="${imageUrl}" class="" alt="Carátula ${index}">
            <div class="borde-overlay" data-genero="${ generoPrincipal }"></div>
            <div class="card-img-overlay d-flex flex-column justify-content-end pb-1">
              <div class="position-absolute top-0 start-0 d-flex gap-2 p-3">
                ${item.ID !== '' ? `<a href="https://www.discogs.com/es/release/${ item.ID.slice(1)}" target="_blank" class="btn btn-dark btn-sm btn-discorgs">Discogs</a>` : '' }"
              </div>
              <ul class="list-unstyled text-white">
                <li class="fw-bold text-hide">${ item.Artista }</li>
                <li class="text-hide"><small>${item.Disco}</small></li>
                <li class="text-hide"><small>${item.Año}</small></li>
                <li><span class="badge badge-type mt-1">${item.Tipo}</span></li>
              </ul>
            </div>
          </div>
          <div class="side-label px-1 py-3">${ item.Genero.toUpperCase().substring(0, 20) }</div>
          <!--<img class="side-img" src="https://flagcdn.com/${item.OrigenISO.toLowerCase()}.svg" alt="Bandera de ${item.Origen}" title="${item.Origen}" width="25"/>-->
        </div>
      `;
      grid.appendChild(card);
    });
    aplicarColoresPorGenero();
    toggleLoader(false);
  }

  function filterLibrary() {
    const searchText = searchInput.value.toLowerCase();
    const type = filterType.value;
    const genre = filterGenre.value;
    const artist = filterArtist.value;
    const year = filterYear.value;

    const filtered = libraryData.filter(item => {
      return (!type || item.Tipo === type)
        // && (!genre || item.Genero === genre)
        && (!genre || item.Genero.includes(genre))
        && (!artist || item.Artista === artist)
        && (!year || item.Año.toString() === year)
        && (item.Tipo.toLowerCase().includes(searchText) || item.Genero.toLowerCase().includes(searchText) || item.Disco.toLowerCase().includes(searchText) || item.Artista.toLowerCase().includes(searchText) || item.Año.toString().includes(searchText));
    });
    displayLibrary(filtered);
  }

  const obtenerGeneros = (inventario) => {
    let generos = [];
    inventario.forEach(elem => {
      if (elem.Genero.includes(',')) {
        generos.push(...elem.Genero.replaceAll(', ', ',').split(','));
      } else {
        generos.push(elem.Genero);
      }

      generos = [...new Set(generos)];
    });

    // CORRECCION, AGREGA DOS VECES World & Country y con back slash 
    let index = generos.indexOf(`"World & Country"`);
    if (index !== -1) {
      generos.splice(index, 1);
    }

    return generos;
  };

  function toggleLoader(show) {
    const loader = document.getElementById('loader');
    if (loader) {
      loader.style.display = show ? 'block' : 'none';
      if (show) {
        // searchInput.setAttribute('disabled', 'disabled');
        filterType.setAttribute('disabled', 'disabled');
        filterGenre.setAttribute('disabled', 'disabled');
        filterArtist.setAttribute('disabled', 'disabled');
        filterYear.setAttribute('disabled', 'disabled');
      } else {
        // searchInput.removeAttribute('disabled');
        filterType.removeAttribute('disabled');
        filterGenre.removeAttribute('disabled');
        filterArtist.removeAttribute('disabled');
        filterYear.removeAttribute('disabled');
      }
    }
  }

  searchInput.addEventListener('input', filterLibrary);
  filterType.addEventListener('change', filterLibrary);
  filterGenre.addEventListener('change', filterLibrary);
  filterArtist.addEventListener('change', filterLibrary);
  filterYear.addEventListener('change', filterLibrary);

  document.addEventListener('click', function (e) {
    if (e.target.classList.contains('card-title')) {
      const index = e.target.getAttribute('data-index');
      const item = libraryData[index];
      document.getElementById('discoModalLabel').textContent = item.Disco;
      document.getElementById('discoModalBody').innerHTML = `
        <img src="${item.img || 'https://via.placeholder.com/300x300?text=🎵'}" class="img-fluid mb-3">
        <p><strong>Artista:</strong> ${item.Artista}</p>
        <p><strong>Tipo:</strong> ${item.Tipo}</p>
        <p><strong>Género:</strong> ${item.Genero}</p>
        <p><strong>Año:</strong> ${item.Año}</p>
      `;
      const modal = new bootstrap.Modal(document.getElementById('discoModal'));
      modal.show();
    }
    if (e.target.classList.contains('artist-link')) {
      e.preventDefault();
      const artist = e.target.getAttribute('data-artist');
      filterArtist.value = artist;
      filterLibrary();
    }
  });

  document.getElementById('resetButton').addEventListener('click', () => {
    filterType.value = '';
    filterGenre.value = '';
    filterArtist.value = '';
    filterYear.value = '';
    searchInput.value = '';

    // Limpiar banner si existe
    const banner = document.getElementById('artistBanner');
    if (banner) banner.innerHTML = '';

    const grid = document.getElementById('libraryGrid');
    if (grid) grid.innerHTML = '';

    displayLibrary(libraryData);
  });
  const generoColores = {};

  const paletaTidal = [
    "#b02121",
    "#47237b",
    "#6C5CE7",
    "#00B894",
    "#0984E3",
    "#E17055",
    "#74B9FF",
    "#55EFC4" 
  ];

  function obtenerColorPorGenero(genero) {
    if (!generoColores[genero]) {
      const index = Object.keys(generoColores).length % paletaTidal.length;
      generoColores[genero] = paletaTidal[index];
    }
    return generoColores[genero];
  }

  function aplicarColoresPorGenero() {

    document.querySelectorAll('.borde-overlay').forEach(overlay => {
      const genero = overlay.dataset.genero;
      const color = obtenerColorPorGenero(genero);
      
      overlay.style.borderTop = `10px solid ${hexToRgba(color, 0.7)}`;
      overlay.style.borderBottom = `10px solid ${hexToRgba(color, 0.7)}`;
      overlay.style.borderLeft = `10px solid ${hexToRgba(color, 0.7)}`;
      overlay.style.borderRight = `35px solid ${hexToRgba(color, 0.7)}`;

      overlay.addEventListener('mouseenter', () => {
        overlay.style.borderTop = `10px solid ${hexToRgba(color, 1)}`;
        overlay.style.borderBottom = `10px solid ${hexToRgba(color, 1)}`;
        overlay.style.borderLeft = `10px solid ${hexToRgba(color, 1)}`;
        overlay.style.borderRight = `35px solid ${hexToRgba(color, 1)}`;
      });

      overlay.addEventListener('mouseleave', () => {
        overlay.style.borderTop = `10px solid ${hexToRgba(color, 0.7)}`;
        overlay.style.borderBottom = `10px solid ${hexToRgba(color, 0.7)}`;
        overlay.style.borderLeft = `10px solid ${hexToRgba(color, 0.7)}`;
        overlay.style.borderRight = `35px solid ${hexToRgba(color, 0.7)}`;
      });
    });

  }

  function hexToRgba(hex, alpha = 1) {
    // Elimina el símbolo #
    hex = hex.replace(/^#/, '');

    // Expande colores cortos como #123 a #112233
    if (hex.length === 3) {
      hex = hex.split('').map(char => char + char).join('');
    }

    // Extrae componentes
    const bigint = parseInt(hex, 16);
    const r = (bigint >> 16) & 255;
    const g = (bigint >> 8) & 255;
    const b = bigint & 255;

    return `rgba(${r}, ${g}, ${b}, ${alpha})`;
  }

  

  loadLibrary();
});