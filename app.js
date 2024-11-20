let timerInterval;
let currentRound = 1;
let isWorkout = true;

// Function to start the timer
function startTimer() {
  // Clear any existing intervals
  clearInterval(timerInterval);

  // Get values from the input fields
  const workTime = parseInt(document.getElementById('work').value);
  const restTime = parseInt(document.getElementById('rest').value);
  const totalRounds = parseInt(document.getElementById('rounds').value);

  // Display initial state
  currentRound = 1;
  isWorkout = true;
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

      clearInterval(timerInterval); // Clear the interval before switching

      // Switch between workout and rest phases
      if (isWorkout) {
        isWorkout = false;
        updateStatus("Rest", currentRound, totalRounds);
        runTimer(workTime, restTime, totalRounds);
      } else {
        isWorkout = true;
        currentRound++;

        if (currentRound > totalRounds) {
          // End the timer if all rounds are complete
          updateStatus("Workout Complete!", totalRounds, totalRounds);
          return;
        }

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
  beep.play();
}

// Add event listener to the Start button
document.getElementById('start').addEventListener('click', startTimer);
