document.addEventListener("DOMContentLoaded", async () => {
    const artistList = document.getElementById("artist-list");
    const artistProfile = document.getElementById("artist-profile");
    const albumsSection = document.getElementById("albums");
    const tracksSection = document.getElementById("tracks");
    const backBtn = document.getElementById("back-btn");
    const searchInput = document.getElementById("search");
    const searchBtn = document.getElementById("search-btn");

    const clientId = "TU_CLIENT_ID";
    const clientSecret = "TU_CLIENT_SECRET";
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

    async function getTracks(albumId) {
        const response = await fetch(`https://api.spotify.com/v1/albums/${albumId}/tracks`, {
            headers: { "Authorization": `Bearer ${token}` },
        });
        const data = await response.json();
        return data.items;
    }

    async function displayArtists() {
        artistList.innerHTML = "";
        const artists = ["Linkin Park", "Sabrina Carpenter", "The Weeknd"];
        for (let artistName of artists) {
            const artist = await getArtistInfo(artistName);
            artistList.innerHTML += `
                <div onclick="displayArtist('${artistName}')">
                    <h2>${artist.name}</h2>
                    <img src="${artist.images.length ? artist.images[0].url : ''}" width="200">
                </div>
            `;
        }
    }

    async function displayArtist(artistName) {
        const artist = await getArtistInfo(artistName);
        if (!artist) {
            artistProfile.innerHTML = `<h2>No se encontró el artista</h2>`;
            albumsSection.innerHTML = "";
            return;
        }

        artistList.classList.add("hidden");
        artistProfile.classList.remove("hidden");
        albumsSection.classList.remove("hidden");
        backBtn.classList.remove("hidden");
        tracksSection.classList.add("hidden");

        artistProfile.innerHTML = `
            <h2>${artist.name}</h2>
            <img src="${artist.images.length ? artist.images[0].url : ''}" width="200">
        `;

        const albums = await getAlbums(artist.id);
        albumsSection.innerHTML = albums.map(album => `
            <div onclick="displayTracks('${album.id}')">
                <h3>${album.name}</h3>
                <img src="${album.images.length ? album.images[0].url : ''}" width="150">
            </div>
        `).join("");
    }

    async function displayTracks(albumId) {
        const tracks = await getTracks(albumId);
        artistProfile.classList.add("hidden");
        albumsSection.classList.add("hidden");
        tracksSection.classList.remove("hidden");

        tracksSection.innerHTML = `
            <h2>Canciones</h2>
            <ul>
                ${tracks.map(track => `<li>${track.name}</li>`).join("")}
            </ul>
        `;
    }

    searchBtn.addEventListener("click", async () => {
        if (!token) await getToken();
        displayArtist(searchInput.value);
    });

    backBtn.addEventListener("click", () => {
        if (!albumsSection.classList.contains("hidden")) {
            albumsSection.classList.add("hidden");
            artistProfile.classList.add("hidden");
            artistList.classList.remove("hidden");
            backBtn.classList.add("hidden");
        } else if (!tracksSection.classList.contains("hidden")) {
            tracksSection.classList.add("hidden");
            albumsSection.classList.remove("hidden");
        }
    });

    await getToken();
    displayArtists();
});
