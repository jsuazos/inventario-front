export default function toggleLoader (show) {
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
};