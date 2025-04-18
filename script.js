document.addEventListener("DOMContentLoaded", async () => {
    const elements = {
        artistList: document.getElementById("artist-list"),
        artistDetail: document.getElementById("artist-detail"),
        tracksSection: document.getElementById("tracks"),
        backBtn: document.getElementById("back-btn"),
        searchInput: document.getElementById("search"),
        searchBtn: document.getElementById("search-btn")
    };

    const clientId = "f6967377460f424db33c6ae8e7183eb9";
    const clientSecret = "9002aceb05a34a60b921409e7b8f4d7a";
    const allowedArtists = ["the weeknd", "linkin park", "sabrina carpenter"];
    let token = "";

    // Autenticación
    async function getToken() {
        const response = await fetch("https://accounts.spotify.com/api/token", {
            method: "POST",
            headers: {
                "Content-Type": "application/x-www-form-urlencoded",
                "Authorization": "Basic " + btoa(clientId + ":" + clientSecret)
            },
            body: "grant_type=client_credentials"
        });
        const data = await response.json();
        token = data.access_token;
    }

    // Búsqueda mejorada (artistas, álbumes y canciones)
    async function search(query) {
        try {
            const response = await fetch(
                `https://api.spotify.com/v1/search?q=${encodeURIComponent(query)}&type=artist,album,track`,
                { headers: { Authorization: `Bearer ${token}` } }
            );
            const data = await response.json();
            
            // Filtrar resultados solo para artistas permitidos
            const filteredArtists = data.artists?.items.filter(artist => 
                allowedArtists.includes(artist.name.toLowerCase())
            ) || [];
            
            const filteredAlbums = data.albums?.items.filter(album =>
                album.artists && album.artists.length > 0 && 
                allowedArtists.includes(album.artists[0].name.toLowerCase())
            ) || [];
            
            const filteredTracks = data.tracks?.items.filter(track =>
                track.artists && track.artists.length > 0 &&
                allowedArtists.includes(track.artists[0].name.toLowerCase())
            ) || [];
            
            return {
                artists: filteredArtists,
                albums: filteredAlbums,
                tracks: filteredTracks
            };
        } catch (error) {
            console.error("Error en la búsqueda:", error);
            return { artists: [], albums: [], tracks: [] };
        }
    }

    // Obtener artista
    async function getArtist(artistName) {
        const response = await fetch(
            `https://api.spotify.com/v1/search?q=${encodeURIComponent(artistName)}&type=artist`,
            { headers: { Authorization: `Bearer ${token}` } }
        );
        const data = await response.json();
        return data.artists?.items[0];
    }

    // Obtener álbumes
    async function getAlbums(artistId) {
        const response = await fetch(`https://api.spotify.com/v1/artists/${artistId}/albums`, {
            headers: { "Authorization": `Bearer ${token}` }
        });
        const data = await response.json();
        return data.items;
    }

    // Obtener canciones
    async function getTracks(albumId) {
        const response = await fetch(`https://api.spotify.com/v1/albums/${albumId}/tracks`, {
            headers: { "Authorization": `Bearer ${token}` }
        });
        const data = await response.json();
        return data.items;
    }

    // Cargar artistas iniciales
    async function loadInitialArtists() {
        elements.artistList.innerHTML = "";
        
        for (const artistName of allowedArtists) {
            const artist = await getArtist(artistName);
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
            <img src="${artist.images[0]?.url || 'https://via.placeholder.com/150'}">
            <h3>${artist.name}</h3>
        `;
        return div;
    }

    // Mostrar detalle de artista
    async function showArtistDetail(artist) {
        const albums = await getAlbums(artist.id);
        
        elements.artistList.classList.add("hidden");
        elements.artistDetail.classList.remove("hidden");
        elements.backBtn.classList.remove("hidden");
        
        elements.artistDetail.innerHTML = `
            <div class="artist-header">
                <div class="artist-info">
                    <h1 class="artist-name">${artist.name}</h1>
                </div>
            </div>
            <div class="album-list">
                ${albums.map(album => `
                    <div class="album-item" data-album-id="${album.id}">
                        <div class="album-meta">
                            <h3>${album.name}</h3>
                            <span class="album-year">${album.release_date.split('-')[0]}</span>
                        </div>
                    </div>
                `).join('')}
            </div>
        `;

        document.querySelectorAll(".album-item").forEach(albumElement => {
            albumElement.addEventListener("click", async (e) => {
                const albumId = e.currentTarget.dataset.albumId;
                const tracks = await getTracks(albumId);
                showAlbumTracks(tracks, albumId);
            });
        });
    }

    // Mostrar álbum y canciones
    async function showAlbumTracks(tracks, albumId) {
        const albumResponse = await fetch(`https://api.spotify.com/v1/albums/${albumId}`, {
            headers: { "Authorization": `Bearer ${token}` }
        });
        const album = await albumResponse.json();
        
        elements.artistDetail.classList.add("hidden");
        elements.tracksSection.classList.remove("hidden");
        
        elements.tracksSection.innerHTML = `
            <div class="album-tracks-container">
                <div class="album-artwork-section">
                    <img src="${album.images[0]?.url || 'https://via.placeholder.com/300'}" class="album-artwork-large">
                    <h2>${album.name}</h2>
                    <p class="album-artist">${album.artists[0].name}</p>
                    <p class="album-year">${album.release_date.split('-')[0]}</p>
                </div>
                
                <div class="track-list-section">
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
                </div>
            </div>
        `;
    }

    // Mostrar resultados de búsqueda de canciones
    function showTrackResults(tracks) {
        elements.artistList.classList.add("hidden");
        elements.artistDetail.classList.add("hidden");
        elements.tracksSection.classList.remove("hidden");
        elements.backBtn.classList.remove("hidden");
        
        elements.tracksSection.innerHTML = `
            <div class="search-results-container">
                <h2>Resultados de búsqueda para: "${elements.searchInput.value}"</h2>
                <div class="track-list">
                    ${tracks.map(track => `
                        <div class="track-item">
                            <div class="track-info">
                                <span class="track-name">${track.name}</span>
                                <span class="track-artist">${track.artists.map(a => a.name).join(", ")}</span>
                                <span class="track-album">Álbum: ${track.album.name}</span>
                            </div>
                            <span class="track-duration">${msToTime(track.duration_ms)}</span>
                        </div>
                    `).join('')}
                </div>
            </div>
        `;
    }

    // Convertir milisegundos a tiempo
    function msToTime(ms) {
        const minutes = Math.floor(ms / 60000);
        const seconds = ((ms % 60000) / 1000).toFixed(0);
        return `${minutes}:${seconds.padStart(2, "0")}`;
    }

    // Función para ejecutar la búsqueda
    async function executeSearch() {
        if (!elements.searchInput.value.trim()) return;
        
        if (!token) await getToken();
        const results = await search(elements.searchInput.value);
        
        if (results.artists.length > 0) {
            showArtistDetail(results.artists[0]);
        } else if (results.albums.length > 0) {
            showAlbumTracks(await getTracks(results.albums[0].id), results.albums[0].id);
        } else if (results.tracks.length > 0) {
            showTrackResults(results.tracks);
        } else {
            alert("No se encontraron resultados válidos");
        }
    }

    // Event listeners
    elements.searchBtn.addEventListener("click", executeSearch);
    
    // Evento para tecla Enter
    elements.searchInput.addEventListener("keypress", (e) => {
        if (e.key === "Enter") {
            executeSearch();
        }
    });

    elements.backBtn.addEventListener("click", () => {
        if (!elements.tracksSection.classList.contains("hidden")) {
            elements.tracksSection.classList.add("hidden");
            elements.artistDetail.classList.remove("hidden");
        } else {
            elements.artistList.classList.remove("hidden");
            elements.artistDetail.classList.add("hidden");
            elements.backBtn.classList.add("hidden");
        }
    });

    // Inicialización
    await getToken();
    loadInitialArtists();
});
