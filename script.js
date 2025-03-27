document.addEventListener("DOMContentLoaded", async () => {
    const artistList = document.getElementById("artist-list");
    const artistProfile = document.getElementById("artist-profile");
    const albumsSection = document.getElementById("albums");
    const tracksSection = document.getElementById("tracks");
    const backBtn = document.getElementById("back-btn");
    const searchInput = document.getElementById("search");
    const searchBtn = document.getElementById("search-btn");

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

    async function searchSpotify(query) {
        const response = await fetch(
            `https://api.spotify.com/v1/search?q=${encodeURIComponent(query)}&type=artist,album`,
            { headers: { "Authorization": `Bearer ${token}` } }
        );
        return await response.json();
    }

    async function getArtistById(artistId) {
        const response = await fetch(`https://api.spotify.com/v1/artists/${artistId}`, {
            headers: { "Authorization": `Bearer ${token}` },
        });
        return await response.json();
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
            const artist = await searchSpotify(artistName).then(data => data.artists?.items[0]);
            if (artist) {
                const div = document.createElement("div");
                div.innerHTML = `
                    <h2>${artist.name}</h2>
                    <img src="${artist.images[0]?.url || ''}" width="200">
                `;
                div.addEventListener("click", () => displayArtist(artist));
                artistList.appendChild(div);
            }
        }
    }

    async function displayArtist(artist) {
        artistList.classList.add("hidden");
        artistProfile.classList.remove("hidden");
        albumsSection.classList.remove("hidden");
        backBtn.classList.remove("hidden");

        artistProfile.innerHTML = `
            <h2>${artist.name}</h2>
            <img src="${artist.images[0]?.url || ''}" width="200">
        `;

        const albums = await getAlbums(artist.id);
        albumsSection.innerHTML = albums.map(album => `
            <div>
                <h3>${album.name}</h3>
                <img src="${album.images[0]?.url || ''}" width="150">
            </div>
        `).join("");

        albumsSection.querySelectorAll("div").forEach((div, index) => {
            div.addEventListener("click", () => displayTracks(albums[index].id, artist.id));
        });
    }

    async function displayTracks(albumId, artistId) {
        const tracks = await getTracks(albumId);
        albumsSection.classList.add("hidden");
        tracksSection.classList.remove("hidden");

        tracksSection.innerHTML = `
            <h2>Canciones</h2>
            <ul>
                ${tracks.map(track => `<li>${track.name}</li>`).join("")}
            </ul>
            <button onclick="displayArtistById('${artistId}')">Volver a álbumes</button>
        `;
    }

    window.displayArtistById = async (artistId) => {
        const artist = await getArtistById(artistId);
        if (artist) displayArtist(artist);
    };

    searchBtn.addEventListener("click", async () => {
        if (!token) await getToken();
        const query = searchInput.value.trim();
        if (!query) return;

        const data = await searchSpotify(query);
        if (data.artists?.items.length > 0) {
            displayArtist(data.artists.items[0]);
        } else if (data.albums?.items.length > 0) {
            const album = data.albums.items[0];
            displayArtist(album.artists[0]);
        } else {
            artistProfile.innerHTML = "<h2>No se encontraron resultados</h2>";
            artistList.classList.add("hidden");
            artistProfile.classList.remove("hidden");
            albumsSection.classList.add("hidden");
            tracksSection.classList.add("hidden");
            backBtn.classList.remove("hidden");
        }
    });

    backBtn.addEventListener("click", () => {
        if (!tracksSection.classList.contains("hidden")) {
            tracksSection.classList.add("hidden");
            albumsSection.classList.remove("hidden");
        } else {
            artistList.classList.remove("hidden");
            artistProfile.classList.add("hidden");
            albumsSection.classList.add("hidden");
            backBtn.classList.add("hidden");
        }
    });

    await getToken();
    displayArtists();
});
    await getToken();
    displayArtists();
});
