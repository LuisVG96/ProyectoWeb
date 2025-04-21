document.addEventListener("DOMContentLoaded", async () => {
    const elements = {
        artistList: document.getElementById("artist-list"),
        artistDetail: document.getElementById("artist-detail"),
        tracksSection: document.getElementById("tracks"),
        backBtn: document.getElementById("back-btn"),
        searchInput: document.getElementById("search"),
        searchBtn: document.getElementById("search-btn"),
        homeView: document.querySelector(".home-view")
    };

    // Agregar estilos para controlar tamaños de imágenes
    const styleElement = document.createElement('style');
    styleElement.textContent = `
        .artist-card img {
            width: 100px;
            height: 100px;
            object-fit: cover;
            border-radius: 50%;
        }
        
        .artist-profile-img {
            width: 150px;
            height: 150px;
            object-fit: cover;
            border-radius: 50%;
        }
        
        .album-cover-img {
            width: 120px;
            height: 120px;
            object-fit: cover;
        }
        
        .album-artwork-large {
            width: 200px;
            height: 200px;
            object-fit: cover;
        }
        
        .track-artwork {
            width: 150px;
            height: 150px;
            object-fit: cover;
        }
        
        .artist-result-img {
            width: 50px;
            height: 50px;
            object-fit: cover;
            border-radius: 50%;
        }
    `;
    document.head.appendChild(styleElement);

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
                `https://api.spotify.com/v1/search?q=${encodeURIComponent(query)}&type=artist,album,track&limit=10`,
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

    // Obtener artista con detalles completos
    async function getArtist(artistName) {
        const response = await fetch(
            `https://api.spotify.com/v1/search?q=${encodeURIComponent(artistName)}&type=artist`,
            { headers: { Authorization: `Bearer ${token}` } }
        );
        const data = await response.json();
        const artist = data.artists?.items[0];
        
        if (artist) {
            // Obtener información adicional del artista
            const artistDetailsResponse = await fetch(
                `https://api.spotify.com/v1/artists/${artist.id}`,
                { headers: { Authorization: `Bearer ${token}` } }
            );
            const artistDetails = await artistDetailsResponse.json();
            
            return {
                ...artist,
                followers: artistDetails.followers?.total || 0,
                genres: artistDetails.genres || [],
                popularity: artistDetails.popularity || 0
            };
        }
        
        return null;
    }

    // Obtener álbumes
    async function getAlbums(artistId) {
        const response = await fetch(`https://api.spotify.com/v1/artists/${artistId}/albums?limit=20`, {
            headers: { "Authorization": `Bearer ${token}` }
        });
        const data = await response.json();
        return data.items;
    }

    // Obtener top tracks del artista
    async function getTopTracks(artistId) {
        const response = await fetch(`https://api.spotify.com/v1/artists/${artistId}/top-tracks?market=US`, {
            headers: { "Authorization": `Bearer ${token}` }
        });
        const data = await response.json();
        return data.tracks || [];
    }

    // Obtener canciones de un álbum
    async function getTracks(albumId) {
        const response = await fetch(`https://api.spotify.com/v1/albums/${albumId}/tracks`, {
            headers: { "Authorization": `Bearer ${token}` }
        });
        const data = await response.json();
        return data.items;
    }

    // Obtener detalles de una canción específica
    async function getTrackDetails(trackId) {
        const response = await fetch(`https://api.spotify.com/v1/tracks/${trackId}`, {
            headers: { "Authorization": `Bearer ${token}` }
        });
        return await response.json();
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
        const topTracks = await getTopTracks(artist.id);
        
        elements.homeView.classList.add("hidden");
        elements.artistDetail.classList.remove("hidden");
        elements.backBtn.classList.remove("hidden");
        
        // Formatea los géneros para mostrar
        const genresText = artist.genres && artist.genres.length > 0 
            ? artist.genres.map(g => g.charAt(0).toUpperCase() + g.slice(1)).join(', ')
            : 'No genres available';
        
        elements.artistDetail.innerHTML = `
            <div class="artist-header">
                <div class="artist-profile">
                    <img src="${artist.images[0]?.url || 'https://via.placeholder.com/300'}" class="artist-profile-img">
                    <div class="artist-info">
                        <h1 class="artist-name">${artist.name}</h1>
                        <div class="artist-meta">
                            <span class="artist-followers">${formatNumber(artist.followers)} seguidores</span>
                            <span class="artist-popularity">Popularidad: ${artist.popularity}/100</span>
                        </div>
                        <div class="artist-genres">
                            <span>${genresText}</span>
                        </div>
                    </div>
                </div>
            </div>
            
            <div class="section-header">
                <h2>Top Tracks</h2>
            </div>
            <div class="top-tracks">
                ${topTracks.slice(0, 5).map((track, index) => `
                    <div class="track-item">
                        <span class="track-number">${index + 1}</span>
                        <div class="track-info">
                            <span class="track-name">${track.name}</span>
                            <span class="track-album">${track.album.name}</span>
                        </div>
                        <span class="track-duration">${msToTime(track.duration_ms)}</span>
                    </div>
                `).join('')}
            </div>
            
            <div class="section-header">
                <h2>Álbumes</h2>
            </div>
            <div class="album-list">
                ${albums.map(album => `
                    <div class="album-item" data-album-id="${album.id}">
                        <img src="${album.images[0]?.url || 'https://via.placeholder.com/150'}" class="album-cover-img">
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
                    <p class="album-year">${album.release_date.split('-')[0]} • ${tracks.length} canciones</p>
                </div>
                
                <div class="track-list-section">
                    <div class="track-list">
                        ${tracks.map((track, index) => `
                            <div class="track-item" data-track-id="${track.id}">
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
        
        // Agregar evento clic para mostrar detalles de cada canción
        document.querySelectorAll(".track-item[data-track-id]").forEach(trackElement => {
            trackElement.addEventListener("click", async (e) => {
                const trackId = e.currentTarget.dataset.trackId;
                if (trackId) {
                    const trackDetails = await getTrackDetails(trackId);
                    showTrackDetails(trackDetails);
                }
            });
        });
    }

    // Mostrar detalles de una canción específica
    async function showTrackDetails(track) {
        elements.tracksSection.classList.add("hidden");
        elements.artistDetail.classList.add("hidden");
        elements.tracksSection.classList.remove("hidden");
        
        elements.tracksSection.innerHTML = `
            <div class="track-detail-container">
                <div class="track-detail-header">
                    <img src="${track.album.images[0]?.url || 'https://via.placeholder.com/300'}" class="track-artwork">
                    <div class="track-detail-info">
                        <h2>${track.name}</h2>
                        <p class="track-detail-artist">${track.artists.map(a => a.name).join(", ")}</p>
                        <p class="track-detail-album">Álbum: ${track.album.name} (${track.album.release_date.split('-')[0]})</p>
                        <p class="track-detail-duration">Duración: ${msToTime(track.duration_ms)}</p>
                        <p class="track-detail-popularity">Popularidad: ${track.popularity}/100</p>
                        ${track.explicit ? '<span class="explicit-tag">Explicit</span>' : ''}
                    </div>
                </div>
                
                <div class="track-actions">
                    <button class="action-button play-button">
                        <span class="action-icon">▶️</span> Reproducir
                    </button>
                    <button class="action-button add-button">
                        <span class="action-icon">➕</span> Añadir a la lista
                    </button>
                </div>
                
                ${track.preview_url ? `
                    <div class="track-preview">
                        <h3>Vista previa</h3>
                        <audio controls src="${track.preview_url}"></audio>
                    </div>
                ` : ''}
            </div>
        `;
    }

    // Mostrar resultados de búsqueda
    function showSearchResults(results) {
        elements.homeView.classList.add("hidden");
        elements.artistDetail.classList.add("hidden");
        elements.tracksSection.classList.remove("hidden");
        elements.backBtn.classList.remove("hidden");
        
        let resultsHTML = `
            <div class="search-results-container">
                <h2>Resultados para: "${elements.searchInput.value}"</h2>`;
        
        // Mostrar artistas encontrados
        if (results.artists && results.artists.length > 0) {
            resultsHTML += `
                <div class="section-header">
                    <h3>Artistas</h3>
                </div>
                <div class="search-artists-results">
                    ${results.artists.map(artist => `
                        <div class="artist-result-item" data-artist-id="${artist.id}">
                            <img src="${artist.images[0]?.url || 'https://via.placeholder.com/60'}" class="artist-result-img">
                            <div class="artist-result-info">
                                <span class="artist-result-name">${artist.name}</span>
                                <span class="artist-result-type">Artista</span>
                            </div>
                        </div>
                    `).join('')}
                </div>`;
        }
        
        // Mostrar canciones encontradas
        if (results.tracks && results.tracks.length > 0) {
            resultsHTML += `
                <div class="section-header">
                    <h3>Canciones</h3>
                </div>
                <div class="track-list">
                    ${results.tracks.map((track, index) => `
                        <div class="track-item" data-track-id="${track.id}">
                            <div class="track-info">
                                <span class="track-name">${track.name}</span>
                                <span class="track-artist">${track.artists.map(a => a.name).join(", ")}</span>
                                <span class="track-album">Álbum: ${track.album.name}</span>
                            </div>
                            <span class="track-duration">${msToTime(track.duration_ms)}</span>
                        </div>
                    `).join('')}
                </div>`;
        }
        
        // Mostrar álbumes encontrados
        if (results.albums && results.albums.length > 0) {
            resultsHTML += `
                <div class="section-header">
                    <h3>Álbumes</h3>
                </div>
                <div class="album-list search-album-results">
                    ${results.albums.map(album => `
                        <div class="album-item" data-album-id="${album.id}">
                            <img src="${album.images[0]?.url || 'https://via.placeholder.com/150'}" class="album-cover-img">
                            <div class="album-meta">
                                <h3>${album.name}</h3>
                                <span class="album-artist">${album.artists[0].name}</span>
                                <span class="album-year">${album.release_date.split('-')[0]}</span>
                            </div>
                        </div>
                    `).join('')}
                </div>`;
        }
        
        if (!results.artists.length && !results.albums.length && !results.tracks.length) {
            resultsHTML += `<p class="no-results">No se encontraron resultados para tu búsqueda.</p>`;
        }
        
        resultsHTML += `</div>`;
        elements.tracksSection.innerHTML = resultsHTML;
        
        // Agregar evento clic para cada resultado
        document.querySelectorAll(".artist-result-item").forEach(item => {
            item.addEventListener("click", async () => {
                const artistId = item.dataset.artistId;
                const artistResponse = await fetch(`https://api.spotify.com/v1/artists/${artistId}`, {
                    headers: { "Authorization": `Bearer ${token}` }
                });
                const artist = await artistResponse.json();
                showArtistDetail(artist);
            });
        });
        
        document.querySelectorAll(".track-item[data-track-id]").forEach(item => {
            item.addEventListener("click", async () => {
                const trackId = item.dataset.trackId;
                const trackDetails = await getTrackDetails(trackId);
                showTrackDetails(trackDetails);
            });
        });
        
        document.querySelectorAll(".album-item[data-album-id]").forEach(item => {
            item.addEventListener("click", async () => {
                const albumId = item.dataset.albumId;
                const tracks = await getTracks(albumId);
                showAlbumTracks(tracks, albumId);
            });
        });
    }

    // Formato para números grandes (followers)
    function formatNumber(num) {
        if (!num) return "0";
        if (num >= 1000000) {
            return (num / 1000000).toFixed(1) + 'M';
        } else if (num >= 1000) {
            return (num / 1000).toFixed(1) + 'K';
        }
        return num.toString();
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
        showSearchResults(results);
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
            
            // Verificar si estábamos en detalle de artista antes
            if (!elements.artistDetail.classList.contains("hidden")) {
                elements.artistDetail.classList.remove("hidden");
            } else {
                elements.homeView.classList.remove("hidden");
                elements.backBtn.classList.add("hidden");
            }
        } else if (!elements.artistDetail.classList.contains("hidden")) {
            elements.artistDetail.classList.add("hidden");
            elements.homeView.classList.remove("hidden");
            elements.backBtn.classList.add("hidden");
        }
    });

    // Inicialización
    await getToken();
    loadInitialArtists();
});
