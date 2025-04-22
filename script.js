const video = document.getElementById('video-background');
const canvas = document.getElementById('snapshot');
const container = document.getElementById('snapshot-container');

const music = document.getElementById('background-music'); // messycopy.mp3
const birdAudio = document.getElementById('bird-audio');   // birdsongcopy.mp3
const clickSound = document.getElementById('click-sound'); // roll.mp3

music.volume = 0.6;
birdAudio.volume = 0.7;

let musicStarted = false;
let birdStarted = false;
let isSilent = false;
let silenceTimeout = null;

let motionVideo, motionCanvas, motionCtx, prevImageData = null;

// 🎯 Click anywhere to trigger everything
document.addEventListener('click', () => {
  // 🔈 Play click sound every time
  clickSound.currentTime = 0;
  clickSound.play();

  // 🐦 Play birdsong once
  if (!birdStarted) {
    birdAudio.play()
      .then(() => {
        birdStarted = true;
        console.log("✅ Birdsong started");
      })
      .catch(err => console.warn("❌ Birdsong failed:", err));
  }

  // 🎶 Play ambient music once
  if (!musicStarted) {
    music.play()
      .then(() => {
        musicStarted = true;
        console.log("✅ Ambient music started");
        startMotionDetection();
      })
      .catch(err => console.warn("❌ Music failed:", err));
  }

  // 📸 Snapshot
  const displayWidth = 300;
  const displayHeight = 200;
  canvas.width = displayWidth;
  canvas.height = displayHeight;
  const ctx = canvas.getContext('2d');
  ctx.drawImage(video, 0, 0, video.videoWidth, video.videoHeight, 0, 0, displayWidth, displayHeight);
  container.style.display = 'block';
  setTimeout(() => { container.style.display = 'none'; }, 3000);
});

// 🎥 Webcam + motion tracking
function startMotionDetection() {
  motionVideo = document.createElement('video');
  motionVideo.setAttribute('autoplay', true);
  motionVideo.setAttribute('playsinline', true);
  motionVideo.setAttribute('muted', true);
  motionVideo.style.display = 'none';
  document.body.appendChild(motionVideo);

  motionCanvas = document.createElement('canvas');
  motionCanvas.width = 160;
  motionCanvas.height = 120;
  motionCtx = motionCanvas.getContext('2d');

  navigator.mediaDevices.getUserMedia({ video: true })
    .then(stream => {
      motionVideo.srcObject = stream;
      motionVideo.addEventListener('loadeddata', () => {
        requestAnimationFrame(detectMotion);
      });
    })
    .catch(err => {
      console.warn("❌ Webcam access denied:", err);
    });
}

// 🔍 Detect motion and adjust music
function detectMotion() {
  if (motionVideo.readyState >= 2) {
    motionCtx.drawImage(motionVideo, 0, 0, 160, 120);
    const currentData = motionCtx.getImageData(0, 0, 160, 120);

    if (prevImageData) {
      let motion = 0;
      for (let i = 0; i < currentData.data.length; i += 4) {
        const diff =
          Math.abs(currentData.data[i] - prevImageData.data[i]) +
          Math.abs(currentData.data[i + 1] - prevImageData.data[i + 1]) +
          Math.abs(currentData.data[i + 2] - prevImageData.data[i + 2]);
        if (diff > 30) motion++;
      }

      const motionRatio = motion / (160 * 120);
      const threshold = 0.01;

      // 🚫 Silence if still for 10s
      if (motionRatio < threshold) {
        if (!isSilent && !silenceTimeout) {
          silenceTimeout = setTimeout(() => {
            fadeOutMusic(3000);
            isSilent = true;
            silenceTimeout = null;
          }, 10000); // 10s of stillness
        }
      } else {
        if (isSilent) {
          fadeInMusic(0.6, 3000);
          isSilent = false;
        }
        if (silenceTimeout) {
          clearTimeout(silenceTimeout);
          silenceTimeout = null;
        }

        // 🔊 Adjust volume based on motion
        if (musicStarted) {
          const vol = Math.min(Math.max(motionRatio * 3, 0.2), 1);
          music.volume = +vol.toFixed(2);
        }
      }
    }

    prevImageData = currentData;
  }

  requestAnimationFrame(detectMotion);
}

// 🌫 Fade Out
function fadeOutMusic(duration = 2000) {
  const start = music.volume;
  const startTime = performance.now();

  function animate(time) {
    const elapsed = time - startTime;
    const progress = Math.min(elapsed / duration, 1);
    music.volume = +(start * (1 - progress)).toFixed(3);
    if (progress < 1) {
      requestAnimationFrame(animate);
    } else {
      music.volume = 0;
    }
  }

  requestAnimationFrame(animate);
}

// 🌅 Fade In
function fadeInMusic(target = 0.6, duration = 2000) {
  const start = music.volume;
  const startTime = performance.now();

  function animate(time) {
    const elapsed = time - startTime;
    const progress = Math.min(elapsed / duration, 1);
    music.volume = +(start + (target - start) * progress).toFixed(3);
    if (progress < 1) {
      requestAnimationFrame(animate);
    }
  }

  requestAnimationFrame(animate);
}

///

const komorebiImage = document.getElementById('komorebi-image');
let komorebiTimeout = null;
let komorebiVisible = false;

// Show the image overlay
function showKomorebiImage() {
  komorebiImage.style.opacity = '0.4';
  komorebiVisible = true;
}

// Hide the image overlay
function hideKomorebiImage() {
  komorebiImage.style.opacity = '0';
  komorebiVisible = false;
}

// Reset timer when user moves mouse or interacts
function resetKomorebiTimer() {
  if (komorebiTimeout) clearTimeout(komorebiTimeout);
  if (komorebiVisible) hideKomorebiImage();

  komorebiTimeout = setTimeout(() => {
    showKomorebiImage();
  }, 30000); // 30s of stillness
}

// Listen to movement and interaction
['mousemove', 'keydown', 'touchstart'].forEach(event => {
  document.addEventListener(event, resetKomorebiTimer);
});

// Start immediately
resetKomorebiTimer();
