const clientId = "2b57d5d5356a4a0e9fdf6ee1af97fc4b";
const redirectUri = "https://leberkas01.github.io/spotify-display/";
const scopes = "user-read-playback-state user-modify-playback-state user-read-currently-playing";

let accessToken = null;

// Step 1: Redirect to Spotify login
function authorize() {
  const url = `https://accounts.spotify.com/authorize?client_id=${clientId}&response_type=token&redirect_uri=${encodeURIComponent(redirectUri)}&scope=${encodeURIComponent(scopes)}`;
  window.location.href = url;
}

// Step 2: Extract token from URL
function getTokenFromUrl() {
  const hash = window.location.hash;
  if (hash) {
    const params = new URLSearchParams(hash.substring(1));
    accessToken = params.get("access_token");
  }
}

// Step 3: Fetch current song
async function fetchCurrentSong() {
  const res = await fetch("https://api.spotify.com/v1/me/player/currently-playing", {
    headers: { Authorization: `Bearer ${accessToken}` }
  });

  if (!res.ok) return;

  const data = await res.json();
  if (!data.item) return;

  const song = data.item;
  const progress = data.progress_ms;
  const duration = song.duration_ms;

  document.getElementById("title").textContent = song.name;
  document.getElementById("artist").textContent = song.artists.map(a => a.name).join(", ");
  document.getElementById("album").textContent = song.album.name;
  document.getElementById("cover").style.backgroundImage = `url(${song.album.images[0].url})`;

  document.getElementById("elapsed").textContent = formatTime(progress);
  document.getElementById("duration").textContent = formatTime(duration);
  document.getElementById("fill").style.width = `${(progress / duration) * 100}%`;

  setBackgroundColor(song.album.images[0].url);
}

// Step 4: Playback controls
document.getElementById("play").onclick = () => togglePlay();
document.getElementById("next").onclick = () => skip("next");
document.getElementById("prev").onclick = () => skip("previous");

async function togglePlay() {
  const res = await fetch("https://api.spotify.com/v1/me/player", {
    headers: { Authorization: `Bearer ${accessToken}` }
  });
  const data = await res.json();
  const isPlaying = data.is_playing;

  const endpoint = isPlaying ? "pause" : "play";
  await fetch(`https://api.spotify.com/v1/me/player/${endpoint}`, {
    method: "PUT",
    headers: { Authorization: `Bearer ${accessToken}` }
  });
}

async function skip(direction) {
  await fetch(`https://api.spotify.com/v1/me/player/${direction}`, {
    method: "POST",
    headers: { Authorization: `Bearer ${accessToken}` }
  });
}

// Step 5: Format time
function formatTime(ms) {
  const min = Math.floor(ms / 60000);
  const sec = Math.floor((ms % 60000) / 1000);
  return `${min}:${sec.toString().padStart(2, "0")}`;
}

// Step 6: Background color from cover
function setBackgroundColor(imageUrl) {
  const img = new Image();
  img.crossOrigin = "Anonymous";
  img.src = imageUrl;
  img.onload = () => {
    const canvas = document.createElement("canvas");
    canvas.width = img.width;
    canvas.height = img.height;
    const ctx = canvas.getContext("2d");
    ctx.drawImage(img, 0, 0);
    const data = ctx.getImageData(0, 0, 1, 1).data;
    document.body.style.backgroundColor = `rgb(${data[0]}, ${data[1]}, ${data[2]})`;
  };
}

// Step 7: Start
getTokenFromUrl();
if (!accessToken) {
  authorize();
} else {
  fetchCurrentSong();
  setInterval(fetchCurrentSong, 5000);
}

