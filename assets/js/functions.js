var DOWNLOAD_API = "https://openmp3compiler.astudy.org";
let currentSong = null;

const audio = document.getElementById('player');
const playerName = document.getElementById('player-name');
const playerAlbum = document.getElementById('player-album');
const playerImage = document.getElementById('player-image');
const lyricsContent = document.getElementById('lyrics-content');

function PlayAudio(audio_url, song_id) {
    var audio = document.getElementById('player');
    var source = document.getElementById('audioSource');
    source.src = audio_url;
    var name = document.getElementById(song_id + "-n").textContent;
    var album = document.getElementById(song_id + "-a").textContent;
    var image = document.getElementById(song_id + "-i").getAttribute("src");

    document.title = name + " - " + album;
    var bitrate = document.getElementById('saavn-bitrate');
    var bitrate_i = bitrate.options[bitrate.selectedIndex].value;
    var quality = "";
    if (bitrate_i == 4) {
        quality = 320;
    } else {
        quality = 160;
    }

    document.getElementById("player-name").innerHTML = name;
    document.getElementById("player-album").innerHTML = album;
    document.getElementById("player-image").setAttribute("src", image);

    // Store the current song details for lyrics and Media Session
    currentSong = {
        url: audio_url,
        name: name,
        album: album,
        image: image,
        artist: results_objects[song_id]?.track?.primary_artists || 'Unknown Artist' // Adjust based on your data structure
    };

    var promise = audio.load();
    if (promise) {
        promise.catch(function(error) { console.error(error); });
    }

    audio.play().then(() => {
        fetchLyrics(name, currentSong.artist); // Fetch lyrics when the song starts playing
        updateMediaSession(currentSong); // Update Media Session for background playback
    }).catch(error => console.error('Playback error:', error));
}

function searchSong(search_term) {
    document.getElementById('search-box').value = search_term;
    var goButton = document.getElementById("search-trigger");
    goButton.click();
}

function AddDownload(id) {
    var bitrate = document.getElementById('saavn-bitrate');
    var bitrate_i = bitrate.options[bitrate.selectedIndex].value;
    var MP3DL = DOWNLOAD_API + "/add?id=" + id;

    fetch(MP3DL)
        .then(response => response.json())
        .then(data => {
            if (data.status == "success") {
                var download_list = document.getElementById("download-list");
                var download_item = document.createElement("li");

                download_item.innerHTML = `
                <div class="col">
                    <img class="track-img" src="${data.image}" width="50px">
                    <div style="display: inline;">
                        <span class="track-name"> ${id}</span> - 
                        <span class="track-album"> ${data.album}</span>
                        <br>
                        <span class="track-size"> Size : Null</span>
                        <span class="track-status" style="color:green"> </span>
                    </div>
                </div>
                <hr>
                `;

                download_item.setAttribute("track_tag", id);
                download_item.className = "no-bullets";
                download_list.appendChild(download_item);

                var download_status_span = document.querySelector('[track_tag="' + id + '"] .track-status');
                var download_name = document.querySelector('[track_tag="' + id + '"] .track-name');
                var download_album = document.querySelector('[track_tag="' + id + '"] .track-album');
                var download_img = document.querySelector('[track_tag="' + id + '"] .track-img');
                var download_size = document.querySelector('[track_tag="' + id + '"] .track-size');

                download_name.innerHTML = results_objects[id].track.name;
                download_status_span.innerHTML = data.status;
                download_album.innerHTML = results_objects[id].track.album.name;
                download_img.setAttribute("src", results_objects[id].track.image[2].link);

                var float_tap = document.getElementById('mpopupLink');
                float_tap.style.backgroundColor = "green";
                float_tap.style.borderColor = "green";

                setTimeout(function() {
                    float_tap.style.backgroundColor = "#007bff";
                    float_tap.style.borderColor = "#007bff";
                }, 1000);

                var STATUS_URL = DOWNLOAD_API + "/status?id=" + id;
                var interval = setInterval(function() {
                    fetch(STATUS_URL)
                        .then(response => response.json())
                        .then(data => {
                            if (data.status) {
                                download_status_span.textContent = data.status;
                                if (data.size) {
                                    download_size.textContent = "Size: " + data.size;
                                }
                                if (data.status == "Done") {
                                    download_status_span.innerHTML = `<a href="${DOWNLOAD_API}${data.url}" target="_blank">Download MP3</a>`;
                                    clearInterval(interval);
                                    return;
                                }
                            }
                        });
                }, 3000);
            }
        });
}

// Fetch lyrics from the API
async function fetchLyrics(songTitle, artist) {
    try {
        const query = encodeURIComponent(`${songTitle} ${artist}`);
        const response = await fetch(`https://api.zetsu.xyz/search/lyrics?q=${query}`);
        const data = await response.json();
        if (data.lyrics) {
            lyricsContent.textContent = data.lyrics;
        } else {
            lyricsContent.textContent = 'Lyrics not found.';
        }
    } catch (error) {
        console.error('Error fetching lyrics:', error);
        lyricsContent.textContent = 'Error loading lyrics.';
    }
}

// Media Session API for background playback
if ('mediaSession' in navigator) {
    navigator.mediaSession.metadata = new MediaMetadata({
        title: 'Unknown Song',
        artist: 'Unknown Artist',
        album: 'Unknown Album',
        artwork: [
            { src: 'assets/artwork.jpg', sizes: '96x96', type: 'image/jpeg' },
        ],
    });

    navigator.mediaSession.setActionHandler('play', () => {
        audio.play();
    });

    navigator.mediaSession.setActionHandler('pause', () => {
        audio.pause();
    });

    navigator.mediaSession.setActionHandler('seekbackward', () => {
        audio.currentTime = Math.max(0, audio.currentTime - 10);
    });

    navigator.mediaSession.setActionHandler('seekforward', () => {
        audio.currentTime = Math.min(audio.duration, audio.currentTime + 10);
    });
}

function updateMediaSession(song) {
    if ('mediaSession' in navigator) {
        navigator.mediaSession.metadata = new MediaMetadata({
            title: song.name || 'Unknown Song',
            artist: song.artist || 'Unknown Artist',
            album: song.album || 'Unknown Album',
            artwork: [
                { src: song.image || 'assets/artwork.jpg', sizes: '96x96', type: 'image/jpeg' },
            ],
        });
    }
}

// Ensure lyrics and Media Session update when the song changes
audio.addEventListener('play', () => {
    if (currentSong) {
        fetchLyrics(currentSong.name, currentSong.artist);
        updateMediaSession(currentSong);
    }
});
