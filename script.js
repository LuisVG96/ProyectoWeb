document.addEventListener("DOMContentLoaded", async () => {
    // Elementos del DOM
    const elements = {
        sections: document.querySelectorAll(".section"),
        navButtons: document.querySelectorAll(".nav-btn"),
        searchInput: document.getElementById("search-input"),
        backBtn: document.getElementById("back-btn"),
        artistList: document.getElementById("artist-list"),
        albumList: document.getElementById("album-list"),
        featuredArtists: document.getElementById("featured-artists"),
        searchResults: document.getElementById("search-results"),
        currentSection: document.getElementById("current-section")
    };

    // Configuración de Spotify
    const spotifyConfig = {
        clientId: "f6967377460f424db33c6ae8e7183eb9",
        clientSecret: "9002aceb05a34a60b921409e7b8f4d7a",
        allowedArtists: ["the weeknd", "linkin park", "sabrina carpenter"]
    };

    let token = "";

    // Inicialización
    async function init() {
        await getSpotifyToken();
        setupEventListeners();
        loadInitialContent();
    }

    // Autenticación con Spotify
    async function getSpotifyToken() {
        try {
            const response = await fetch("https://accounts.spotify.com/api/token", {
                method: "POST",
                headers: {
                    "Content-Type": "application/x-www-form-urlencoded",
                    "Authorization": "Basic " + btoa(`${spotifyConfig.clientId}:${spotifyConfig.clientSecret}`)
                },
                body: "grant_type=client_credentials"
            });
            const data = await response.json();
            token = data.access_token;
        } catch (error) {
            console.error("Error al obtener token:", error);
        }
    }

    // Configurar event listeners
    function setupEventListeners() {
        // Navegación
        elements.navButtons.forEach(button => {
            button.addEventListener("click", () => {
                const sectionId = button.dataset.section;
                showSection(sectionId);
                updateActiveButton(button);
            });
        });

        // Búsqueda
        elements.searchInput.addEventListener("keypress", async (e) => {
            if (e.key === "Enter") {
                await handleSearch();
            }
        });

        // Botón volver
        elements.backBtn.addEventListener("click", handleBackNavigation);
    }

    // Cargar contenido inicial
    function loadInitialContent() {
        loadFeaturedArtists();
        loadLibraryArtists();
    }

    // Mostrar sección
    function showSection(sectionId) {
        elements.sections.forEach(section => {
            section.classList.toggle("active", section.id === sectionId);
        });
        updateCurrentSectionTitle(sectionId);
    }

    // Actualizar título de sección
    function updateCurrentSectionTitle(sectionId) {
        const activeButton = document.querySelector(`[data-section="${sectionId}"]`);
        elements.currentSection.textContent = 
            activeButton.querySelector("span:last-child").textContent;
    }

    // Manejar búsqueda
    async function handleSearch() {
        const query = elements.searchInput.value.trim();
        if (!query) return;

        try {
            const results = await searchSpotify(query);
            displaySearchResults(results);
        } catch (error) {
            console.error("Error en búsqueda:", error);
            elements.searchResults.innerHTML = "<p>Error al buscar</p>";
        }
    }

    // Buscar en Spotify
    async function searchSpotify(query) {
        const response = await fetch(
            `https://api.spotify.com/v1/search?q=${encodeURIComponent(query)}&type=artist,album`,
            { headers: { Authorization: `Bearer ${token}` } }
        );
        const data = await response.json();
        
        return {
            artists: data.artists?.items.filter(artist => 
                spotifyConfig.allowedArtists.includes(artist.name.toLowerCase())
            ) || [],
            albums: data.albums?.items.filter(album =>
                spotifyConfig.allowedArtists.includes(album.artists[0].name.toLowerCase())
            ) || []
        };
    }

    // Mostrar resultados de búsqueda
    function displaySearchResults(results) {
        if (results.artists.length === 0 && results.albums.length === 0) {
            elements.searchResults.innerHTML = "<p>No se encontraron resultados</p>";
            return;
        }

        elements.searchResults.innerHTML = [
            ...results.artists.map(createArtistResult),
            ...results.albums.map(createAlbumResult)
        ].join("");
    }

    // Crear tarjeta de artista para resultados
    function createArtistResult(artist) {
        return `
            <div class="section-card artist-result" data-id="${artist.id}" data-type="artist">
                <h3>${artist.name}</h3>
                <p>Artista</p>
            </div>
        `;
    }

    // Crear tarjeta de álbum para resultados
    function createAlbumResult(album) {
        return `
            <div class="section-card album-result" data-id="${album.id}" data-type="album">
                <h3>${album.name}</h3>
                <p>Álbum • ${album.artists[0].name}</p>
            </div>
        `;
    }

    // Cargar artistas destacados
    function loadFeaturedArtists() {
        elements.featuredArtists.innerHTML = spotifyConfig.allowedArtists
            .map(artist => `<li>${artist}</li>`)
            .join("");
    }

    // Cargar artistas en biblioteca
    function loadLibraryArtists() {
        elements.artistList.innerHTML = spotifyConfig.allowedArtists
            .map(artist => `
                <div class="artist-card" data-artist="${artist}">
                    <span class="material-icons">person</span>
                    <h3>${artist}</h3>
                </div>
            `).join("");
        
        document.querySelectorAll(".artist-card").forEach(card => {
            card.addEventListener("click", () => showArtistAlbums(card.dataset.artist));
        });
    }

    // Mostrar álbumes de artista
    async function showArtistAlbums(artistName) {
        try {
            const artist = await getArtistInfo(artistName);
            const albums = await getArtistAlbums(artist.id);
            
            elements.artistList.classList.add("hidden");
            elements.albumList.classList.remove("hidden");
            elements.backBtn.classList.remove("hidden");
            
            elements.albumList.innerHTML = `
                <h2>${artist.name}</h2>
                ${albums.map(album => `
                    <div class="section-card" data-album-id="${album.id}">
                        <h3>${album.name}</h3>
                        <p>${album.release_date.split('-')[0]} • ${album.total_tracks} canciones</p>
                    </div>
                `).join("")}
            `;
        } catch (error) {
            console.error("Error al cargar álbumes:", error);
        }
    }

    // Obtener información de artista
    async function getArtistInfo(artistName) {
        const response = await fetch(
            `https://api.spotify.com/v1/search?q=${encodeURIComponent(artistName)}&type=artist`,
            { headers: { Authorization: `Bearer ${token}` } }
        );
        const data = await response.json();
        return data.artists.items[0];
    }

    // Obtener álbumes de artista
    async function getArtistAlbums(artistId) {
        const response = await fetch(`https://api.spotify.com/v1/artists/${artistId}/albums`, {
            headers: { "Authorization": `Bearer ${token}` }
        });
        const data = await response.json();
        return data.items;
    }

    // Manejar navegación hacia atrás
    function handleBackNavigation() {
        if (!elements.albumList.classList.contains("hidden")) {
            elements.albumList.classList.add("hidden");
            elements.artistList.classList.remove("hidden");
            elements.backBtn.classList.add("hidden");
        }
    }

    // Actualizar botón activo
    function updateActiveButton(activeButton) {
        elements.navButtons.forEach(button => button.classList.remove("active"));
        activeButton.classList.add("active");
    }

    // Iniciar aplicación
    init();
});
