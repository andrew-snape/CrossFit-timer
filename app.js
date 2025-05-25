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

let timer = null;
let round = 1;
let isWorking = true;
let timeLeft = 0;
let totalRounds = 1;
let reps = 0;

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
function resetUI() {
  timerDisplay.textContent = '00:00';
  setStatus('');
  round = 1;
  isWorking = true;
  timeLeft = 0;
  startButton.disabled = false;
  stopButton.disabled = true;
}
startButton.onclick = function() {
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
    stopTimer();
  } else {
    const wMin = parseInt(workMin.value, 10);
    const wSec = parseInt(workSec.value, 10);
    timeLeft = wMin * 60 + wSec;
    isWorking = true;
    setStatus(`Round ${round}/${totalRounds}: Work!`);
  }
}
function stopTimer() {
  clearInterval(timer);
  timer = null;
  startButton.disabled = false;
  stopButton.disabled = true;
}
stopButton.onclick = function() {
  stopTimer();
  resetUI();
};
resetUI();
updateReps();
// PWA: Register service worker if available
if ('serviceWorker' in navigator) {
  navigator.serviceWorker.register('/CrossFit-timer/service-worker.js');
}
