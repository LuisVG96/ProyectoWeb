// Configuración de la API
const CLIENT_ID = 'f6967377460f424db33c6ae8e7183eb9'; // Regístrate en Spotify Dashboard
const CLIENT_SECRET = '9002aceb05a34a60b921409e7b8f4d7a';
let ACCESS_TOKEN = '';

// IDs de artistas predefinidos (Sabrina Carpenter, Linkin Park, Bob Marley)
const ARTIST_IDS = [
    '6LqNN22kTxxx4z9DmK3ZlL', 
    '6XyY86QOPPrYVGvF9ch6wz', 
    '2QsynagSdAqZj3U9HgDzjD'
];

// Autenticación
async function getAccessToken() {
    const response = await fetch('https://accounts.spotify.com/api/token', {
        method: 'POST',
        headers: {
            'Content-Type': 'application/x-www-form-urlencoded',
            'Authorization': 'Basic ' + btoa(`${CLIENT_ID}:${CLIENT_SECRET}`)
        },
        body: 'grant_type=client_credentials'
    });
    const data = await response.json();
    ACCESS_TOKEN = data.access_token;
    loadArtists(); // Cargar artistas al iniciar
}

// Cargar artistas destacados
async function loadArtists() {
    const artistsGrid = document.getElementById('artistsGrid');
    artistsGrid.innerHTML = '';

    for (const artistId of ARTIST_IDS) {
        const artist = await fetchArtist(artistId);
        const card = `
            <div class="card" onclick="showArtistDetail('${artistId}')">
                <img src="${artist.images[0].url}" alt="${artist.name}">
                <h3>${artist.name}</h3>
                <p>${artist.genres[0] || 'Género no disponible'}</p>
            </div>
        `;
        artistsGrid.innerHTML += card;
    }
}

// Buscar artista por nombre
async function searchArtist() {
    const query = document.getElementById('searchInput').value;
    const response = await fetch(`https://api.spotify.com/v1/search?q=${query}&type=artist`, {
        headers: { 'Authorization': `Bearer ${ACCESS_TOKEN}` }
    });
    const data = await response.json();
    console.log(data.artists.items); // Implementa la lógica para mostrar resultados
}

// Mostrar detalle de artista
async function showArtistDetail(artistId) {
    const artist = await fetchArtist(artistId);
    const albums = await fetchAlbums(artistId);

    document.getElementById('mainView').classList.add('hidden');
    document.getElementById('artistDetail').classList.remove('hidden');

    document.getElementById('artistInfo').innerHTML = `
        <div class="card">
            <img src="${artist.images[0].url}" alt="${artist.name}">
            <h2>${artist.name}</h2>
            <p>Seguidores: ${artist.followers.total.toLocaleString()}</p>
        </div>
    `;

    const albumsGrid = document.getElementById('albumsGrid');
    albumsGrid.innerHTML = '';
    albums.forEach(album => {
        albumsGrid.innerHTML += `
            <div class="card" onclick="showAlbumDetail('${album.id}')">
                <img src="${album.images[0].url}" alt="${album.name}">
                <h3>${album.name}</h3>
                <p>${album.release_date.split('-')[0]}</p>
            </div>
        `;
    });
}

// Mostrar detalle de álbum
async function showAlbumDetail(albumId) {
    const album = await fetchAlbum(albumId);

    document.getElementById('artistDetail').classList.add('hidden');
    document.getElementById('albumDetail').classList.remove('hidden');

    document.getElementById('albumInfo').innerHTML = `
        <div class="card">
            <img src="${album.images[0].url}" alt="${album.name}">
            <h2>${album.name}</h2>
            <p>Artista: ${album.artists[0].name}</p>
            <p>Fecha de lanzamiento: ${album.release_date}</p>
            <p>Total de canciones: ${album.total_tracks}</p>
        </div>
    `;
}

// Funciones auxiliares
async function fetchArtist(id) {
    const response = await fetch(`https://api.spotify.com/v1/artists/${id}`, {
        headers: { 'Authorization': `Bearer ${ACCESS_TOKEN}` }
    });
    return await response.json();
}

async function fetchAlbums(id) {
    const response = await fetch(`https://api.spotify.com/v1/artists/${id}/albums?include_groups=album`, {
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

// Iniciar aplicación
getAccessToken();