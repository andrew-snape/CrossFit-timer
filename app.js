// CrossFit Timer App - Modernised & Improved

// ── DOM refs ──────────────────────────────────────────────────────────────────
const timerDisplay    = document.getElementById('timer');
const statusDisplay   = document.getElementById('status');
const startButton     = document.getElementById('start');
const stopButton      = document.getElementById('stop');
const workMin         = document.getElementById('work-min');
const workSec         = document.getElementById('work-sec');
const restInput       = document.getElementById('rest');
const roundsInput     = document.getElementById('rounds');
const repIncrement    = document.getElementById('rep-increment');
const repDecrement    = document.getElementById('rep-decrement');
const repReset        = document.getElementById('rep-reset');
const repsCountDisplay = document.getElementById('reps-count');

// ── 8. Populate workout-minutes <select> dynamically (0–60) ──────────────────
(function populateWorkMin() {
  for (let i = 0; i <= 60; i++) {
    const opt = document.createElement('option');
    opt.value = i;
    opt.textContent = i;
    workMin.appendChild(opt);
  }
})();

// ── 5. Populate rounds <select> dynamically (1–30) ───────────────────────────
(function populateRounds() {
  for (let i = 1; i <= 30; i++) {
    const opt = document.createElement('option');
    opt.value = i;
    opt.textContent = i;
    roundsInput.appendChild(opt);
  }
})();

// ── 4. Persist & restore settings ────────────────────────────────────────────
function saveSettings() {
  localStorage.setItem('cf-work-min', workMin.value);
  localStorage.setItem('cf-work-sec', workSec.value);
  localStorage.setItem('cf-rest',     restInput.value);
  localStorage.setItem('cf-rounds',   roundsInput.value);
}
function restoreSettings() {
  const wm = localStorage.getItem('cf-work-min');
  const ws = localStorage.getItem('cf-work-sec');
  const r  = localStorage.getItem('cf-rest');
  const rn = localStorage.getItem('cf-rounds');
  if (wm !== null) workMin.value    = wm;
  if (ws !== null) workSec.value    = ws;
  if (r  !== null) restInput.value  = r;
  if (rn !== null) roundsInput.value = rn;
}
restoreSettings();
[workMin, workSec, restInput, roundsInput].forEach(el => el.addEventListener('change', saveSettings));

// ── 2. Web Audio API beeps ────────────────────────────────────────────────────
let audioCtx = null;
function getAudioCtx() {
  if (!audioCtx) {
    try { audioCtx = new (window.AudioContext || window.webkitAudioContext)(); } catch (_) {}
  }
  return audioCtx;
}
function beep(frequency, duration, volume) {
  const ctx = getAudioCtx();
  if (!ctx) return;
  try {
    const osc   = ctx.createOscillator();
    const gain  = ctx.createGain();
    osc.connect(gain);
    gain.connect(ctx.destination);
    osc.frequency.value = frequency;
    gain.gain.setValueAtTime(volume, ctx.currentTime);
    gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + duration);
    osc.start(ctx.currentTime);
    osc.stop(ctx.currentTime + duration);
  } catch (_) {}
}
function beepWork()     { beep(880, 0.15, 0.4); setTimeout(() => beep(880, 0.15, 0.4), 200); }
function beepRest()     { beep(440, 0.3, 0.4); }
function beepComplete() { beep(660, 0.2, 0.4); setTimeout(() => beep(880, 0.4, 0.4), 250); }

// ── 1. Screen Wake Lock ───────────────────────────────────────────────────────
let wakeLock = null;
async function acquireWakeLock() {
  if (!('wakeLock' in navigator)) return;
  try {
    wakeLock = await navigator.wakeLock.request('screen');
  } catch (_) {}
}
function releaseWakeLock() {
  if (wakeLock) { wakeLock.release().catch(() => {}); wakeLock = null; }
}
// Re-acquire after tab switch (lock is auto-released on visibility change)
document.addEventListener('visibilitychange', () => {
  if (document.visibilityState === 'visible' && timer !== null) {
    acquireWakeLock();
  }
});

// ── 6. Visual phase feedback ──────────────────────────────────────────────────
function setPhase(phase) {
  document.body.classList.remove('phase-work', 'phase-rest', 'phase-done');
  if (phase) document.body.classList.add(`phase-${phase}`);
}

// ── State ─────────────────────────────────────────────────────────────────────
let timer        = null;
let round        = 1;
let isWorking    = true;
let timeLeft     = 0;
let totalRounds  = 1;
let restDuration = 0;
let workDuration = 0;
let reps         = 0;
// 3. Drift-free timing
let intervalTarget = null;

// ── Rep counting ──────────────────────────────────────────────────────────────
function updateReps() {
  repsCountDisplay.textContent = `Reps: ${reps}`;
}
repIncrement.onclick = () => { reps++; updateReps(); };
repDecrement.onclick = () => { if (reps > 0) { reps--; updateReps(); } };
repReset.onclick     = () => { reps = 0; updateReps(); };

// ── Helpers ───────────────────────────────────────────────────────────────────
function formatTime(seconds) {
  const min = Math.floor(seconds / 60);
  const sec = seconds % 60;
  return `${String(min).padStart(2, '0')}:${String(sec).padStart(2, '0')}`;
}
function setStatus(message) {
  statusDisplay.textContent = message;
}
function resetUI() {
  timerDisplay.textContent = '00:00';
  setStatus('');
  setPhase(null);
  round = 1;
  isWorking = true;
  timeLeft = 0;
  startButton.disabled = false;
  stopButton.disabled = true;
}

// ── 3. Drift-corrected tick ───────────────────────────────────────────────────
function scheduleTick() {
  const now   = Date.now();
  // Clamp: if we're late, fire immediately and re-anchor to now
  const delay = Math.max(0, intervalTarget - now);
  timer = setTimeout(tick, delay);
  // Always advance by one second from the previous target (not from now)
  // so accumulated drift from a brief lag doesn't skip seconds
  intervalTarget += 1000;
}
function tick() {
  if (timeLeft > 0) {
    timeLeft--;
    timerDisplay.textContent = formatTime(timeLeft);
    scheduleTick();
  } else {
    if (isWorking) {
      if (restDuration > 0) {
        isWorking = false;
        timeLeft  = restDuration;
        setStatus(`Round ${round}/${totalRounds}: Rest`);
        setPhase('rest');
        beepRest();
        scheduleTick();
      } else {
        nextRoundOrFinish();
      }
    } else {
      nextRoundOrFinish();
    }
  }
}

// ── Start ─────────────────────────────────────────────────────────────────────
startButton.onclick = function () {
  if (timer !== null) return;
  // Unlock audio context on first user gesture (required by browsers)
  getAudioCtx();
  const wMin = parseInt(workMin.value, 10);
  const wSec = parseInt(workSec.value, 10);
  totalRounds  = parseInt(roundsInput.value, 10);
  restDuration = parseInt(restInput.value, 10);
  workDuration = wMin * 60 + wSec;
  if (wMin === 0 && wSec === 0) { setStatus('Set workout time!'); return; }
  startButton.disabled = true;
  stopButton.disabled  = false;
  round     = 1;
  isWorking = true;
  timeLeft  = workDuration;
  setStatus(`Round ${round}/${totalRounds}: Work!`);
  setPhase('work');
  timerDisplay.textContent = formatTime(timeLeft);
  acquireWakeLock();
  intervalTarget = Date.now() + 1000;
  scheduleTick();
};

function nextRoundOrFinish() {
  round++;
  if (round > totalRounds) {
    setStatus('Workout Complete!');
    timerDisplay.textContent = '00:00';
    setPhase('done');
    beepComplete();
    stopTimer();
  } else {
    timeLeft  = workDuration;
    isWorking = true;
    setStatus(`Round ${round}/${totalRounds}: Work!`);
    setPhase('work');
    beepWork();
    scheduleTick();
  }
}

function stopTimer() {
  clearTimeout(timer);
  timer = null;
  releaseWakeLock();
  startButton.disabled = false;
  stopButton.disabled  = true;
}
stopButton.onclick = function () {
  stopTimer();
  resetUI();
};

resetUI();
updateReps();

// ── PWA: Register service worker ──────────────────────────────────────────────
if ('serviceWorker' in navigator) {
  navigator.serviceWorker.register('/CrossFit-timer/service-worker.js');
}
