countdown = 120;
function startTimer() {
  setTimeout(() => {
    timerDisplay.textContent = "Time's up!";
    submitButton.style.display = "none";
    resendButton.style.display = "block";
  }, 120000);
}
