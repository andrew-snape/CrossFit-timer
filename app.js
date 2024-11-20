let timerInterval;
let currentRound = 1;

// Function to start the timer
function startTimer() {
  // Clear any existing intervals
  clearInterval(timerInterval);

  // Get values from the input fields
  const workTime = parseInt(document.getElementById('work').value);
  const restTime = parseInt(document.getElementById('rest').value);
  const totalRounds = parseInt(document.getElementById('rounds').value);

  // Reset round count and start the first workout phase
  currentRound = 1;
  startPhase("Workout", workTime, restTime, totalRounds);
}

// Function to handle the phases (Workout or Rest)
function startPhase(phase, workTime, restTime, totalRounds) {
  let timeRemaining = (phase === "Workout") ? workTime : restTime;

  // Update the UI with the current phase and round status
  updateStatus(phase, currentRound, totalRounds);
  updateTimerDisplay(timeRemaining);

  // Start the countdown
  timerInterval = setInterval(() => {
    timeRemaining--;
    updateTimerDisplay(timeRemaining);

    if (timeRemaining < 0) {
      // Clear the interval when phase ends
      clearInterval(timerInterval);

      // Play beep sound
      playBeep();

      // Switch to the next phase
      if (phase === "Workout") {
        if (currentRound >= totalRounds) {
          // If all rounds are complete, finish the timer
          updateStatus("Workout Complete!", totalRounds, totalRounds);
        } else {
          // Move to rest phase
          startPhase("Rest", workTime, restTime, totalRounds);
        }
      } else if (phase === "Rest") {
        // After rest, move to the next round of workout
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
  });
}

// Add event listener to the Start button
document.getElementById('start').addEventListener('click', startTimer);
