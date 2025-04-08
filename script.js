document.addEventListener("DOMContentLoaded", async () => {
    // Elementos del DOM
    const elements = {
        sections: document.querySelectorAll(".section"),
        navButtons: document.querySelectorAll(".nav-btn"),
        searchInput: document.getElementById("search-input"),
        searchBtn: document.getElementById("search-btn"),
        backBtn: document.getElementById("back-btn"),
        libraryBtn: document.getElementById("library-btn"),
        artistList: document.getElementById("artist-list"),
        artistDetail: document.getElementById("artist-detail"),
        artistInfo: document.getElementById("artist-info"),
        albumList: document.getElementById("album-list"),
        tracksSection: document.getElementById("tracks"),
        albumTracksContainer: document.getElementById("album-tracks-container"),
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
        loadInitialArtists();
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
        elements.searchBtn.addEventListener("click", handleSearch);
        elements.searchInput.addEventListener("keypress", async (e) => {
            if (e.key === "Enter") await handleSearch();
        });

        // Biblioteca
        elements.libraryBtn.addEventListener("click", () => {
            showSection("home");
            loadInitialArtists();
        });

        // Botón volver
        elements.backBtn.addEventListener("click", handleBackNavigation);
    }

    // Cargar artistas iniciales
    async function loadInitialArtists() {
        elements.artistList.innerHTML = "";
        
        for (const artistName of spotifyConfig.allowedArtists) {
            const artist = await getArtistInfo(artistName);
            if (artist) {
                const card = createArtistCard(artist);
                card.addEventListener("click", () => showArtistDetail(artist));
                elements.artistList.appendChild(card);
            }
        }
    }

    // Crear tarjeta de artista
    function createArtistCard(artist) {
        const div = document.createElement("div");
        div.className = "artist-card";
        div.innerHTML = `
            <img src="${artist.images[0]?.url}">
            <h3>${artist.name}</h3>
        `;
        return div;
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
        if (activeButton) {
            elements.currentSection.textContent = 
                activeButton.querySelector("span:last-child").textContent;
        }
    }

    // Actualizar botón activo
    function updateActiveButton(activeButton) {
        elements.navButtons.forEach(button => button.classList.remove("active"));
        activeButton.classList.add("active");
    }

    // Manejar búsqueda
    async function handleSearch() {
        const query = elements.searchInput.value.trim();
        if (!query) return;

        try {
            const results = await searchSpotify(query);
            if (results.artists.length > 0) {
                showArtistDetail(results.artists[0]);
            } else if (results.albums.length > 0) {
                showAlbumTracks(await getAlbumTracks(results.albums[0].id), results.albums[0]);
            } else {
                alert("No se encontraron resultados");
            }
        } catch (error) {
            console.error("Error en búsqueda:", error);
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

    // Mostrar detalle de artista
    async function showArtistDetail(artist) {
        const albums = await getArtistAlbums(artist.id);
        
        elements.artistInfo.innerHTML = `
            <h1 class="artist-name">${artist.name}</h1>
            <p>${artist.followers?.total.toLocaleString() || '0'} seguidores</p>
        `;
        
        elements.albumList.innerHTML = albums.map(album => `
            <div class="album-item" data-album-id="${album.id}">
                <h3>${album.name}</h3>
                <p>${album.release_date.split('-')[0]} • ${album.total_tracks} canciones</p>
            </div>
        `).join("");
        
        document.querySelectorAll(".album-item").forEach(item => {
            item.addEventListener("click", async () => {
                const albumId = item.dataset.albumId;
                const album = albums.find(a => a.id === albumId);
                const tracks = await getAlbumTracks(albumId);
                showAlbumTracks(tracks, album);
            });
        });
        
        showSection("artist-detail");
        elements.backBtn.classList.remove("hidden");
    }

    // Mostrar canciones de álbum
    async function showAlbumTracks(tracks, album) {
        elements.albumTracksContainer.innerHTML = `
            <div class="album-header">
                <img src="${album.images[0]?.url}" class="album-artwork-large">
                <h2>${album.name}</h2>
                <p>${album.artists[0].name} • ${album.release_date.split('-')[0]}</p>
            </div>
            <div class="track-list">
                ${tracks.map((track, index) => `
                    <div class="track-item">
                        <span class="track-number">${index + 1}</span>
                        <div class="track-info">
                            <span class="track-name">${track.name}</span>
                            <span class="track-artist">${track.artists[0].name}</span>
                        </div>
                        <span class="track-duration">${msToTime(track.duration_ms)}</span>
                    </div>
                `).join('')}
            </div>
        `;
        
        showSection("tracks");
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

    // Obtener canciones de álbum
    async function getAlbumTracks(albumId) {
        const response = await fetch(`https://api.spotify.com/v1/albums/${albumId}/tracks`, {
            headers: { "Authorization": `Bearer ${token}` }
        });
        const data = await response.json();
        return data.items;
    }

    // Convertir milisegundos a tiempo
    function msToTime(ms) {
        const minutes = Math.floor(ms / 60000);
        const seconds = ((ms % 60000) / 1000).toFixed(0);
        return `${minutes}:${seconds.padStart(2, "0")}`;
    }

    // Manejar navegación hacia atrás
    function handleBackNavigation() {
        if (elements.tracks.classList.contains("active")) {
            showSection("artist-detail");
        } else if (elements.artistDetail.classList.contains("active")) {
            showSection("home");
            elements.backBtn.classList.add("hidden");
        }
    }

    // Iniciar aplicación
    init();
});
