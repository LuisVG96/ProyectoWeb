// app.js
const CLIENT_ID = 'f6967377460f424db33c6ae8e7183eb9'; // Obtén esto del Dashboard de Spotify
const CLIENT_SECRET = 'C9002aceb05a34a60b921409e7b8f4d7a'; 
let ACCESS_TOKEN = '';

// IDs verificados de los artistas (Sabrina Carpenter, Linkin Park, Bob Marley)
const ARTIST_IDS = [
    '6LqNN22kTxxx4z9DmK3ZlL', // Sabrina Carpenter
    '6XyY86QOPPrYVGvF9ch6wz', // Linkin Park
    '2QsynagSdAqZj3U9HgDzjD'  // Bob Marley
];

// ========== FUNCIONES PRINCIPALES ========== //

// 1. Autenticación en Spotify
async function getAccessToken() {
    try {
        const response = await fetch('https://accounts.spotify.com/api/token', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/x-www-form-urlencoded',
                'Authorization': 'Basic ' + btoa(`${CLIENT_ID}:${CLIENT_SECRET}`)
            },
            body: 'grant_type=client_credentials'
        });
        
        if (!response.ok) throw new Error('Error en autenticación');
        
        const data = await response.json();
        ACCESS_TOKEN = data.access_token;
        loadArtists();
        
    } catch (error) {
        console.error('Error al obtener token:', error);
        alert('¡Error de conexión con Spotify! Recarga la página.');
    }
}

// 2. Cargar artistas destacados
async function loadArtists() {
    try {
        const artistsGrid = document.getElementById('artistsGrid');
        artistsGrid.innerHTML = '<div class="loading">Cargando artistas...</div>';

        for (const artistId of ARTIST_IDS) {
            const artist = await fetchArtist(artistId);
            
            if (!artist || !artist.images?.length) {
                console.warn('Artista sin imágenes:', artistId);
                continue;
            }

            artistsGrid.innerHTML += `
                <div class="card" onclick="showArtistDetail('${artistId}')">
                    <img src="${artist.images[0].url}" alt="${artist.name}">
                    <h3>${artist.name}</h3>
                    <p>${artist.genres[0]?.split(' ')[0] || 'Pop'}</p>
                </div>
            `;
        }

        if (artistsGrid.innerHTML === '') {
            artistsGrid.innerHTML = '<p>No se encontraron artistas</p>';
        }

    } catch (error) {
        console.error('Error cargando artistas:', error);
    }
}

// 3. Búsqueda de artistas
async function searchArtist() {
    const query = document.getElementById('searchInput').value.trim();
    if (!query) return;

    try {
        const response = await fetch(
            `https://api.spotify.com/v1/search?q=${encodeURIComponent(query)}&type=artist`,
            { headers: { 'Authorization': `Bearer ${ACCESS_TOKEN}` } }
        );
        
        const data = await response.json();
        console.log('Resultados de búsqueda:', data.artists.items); // Implementa la lógica UI aquí

    } catch (error) {
        console.error('Error en búsqueda:', error);
    }
}

// 4. Detalle de Artista
async function showArtistDetail(artistId) {
    try {
        const [artist, albums] = await Promise.all([
            fetchArtist(artistId),
            fetchAlbums(artistId)
        ]);

        document.getElementById('mainView').classList.add('hidden');
        document.getElementById('artistDetail').classList.remove('hidden');

        // Actualizar info del artista
        document.getElementById('artistInfo').innerHTML = `
            <div class="card-large">
                <img src="${artist.images[0].url}" alt="${artist.name}">
                <h2>${artist.name}</h2>
                <p>🎵 ${artist.genres.join(', ') || 'Géneros no disponibles'}</p>
                <p>👥 ${artist.followers.total.toLocaleString()} seguidores</p>
            </div>
        `;

        // Actualizar álbumes
        const albumsGrid = document.getElementById('albumsGrid');
        albumsGrid.innerHTML = '';
        
        albums.forEach(album => {
            albumsGrid.innerHTML += `
                <div class="card" onclick="showAlbumDetail('${album.id}')">
                    <img src="${album.images[0]?.url || 'placeholder.jpg'}" alt="${album.name}">
                    <h3>${album.name}</h3>
                    <p>${album.release_date.split('-')[0]}</p>
                </div>
            `;
        });

    } catch (error) {
        console.error('Error mostrando artista:', error);
    }
}

// 5. Detalle de Álbum
async function showAlbumDetail(albumId) {
    try {
        const album = await fetchAlbum(albumId);

        document.getElementById('artistDetail').classList.add('hidden');
        document.getElementById('albumDetail').classList.remove('hidden');

        document.getElementById('albumInfo').innerHTML = `
            <div class="card-large">
                <img src="${album.images[0].url}" alt="${album.name}">
                <h2>${album.name}</h2>
                <p>🎤 ${album.artists.map(a => a.name).join(', ')}</p>
                <p>📅 ${album.release_date}</p>
                <p>🎵 ${album.total_tracks} canciones</p>
                ${album.tracks?.items.map((track, i) => `
                    <div class="track">
                        <span>${i + 1}.</span>
                        <span>${track.name}</span>
                        <span>${Math.floor(track.duration_ms / 60000)}:${Math.floor((track.duration_ms % 60000) / 1000).toString().padStart(2, '0')}</span>
                    </div>
                `).join('')}
            </div>
        `;

    } catch (error) {
        console.error('Error mostrando álbum:', error);
    }
}

// ========== FUNCIONES AUXILIARES ========== //
async function fetchArtist(id) {
    const response = await fetch(`https://api.spotify.com/v1/artists/${id}`, {
        headers: { 'Authorization': `Bearer ${ACCESS_TOKEN}` }
    });
    return await response.json();
}

async function fetchAlbums(id) {
    const response = await fetch(`https://api.spotify.com/v1/artists/${id}/albums?include_groups=album&limit=5`, {
        headers: { 'Authorization': `Bearer ${ACCESS_TOKEN}` }
    });
    const data = await response.json();
    return data.items;
}

async function fetchAlbum(id) {
    const response = await fetch(`https://api.spotify.com/v1/albums/${id}`, {
        headers: { 'Authorization': `Bearer ${ACCESS_TOKEN}` }
    });
    return await response.json();
}

function goBack() {
    document.querySelectorAll('.container').forEach(el => el.classList.add('hidden'));
    document.getElementById('mainView').classList.remove('hidden');
}

// Iniciar
getAccessToken();
