// JavaScript code for CrossFit Timer App
let timerInterval;
let currentRound = 1;
let repsCount = 0;
let isWorkout = true;

// Function to start the timer
function startTimer() {
  // Clear any existing intervals
  clearInterval(timerInterval);

  // Get values from the input fields
  const workMinutes = parseInt(document.getElementById('work-min').value);
  const workSeconds = parseInt(document.getElementById('work-sec').value);
  const workTime = (workMinutes * 60) + workSeconds;
  const restTime = parseInt(document.getElementById('rest').value);
  const totalRounds = parseInt(document.getElementById('rounds').value);

  // Reset round count and rep count
  currentRound = 1;
  repsCount = 0;
  isWorkout = true;
  updateRepsCount();
  updateStatus("Workout", currentRound, totalRounds);

  // Start the first phase
  runTimer(workTime, restTime, totalRounds);
}

// Function to run the timer
function runTimer(workTime, restTime, totalRounds) {
  let timeRemaining = isWorkout ? workTime : restTime;

  // Update the display
  updateTimerDisplay(timeRemaining);

  timerInterval = setInterval(() => {
    timeRemaining--;
    updateTimerDisplay(timeRemaining);

    if (timeRemaining < 0) {
      // Play a beep sound when time runs out
      playBeep();

      // Clear the current interval
      clearInterval(timerInterval);

      // Switch between workout and rest phases
      if (isWorkout) {
        if (currentRound >= totalRounds) {
          // All rounds complete
          updateStatus("Workout Complete!", totalRounds, totalRounds);
        } else {
          // Move to rest phase
          isWorkout = false;
          updateStatus("Rest", currentRound, totalRounds);
          runTimer(workTime, restTime, totalRounds);
        }
      } else {
        // After rest, move to the next workout round
        isWorkout = true;
        currentRound++;
        updateStatus("Workout", currentRound, totalRounds);
        runTimer(workTime, restTime, totalRounds);
      }
    }
  }, 1000);
}

// Function to update the timer display
function updateTimerDisplay(seconds) {
  const minutes = Math.floor(seconds / 60);
  const secs = seconds % 60;
  document.getElementById('timer').textContent = `${minutes.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
}

// Function to update the status (Workout/Rest and Rounds)
function updateStatus(phase, round, totalRounds) {
  const statusElement = document.getElementById('status');
  if (phase === "Workout Complete!") {
    statusElement.textContent = phase;
  } else {
    statusElement.textContent = `${phase} - Round ${round} of ${totalRounds}`;
  }
}

// Function to play a generated beep sound using Web Audio API
function playBeep() {
  const audioCtx = new (window.AudioContext || window.webkitAudioContext)();
  const oscillator = audioCtx.createOscillator();
  oscillator.type = 'square'; // Tone type: square wave for a buzzer-like sound
  oscillator.frequency.setValueAtTime(440, audioCtx.currentTime); // Frequency in Hz
  oscillator.connect(audioCtx.destination);
  oscillator.start();

  // Stop the beep after 200 ms
  setTimeout(() => {
    oscillator.stop();
  }, 200);
}

// Function to count reps (increment)
function incrementRep() {
  repsCount++;
  updateRepsCount();
}

// Function to count reps (decrement)
function decrementRep() {
  if (repsCount > 0) {
    repsCount--;
    updateRepsCount();
  }
}

// Function to update the reps count display
function updateRepsCount() {
  document.getElementById('reps-count').textContent = `Reps: ${repsCount}`;
}

// Function to stop the timer
function stopTimer() {
  clearInterval(timerInterval);
  updateTimerDisplay(0);
  updateStatus("Timer Stopped", 0, 0);
  repsCount = 0;
  updateRepsCount();
}

// Add event listeners to buttons
document.getElementById('start').addEventListener('click', startTimer);
document.getElementById('stop').addEventListener('click', stopTimer);
document.getElementById('rep-increment').addEventListener('click', incrementRep);
document.getElementById('rep-decrement').addEventListener('click', decrementRep);

