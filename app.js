// CrossFit Timer App - Modernised & Improved

const timerDisplay = document.getElementById('timer');
const statusDisplay = document.getElementById('status');
const startButton = document.getElementById('start');
const stopButton = document.getElementById('stop');
const workMin = document.getElementById('work-min');
const workSec = document.getElementById('work-sec');
const restInput = document.getElementById('rest');
const roundsInput = document.getElementById('rounds');
const repIncrement = document.getElementById('rep-increment');
const repDecrement = document.getElementById('rep-decrement');
const repsCountDisplay = document.getElementById('reps-count');
const keepAwakeDisplay = document.getElementById('keep-awake-status');
// Very low, effectively silent signal values used for iOS keep-awake fallback.
const SILENT_GAIN_LEVEL = 0.00001;
const SILENT_FREQUENCY_HZ = 20;

let timer = null;
let round = 1;
let isWorking = true;
let timeLeft = 0;
let totalRounds = 1;
let reps = 0;
let wakeLockSentinel = null;
let audioContext = null;
let silentOscillator = null;
let silentGain = null;
let keepAwakeMethod = 'none';
let visibilityHandlerAttached = false;

// Rep counting
function updateReps() {
  repsCountDisplay.textContent = `Reps: ${reps}`;
}
repIncrement.onclick = () => { reps++; updateReps(); };
repDecrement.onclick = () => { if (reps > 0) reps--; updateReps(); };

function formatTime(seconds) {
  const min = Math.floor(seconds / 60);
  const sec = seconds % 60;
  return `${min.toString().padStart(2, '0')}:${sec.toString().padStart(2, '0')}`;
}
function setStatus(message) {
  statusDisplay.textContent = message;
}
function setKeepAwakeStatus(message) {
  keepAwakeDisplay.textContent = message;
}

async function requestScreenWakeLock() {
  if (!('wakeLock' in navigator)) return false;
  try {
    wakeLockSentinel = await navigator.wakeLock.request('screen');
    keepAwakeMethod = 'wake-lock';
    setKeepAwakeStatus('Screen awake mode: on');
    wakeLockSentinel.addEventListener('release', () => {
      wakeLockSentinel = null;
      if (timer && document.visibilityState === 'visible') {
        requestScreenWakeLock();
      }
    });
    return true;
  } catch (error) {
    return false;
  }
}

function enableAudioKeepAwakeFallback() {
  const AudioContextClass = window.AudioContext || window.webkitAudioContext;
  if (!AudioContextClass) return false;
  try {
    if (!audioContext) {
      audioContext = new AudioContextClass();
    }
    if (audioContext.state === 'suspended') {
      audioContext.resume();
    }
    if (!silentOscillator) {
      silentGain = audioContext.createGain();
      silentGain.gain.value = SILENT_GAIN_LEVEL;
      silentOscillator = audioContext.createOscillator();
      silentOscillator.frequency.value = SILENT_FREQUENCY_HZ;
      silentOscillator.connect(silentGain);
      silentGain.connect(audioContext.destination);
      silentOscillator.start();
    }
    keepAwakeMethod = 'audio-fallback';
    setKeepAwakeStatus('Screen awake mode: fallback active');
    return true;
  } catch (error) {
    return false;
  }
}

async function enableKeepAwake() {
  const wakeLockActive = await requestScreenWakeLock();
  if (!wakeLockActive) {
    const fallbackActive = enableAudioKeepAwakeFallback();
    if (!fallbackActive) {
      keepAwakeMethod = 'none';
      setKeepAwakeStatus('Screen awake mode: not supported');
    }
  }
}

async function disableKeepAwake() {
  if (wakeLockSentinel) {
    try {
      await wakeLockSentinel.release();
    } catch (error) {
      // Ignore release errors when the wake lock is already gone.
    }
    wakeLockSentinel = null;
  }
  if (silentOscillator) {
    try {
      silentOscillator.stop();
    } catch (error) {
      // Ignore stop errors when the oscillator is already stopped.
    }
    silentOscillator.disconnect();
    silentOscillator = null;
  }
  if (silentGain) {
    silentGain.disconnect();
    silentGain = null;
  }
  if (audioContext) {
    audioContext.close().catch(() => {
      // Ignore close errors when context teardown is already complete.
    });
    audioContext = null;
  }
  keepAwakeMethod = 'none';
  setKeepAwakeStatus('');
}

function handleVisibilityChange() {
  if (shouldReacquireWakeLock()) {
    requestScreenWakeLock();
  }
}

function shouldReacquireWakeLock() {
  return document.visibilityState === 'visible' && timer && keepAwakeMethod === 'wake-lock' && !wakeLockSentinel;
}

function attachVisibilityHandler() {
  if (!visibilityHandlerAttached) {
    document.addEventListener('visibilitychange', handleVisibilityChange);
    visibilityHandlerAttached = true;
  }
}

function detachVisibilityHandler() {
  if (visibilityHandlerAttached) {
    document.removeEventListener('visibilitychange', handleVisibilityChange);
    visibilityHandlerAttached = false;
  }
}

function resetUI() {
  timerDisplay.textContent = '00:00';
  setStatus('');
  round = 1;
  isWorking = true;
  timeLeft = 0;
  startButton.disabled = false;
  stopButton.disabled = true;
  setKeepAwakeStatus('');
}
startButton.onclick = async function() {
  if (timer) return; // prevent multiple timers
  const wMin = parseInt(workMin.value, 10);
  const wSec = parseInt(workSec.value, 10);
  const rest = parseInt(restInput.value, 10);
  totalRounds = parseInt(roundsInput.value, 10);
  if (wMin === 0 && wSec === 0) {
    setStatus('Set workout time!');
    return;
  }
  startButton.disabled = true;
  stopButton.disabled = false;
  round = 1;
  isWorking = true;
  timeLeft = wMin * 60 + wSec;
  setStatus(`Round ${round}/${totalRounds}: Work!`);
  timerDisplay.textContent = formatTime(timeLeft);
  await enableKeepAwake();
  attachVisibilityHandler();
  timer = setInterval(() => {
    if (timeLeft > 0) {
      timeLeft--;
      timerDisplay.textContent = formatTime(timeLeft);
    } else {
      if (isWorking) {
        if (rest > 0) {
          isWorking = false;
          timeLeft = rest;
          setStatus(`Round ${round}/${totalRounds}: Rest`);
        } else {
          nextRoundOrFinish();
        }
      } else {
        nextRoundOrFinish();
      }
    }
  }, 1000);
};
function nextRoundOrFinish() {
  round++;
  if (round > totalRounds) {
    setStatus('Workout Complete!');
    timerDisplay.textContent = '00:00';
    stopTimer().catch((error) => {
      console.warn('Cleanup issue after workout completion:', error);
    });
  } else {
    const wMin = parseInt(workMin.value, 10);
    const wSec = parseInt(workSec.value, 10);
    timeLeft = wMin * 60 + wSec;
    isWorking = true;
    setStatus(`Round ${round}/${totalRounds}: Work!`);
  }
}
async function stopTimer() {
  clearInterval(timer);
  timer = null;
  startButton.disabled = false;
  stopButton.disabled = true;
  detachVisibilityHandler();
  await disableKeepAwake();
}
stopButton.onclick = async function() {
  await stopTimer();
  resetUI();
};

resetUI();
updateReps();
// PWA: Register service worker if available
if ('serviceWorker' in navigator) {
  navigator.serviceWorker.register('/CrossFit-timer/service-worker.js');
}
