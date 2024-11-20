let workoutTime, restTime, rounds, timer;
let currentRound = 0;
let isWorkout = true;

document.getElementById('start').addEventListener('click', () => {
  workoutTime = parseInt(document.getElementById('work').value);
  restTime = parseInt(document.getElementById('rest').value);
  rounds = parseInt(document.getElementById('rounds').value);
  currentRound = 0;
  isWorkout = true;
  startTimer(workoutTime);
});

function startTimer(duration) {
  clearInterval(timer);
  let remaining = duration;

  timer = setInterval(() => {
    document.getElementById('timer').textContent = formatTime(remaining);
    if (remaining <= 0) {
      clearInterval(timer);
      if (isWorkout) {
        isWorkout = false;
        if (currentRound < rounds) {
          startTimer(restTime);
        }
      } else {
        currentRound++;
        isWorkout = true;
        if (currentRound < rounds) {
          startTimer(workoutTime);
        } else {
          document.getElementById('timer').textContent = "Done!";
        }
      }
    }
    remaining--;
  }, 1000);
}

function formatTime(seconds) {
  let mins = Math.floor(seconds / 60);
  let secs = seconds % 60;
  return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
}
// Check if the browser supports service workers
if ('serviceWorker' in navigator) {
  // Register the service worker
  navigator.serviceWorker.register('/service-worker.js')
    .then(registration => {
      console.log('Service Worker registered successfully:', registration);
    })
    .catch(error => {
      console.error('Service Worker registration failed:', error);
    });
}
