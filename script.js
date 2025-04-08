document.addEventListener("DOMContentLoaded", async () => {
    const elements = {
        // ... (mantener elementos anteriores)
        latestAlbums: document.getElementById("latest-albums"),
        featuredTracks: document.getElementById("featured-tracks")
    };

    // ... (configuración inicial y autenticación)

    async function loadHomeContent() {
        // Cargar últimos lanzamientos
        const latestAlbums = await Promise.all(allowedArtists.map(async artistName => {
            const artist = await getArtistInfo(artistName);
            const albums = await getArtistAlbums(artist.id);
            return albums[0]; // Obtener el álbum más reciente
        }));
        
        elements.latestAlbums.innerHTML = latestAlbums.map(album => `
            <div class="album-card">
                <img src="${album.images[0].url}" alt="${album.name}">
                <h3>${album.name}</h3>
                <p>${album.artists[0].name}</p>
            </div>
        `).join("");

        // Cargar recomendaciones (últimos lanzamientos)
        elements.featuredTracks.innerHTML = latestAlbums.map(album => `
            <div class="track-item">
                <span class="material-icons">music_note</span>
                <div class="track-info">
                    <h4>${album.name}</h4>
                    <p>${album.artists[0].name}</p>
                </div>
            </div>
        `).join("");
    }

    // Función corregida para botón de regreso
    function handleBackNavigation() {
        if (elements.tracksSection.classList.contains("active")) {
            showSection("artist-detail");
        } else if (elements.artistDetail.classList.contains("active")) {
            showSection("home");
        }
        updateBackButtonVisibility();
    }

    function updateBackButtonVisibility() {
        const showBack = !document.getElementById("home").classList.contains("active");
        elements.backBtn.classList.toggle("hidden", !showBack);
    }

    // Modificar función showSection
    function showSection(sectionId) {
        document.querySelectorAll(".section").forEach(section => {
            section.classList.toggle("active", section.id === sectionId);
        });
        updateBackButtonVisibility();
        updateCurrentSectionTitle(sectionId);
    }

    // ... (resto de funciones)

    // Inicialización
    await getSpotifyToken();
    loadHomeContent();
    loadLibraryArtists();
});
