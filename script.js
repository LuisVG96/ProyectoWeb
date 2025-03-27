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

    // Autenticación con Spotify
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

    // Búsqueda controlada
    async function search(query) {
        const response = await fetch(
            `https://api.spotify.com/v1/search?q=${encodeURIComponent(query)}&type=artist,album`,
            { headers: { Authorization: `Bearer ${token}` } }
        );
        const data = await response.json();
        
        return {
            artists: data.artists.items.filter(artist => 
                allowedArtists.includes(artist.name.toLowerCase())
            ),
            albums: data.albums.items.filter(album =>
                allowedArtists.includes(album.artists[0].name.toLowerCase())
            )
        };
    }

    // Obtener artista por nombre
    async function getArtist(artistName) {
        const response = await fetch(
            `https://api.spotify.com/v1/search?q=${encodeURIComponent(artistName)}&type=artist`,
            { headers: { Authorization: `Bearer ${token}` } }
        );
        const data = await response.json();
        return data.artists.items[0];
    }

    // Obtener álbumes de artista
    async function getAlbums(artistId) {
        const response = await fetch(`https://api.spotify.com/v1/artists/${artistId}/albums`, {
            headers: { "Authorization": `Bearer ${token}` }
        });
        const data = await response.json();
        return data.items;
    }

    // Obtener canciones de álbum
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
            <img src="${artist.images[0]?.url || 'placeholder.jpg'}">
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
                    <p class="artist-description">${artist.name} es uno de los artistas más influyentes en la música moderna con millones de seguidores en todo el mundo.</p>
                </div>
                <div class="artist-stats">
                    <div class="followers-percent">20%</div>
                    <div class="followers-label">FOLLOWERS</div>
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
                showTracks(tracks, albumId);
            });
        });
    }

    // Mostrar lista de canciones
    async function showTracks(tracks, albumId) {
        const albumResponse = await fetch(`https://api.spotify.com/v1/albums/${albumId}`, {
            headers: { "Authorization": `Bearer ${token}` }
        });
        const album = await albumResponse.json();
        
        elements.artistDetail.classList.add("hidden");
        elements.tracksSection.classList.remove("hidden");
        
        elements.tracksSection.innerHTML = `
            <div class="track-list">
                <div class="album-header">
                    <h2>${album.name}</h2>
                    <p>${album.artists[0].name} • ${album.release_date.split('-')[0]}</p>
                </div>
                ${tracks.map((track, index) => `
                    <div class="track-item">
                        <span class="track-number">${index + 1}</span>
                        <div class="track-info">
                            <span class="track-name">${track.name}</span>
                        </div>
                        <span class="track-duration">${msToTime(track.duration_ms)}</span>
                    </div>
                `).join('')}
            </div>
        `;
    }

    // Convertir milisegundos a tiempo
    function msToTime(ms) {
        const minutes = Math.floor(ms / 60000);
        const seconds = ((ms % 60000) / 1000).toFixed(0);
        return `${minutes}:${seconds.padStart(2, "0")}`;
    }

    // Event listeners
    elements.searchBtn.addEventListener("click", async () => {
        if (!token) await getToken();
        const results = await search(elements.searchInput.value);
        
        if (results.artists.length > 0) {
            showArtistDetail(results.artists[0]);
        } else if (results.albums.length > 0) {
            showTracks(await getTracks(results.albums[0].id), results.albums[0].id);
        } else {
            alert("No se encontraron resultados válidos");
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
