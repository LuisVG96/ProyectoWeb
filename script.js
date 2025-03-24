document.addEventListener("DOMContentLoaded", async () => {
    const artistProfile = document.getElementById("artist-profile");
    const albumsSection = document.getElementById("albums");

    const clientId = "f6967377460f424db33c6ae8e7183eb9";
    const clientSecret = "9002aceb05a34a60b921409e7b8f4d7a";
    let token = "";

    async function getToken() {
        const response = await fetch("https://accounts.spotify.com/api/token", {
            method: "POST",
            headers: {
                "Content-Type": "application/x-www-form-urlencoded",
                "Authorization": "Basic " + btoa(clientId + ":" + clientSecret),
            },
            body: "grant_type=client_credentials",
        });
        const data = await response.json();
        token = data.access_token;
    }

    async function getArtistInfo(artistName) {
        const response = await fetch(`https://api.spotify.com/v1/search?q=${artistName}&type=artist`, {
            headers: { "Authorization": `Bearer ${token}` },
        });
        const data = await response.json();
        return data.artists.items[0]; 
    }

    async function getAlbums(artistId) {
        const response = await fetch(`https://api.spotify.com/v1/artists/${artistId}/albums`, {
            headers: { "Authorization": `Bearer ${token}` },
        });
        const data = await response.json();
        return data.items;
    }

    async function displayArtist(artistName) {
        const artist = await getArtistInfo(artistName);
        if (!artist) {
            artistProfile.innerHTML = `<h2>No se encontró el artista</h2>`;
            albumsSection.innerHTML = "";
            return;
        }

        artistProfile.innerHTML = `
            <h2>${artist.name}</h2>
            <img src="${artist.images.length ? artist.images[0].url : ''}" width="200">
        `;

        const albums = await getAlbums(artist.id);
        albumsSection.innerHTML = albums.map(album => `
            <div>
                <h3>${album.name}</h3>
                <img src="${album.images.length ? album.images[0].url : ''}" width="150">
            </div>
        `).join("");
    }

    await getToken();

    // Mostrar automáticamente los tres artistas solicitados
    displayArtist("Linkin Park");
    setTimeout(() => displayArtist("Sabrina Carpenter"), 3000);
    setTimeout(() => displayArtist("The Weeknd"), 6000);
});
