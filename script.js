document.addEventListener("DOMContentLoaded", async () => {
    const elements = {
        artistList: document.getElementById("artist-list"),
        albumDetail: document.getElementById("album-detail"),
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
                const card = createCard(artist);
                card.addEventListener("click", () => showArtist(artist));
                elements.artistList.appendChild(card);
            }
        }
    }

    // Mostrar artista
    async function showArtist(artist) {
        const albums = await getAlbums(artist.id);
        
        elements.artistList.classList.add("hidden");
        elements.albumDetail.classList.remove("hidden");
        elements.backBtn.classList.remove("hidden");
        
        elements.albumDetail.innerHTML = `
            <h2 class="artist-name">${artist.name}</h2>
            <div class="grid-view">
                ${albums.map(album => createAlbumCard(album)).join("")}
            </div>
        `;

        document.querySelectorAll(".album-card").forEach((card, index) => {
            card.addEventListener("click", () => showAlbum(albums[index]));
        });
    }

    // Mostrar álbum
    async function showAlbum(album) {
        const tracks = await getTracks(album.id);
        
        elements.albumDetail.classList.add("hidden");
        elements.tracksSection.classList.remove("hidden");
        
        elements.tracksSection.innerHTML = `
            <div class="album-header">
                <img src="${album.images[0].url}" class="album-artwork">
                <div class="album-info">
                    <h1 class="album-title">${album.name}</h1>
                    <p class="album-artist">${album.artists[0].name} • ${album.release_date.split("-")[0]}</p>
                </div>
            </div>
            <div class="track-list">
                ${tracks.map((track, index) => `
                    <div class="track-item">
                        <span class="track-number">${index + 1}</span>
                        <div class="track-info">
                            <span class="track-name">${track.name}</span>
                        </div>
                        <span class="track-duration">${msToTime(track.duration_ms)}</span>
                    </div>
                `).join("")}
            </div>
        `;
    }

    // Funciones auxiliares
    function createCard(data) {
        const div = document.createElement("div");
        div.className = data.type === "artist" ? "artist-card" : "album-card";
        div.innerHTML = `
            <img src="${data.images[0]?.url || 'placeholder.jpg'}">
            <h3>${data.name}</h3>
            <p>${data.type === "album" ? data.artists[0].name : "Artista"}</p>
        `;
        return div;
    }

    function createAlbumCard(album) {
        return `
            <div class="album-card">
                <img src="${album.images[0]?.url || 'placeholder.jpg'}">
                <h3>${album.name}</h3>
                <p>${album.artists[0].name}</p>
            </div>
        `;
    }

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
            showArtist(results.artists[0]);
        } else if (results.albums.length > 0) {
            showAlbum(results.albums[0]);
        } else {
            alert("No se encontraron resultados válidos");
        }
    });

    elements.backBtn.addEventListener("click", () => {
        if (!elements.tracksSection.classList.contains("hidden")) {
            elements.tracksSection.classList.add("hidden");
            elements.albumDetail.classList.remove("hidden");
        } else {
            elements.artistList.classList.remove("hidden");
            elements.albumDetail.classList.add("hidden");
            elements.backBtn.classList.add("hidden");
        }
    });

    // Inicialización
    await getToken();
    loadInitialArtists();
});
