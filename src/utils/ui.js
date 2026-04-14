export function toggleLoader (show) {
    const loader = document.getElementById('loader');
    if (loader) {
        loader.style.display = show ? 'block' : 'none';
        if (show) {
        // searchInput.setAttribute('disabled', 'disabled');
        // filterType.setAttribute('disabled', 'disabled');
        // filterGenre.setAttribute('disabled', 'disabled');
        // filterArtist.setAttribute('disabled', 'disabled');
        // filterYear.setAttribute('disabled', 'disabled');
        } else {
        // searchInput.removeAttribute('disabled');
        // filterType.removeAttribute('disabled');
        // filterGenre.removeAttribute('disabled');
        // filterArtist.removeAttribute('disabled');
        // filterYear.removeAttribute('disabled');
        }
    }
}

export function toggleSidebar() {
    const tSidebar = document.getElementById("toggleSidebar");
    const sidebar = document.getElementById("sidebar");

    tSidebar.addEventListener("click", () => {
        sidebar.classList.toggle("show");
        document.body.classList.toggle("sidebar-open");
    });

    // Cerrar al hacer clic fuera
    document.addEventListener("click", (e) => {
    if (!sidebar.contains(e.target) && !tSidebar.contains(e.target)) {
        sidebar.classList.remove("show");
        document.body.classList.remove("sidebar-open");
    }
    });
}

export function loadAlphabet(){
    const links = Array.from(document.querySelectorAll('#alphabet a'));
    const sections = [];

    links.forEach(link => {
        const targetId = link.getAttribute('href').replace('#', '');
        const target = document.getElementById(targetId);

        link.addEventListener('click', () => {
            requestAnimationFrame(() => link.blur());
        });

        link.classList.remove('text-muted', 'is-active');
        link.style.pointerEvents = '';

        if (!target) {
            link.classList.add('text-muted');
            link.style.pointerEvents = 'none';
            return;
        }

        sections.push({ link, target });
    });

    if (window.alphabetObserver) {
        window.alphabetObserver.disconnect();
    }

    const setActiveLink = (activeId) => {
        links.forEach(link => {
            const targetId = link.getAttribute('href').replace('#', '');
            link.classList.toggle('is-active', targetId === activeId);
        });
    };

    if (!sections.length) {
        return;
    }

    const updateActiveFromScroll = () => {
        const triggerOffset = 140;
        let currentSection = sections[0].target.id;

        const scrollBottom = window.innerHeight + window.scrollY;
        const documentHeight = document.documentElement.scrollHeight;

        if (documentHeight - scrollBottom < 24) {
            setActiveLink(sections[sections.length - 1].target.id);
            return;
        }

        sections.forEach(({ target }) => {
            if (target.getBoundingClientRect().top <= triggerOffset) {
                currentSection = target.id;
            }
        });

        setActiveLink(currentSection);
    };

    window.alphabetObserver = new IntersectionObserver((entries) => {
        const visibleEntries = entries
            .filter(entry => entry.isIntersecting)
            .sort((a, b) => a.boundingClientRect.top - b.boundingClientRect.top);

        if (visibleEntries.length > 0) {
            setActiveLink(visibleEntries[0].target.id);
            return;
        }

        updateActiveFromScroll();
    }, {
        root: null,
        rootMargin: '-120px 0px -70% 0px',
        threshold: 0
    });

    sections.forEach(({ target }) => {
        window.alphabetObserver.observe(target);
    });

    updateActiveFromScroll();
}
