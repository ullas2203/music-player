let songs = [];
let currentSongIndex = 0;
let isShuffle = false;
let isRepeat = false;

const audio = document.getElementById('audio');
const songTitle = document.getElementById('song-title');
const playlist = document.getElementById('playlist');
const playIcon = document.querySelector('.control-btn.play i');
const seekBar = document.getElementById('seek-bar');
const currentTimeEl = document.getElementById('current-time');
const durationEl = document.getElementById('duration');

let audioCtx, analyser, source, dataArray, bufferLength, canvasCtx;
const canvas = document.getElementById('visualizer');

if (canvas) {
  canvasCtx = canvas.getContext('2d');

  function resizeCanvas() {
    canvas.width = canvas.offsetWidth;
    canvas.height = canvas.offsetHeight;
  }

  window.addEventListener('resize', resizeCanvas);
  resizeCanvas();
}

function draw() {
  if (!analyser) return;

  requestAnimationFrame(draw);
  analyser.getByteFrequencyData(dataArray);
  canvasCtx.clearRect(0, 0, canvas.width, canvas.height);

  const barWidth = 4;
  const gap = 2;
  const barCount = Math.floor(canvas.width / (barWidth + gap));
  const centerX = canvas.width / 2;

  for (let i = 0; i < barCount; i++) {
    const index = Math.floor(i * (bufferLength / barCount));
    const value = dataArray[index];
    const barHeight = (value / 255) * canvas.height;

    const x = centerX + (i - barCount / 2) * (barWidth + gap);
    const y = canvas.height - barHeight;

    const gradient = canvasCtx.createLinearGradient(0, y, 0, canvas.height);
    gradient.addColorStop(0, '#1db954');
    gradient.addColorStop(1, '#191414');

    canvasCtx.fillStyle = gradient;
    canvasCtx.fillRect(x, y, barWidth, barHeight);
  }
}

audio.onplay = () => {
  if (!audioCtx) {
    audioCtx = new (window.AudioContext || window.webkitAudioContext)();
    source = audioCtx.createMediaElementSource(audio);
    analyser = audioCtx.createAnalyser();
    source.connect(analyser);
    analyser.connect(audioCtx.destination);
    analyser.fftSize = 64;
    bufferLength = analyser.frequencyBinCount;
    dataArray = new Uint8Array(bufferLength);
  }
  draw();
};

audio.ontimeupdate = () => {
  if (!isNaN(audio.duration)) {
    seekBar.value = audio.currentTime;
    seekBar.max = audio.duration;
    currentTimeEl.textContent = formatTime(audio.currentTime);
    durationEl.textContent = formatTime(audio.duration);
  }
};

audio.onloadedmetadata = () => {
  seekBar.max = audio.duration;
  durationEl.textContent = formatTime(audio.duration);
};

audio.onended = () => {
  if (isRepeat) {
    audio.currentTime = 0;
    audio.play();
  } else if (isShuffle) {
    currentSongIndex = Math.floor(Math.random() * songs.length);
    loadSong();
    audio.play();
  } else {
    nextTrack();
  }
};

function formatTime(time) {
  const minutes = Math.floor(time / 60).toString().padStart(2, '0');
  const seconds = Math.floor(time % 60).toString().padStart(2, '0');
  return `${minutes}:${seconds}`;
}

function fetchSongs() {
  fetch('/songs')
    .then(res => res.json())
    .then(data => {
      songs = data;
      playlist.innerHTML = '';
      songs.forEach((song, index) => {
        const item = document.createElement('div');
        item.textContent = song;
        item.classList.add('playlist-item');
        item.addEventListener('click', () => {
          currentSongIndex = index;
          loadSong();
          audio.play();
        });
        playlist.appendChild(item);
      });
      if (songs.length > 0) loadSong();
    });
}

function loadSong() {
  const song = songs[currentSongIndex];
  audio.src = `/audio/${song}`;
  songTitle.textContent = song;
  playIcon.classList.replace('fa-play', 'fa-pause');

  const baseName = song.split('.').slice(0, -1).join('.');
  const songImage = document.getElementById('song-image');
  songImage.src = `/static/images/${baseName}.jpg`;

  songImage.onerror = function () {
    this.src = '/static/images/default.jpg';
  };
}

function playPause() {
  if (audio.paused) {
    audio.play();
    playIcon.classList.replace('fa-play', 'fa-pause');
  } else {
    audio.pause();
    playIcon.classList.replace('fa-pause', 'fa-play');
  }
}

function nextTrack() {
  currentSongIndex = (currentSongIndex + 1) % songs.length;
  loadSong();
  audio.play();
}

function prevTrack() {
  currentSongIndex = (currentSongIndex - 1 + songs.length) % songs.length;
  loadSong();
  audio.play();
}
function toggleMute() {
  audio.muted = !audio.muted;
  const muteIcon = document.querySelector('#mute-btn i');
  if (audio.muted) {
    muteIcon.classList.replace('fa-volume-up', 'fa-volume-mute');
  } else {
    muteIcon.classList.replace('fa-volume-mute', 'fa-volume-up');
  }
}


function setVolume(val) {
  audio.volume = val;
}

function seekTo() {
  const seekTime = (seekBar.value / seekBar.max) * audio.duration;
  audio.currentTime = seekTime;
}

function toggleShuffle() {
  isShuffle = !isShuffle;
  alert(`Shuffle: ${isShuffle ? 'On' : 'Off'}`);
}

function toggleRepeat() {
  isRepeat = !isRepeat;
  alert(`Repeat: ${isRepeat ? 'On' : 'Off'}`);
}

window.onload = fetchSongs;
