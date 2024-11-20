let timerInterval;  // Interval ID for the countdown timer
let currentRound = 1;  // Keeps track of the current round
let isWorkout = true;  // Keeps track of whether it's a workout or rest phase

// Function to start the timer
function startTimer() {
  // Clear any existing intervals to prevent multiple timers running
  clearInterval(timerInterval);

  // Get values from the input fields
  const workTime = parseInt(document.getElementById('work').value);
  const restTime = parseInt(document.getElementById('rest').value);
  const totalRounds = parseInt(document.getElementById('rounds').value);

  // Reset to the first round and set to workout mode
  currentRound = 1;
  isWorkout = true;

  // Start the first workout phase
  startPhase("Workout", workTime, restTime, totalRounds);
}

// Function to handle a single phase of the timer
function startPhase(phase, workTime, restTime, totalRounds) {
  let timeRemaining = (phase === "Workout") ? workTime : restTime;

  // Update the status display
  updateStatus(phase, currentRound, totalRounds);
  updateTimerDisplay(timeRemaining);

  // Set up a countdown timer for the current phase
  timerInterval = setInterval(() => {
    timeRemaining--;
    updateTimerDisplay(timeRemaining);

    if (timeRemaining <= 0) {
      // Clear the interval when the current phase ends
      clearInterval(timerInterval);

      // Play a beep sound when time runs out
      playBeep();

      // Switch between workout and rest phases or move to the next round
      if (phase === "Workout") {
        if (currentRound >= totalRounds) {
          // All rounds complete
          updateStatus("Workout Complete!", totalRounds, totalRounds);
        } else {
          // Move to rest phase
          isWorkout = false;
          startPhase("Rest", workTime, restTime, totalRounds);
        }
      } else if (phase === "Rest") {
        // After rest, move to the next workout round
        isWorkout = true;
        currentRound++;
        startPhase("Workout", workTime, restTime, totalRounds);
      }
    }
  }, 1000);
}

// Function to update the timer display
function updateTimerDisplay(seconds) {
  const minutes = Math.floor(seconds / 60);
  const secs = seconds % 60;
  document.getElementById('timer').textContent = `${minutes
    .toString()
    .padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
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

// Function to play a beep sound
function playBeep() {
  const beep = new Audio("https://www.soundjay.com/button/beep-07.wav");
  beep.play().catch(error => {
    console.error("Error playing beep sound:", error);
    // Display a fallback alert if the beep cannot be played
    alert("Phase complete! Please switch phases manually if required.");
  });
}

// Add event listener to the Start button
document.getElementById('start').addEventListener('click', startTimer);
