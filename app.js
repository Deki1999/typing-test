// @ts-nocheck

// elements
const quoteEl = document.querySelector("#quote");
const inputEl = document.querySelector("#input");
const timerEl = document.querySelector("#timer");
const wpmEl = document.querySelector("#wpm");
const accuracyEl = document.querySelector("#accuracy");
const restartBtn = document.querySelector("#restart");

let timer;
let timeLeft = 10; // ⏱️ 10 seconds duration
let currentQuote = "";
let started = false;
let startMs = 0;

function init() {
  clearInterval(timer);
  started = false;
  inputEl.value = "";
  inputEl.disabled = false;

  timeLeft = 10; // reset timer to 10 seconds
  timerEl.textContent = `Time: ${timeLeft}s`;
  wpmEl.textContent = "Speed: 0 WPM";
  accuracyEl.textContent = "Accuracy: 100%";
  restartBtn.disabled = true;
  quoteEl.innerHTML = "";

  fetchQuote();
  inputEl.focus();
}

function fetchQuote() {
  const quotes = [
    "Programming is a journey, not just a destination.",
    "The only way to learn is by doing.",
    "Work smarter, not just harder.",
    "Every line of code you write has a purpose."
  ];
  currentQuote = quotes[Math.floor(Math.random() * quotes.length)];
  renderQuote();
}

function renderQuote() {
  quoteEl.innerHTML = "";
  currentQuote.split("").forEach(char => {
    const span = document.createElement("span");
    span.textContent = char;
    quoteEl.appendChild(span);
  });
}

function startTimer() {
  started = true;
  startMs = Date.now();
  timer = setInterval(() => {
    timeLeft--;
    timerEl.textContent = `Time: ${timeLeft}s`;

    if (timeLeft <= 0) {
      clearInterval(timer);
      inputEl.disabled = true;
      restartBtn.disabled = false;
      calculateWPM();
      calculateAccuracy();

      // auto-restart after 3 seconds
      setTimeout(() => init(), 3000);
    }
  }, 1000);
}

function calculateWPM() {
  const typedWords = inputEl.value.trim().split(/\s+/).filter(Boolean).length;
  const secs = Math.max(1, (Date.now() - startMs) / 1000);
  const wpm = Math.round((typedWords / secs) * 60);
  wpmEl.textContent = `Speed: ${wpm} WPM`;
}

function calculateAccuracy() {
  const chars = quoteEl.querySelectorAll("span");
  let correct = 0;

  chars.forEach(span => {
    if (span.classList.contains("correct")) correct++;
  });

  const total = chars.length;
  const pct = Math.round((correct / total) * 100);
  accuracyEl.textContent = `Accuracy: ${pct}%`;
}

inputEl.addEventListener("input", () => {
  if (!started) startTimer();

  // live WPM
  const secs = Math.max(1, (Date.now() - startMs) / 1000);
  const words = inputEl.value.trim().split(/\s+/).filter(Boolean).length;
  const liveWpm = Math.round((words / secs) * 60);
  wpmEl.textContent = `Speed: ${liveWpm} WPM`;

  // live accuracy
  calculateAccuracy();

  const chars = quoteEl.querySelectorAll("span");
  const typed = inputEl.value.split("");

  chars.forEach((span, i) => {
    const c = typed[i];
    if (c == null) {
      span.classList.remove("correct", "wrong");
    } else if (c === span.textContent) {
      span.classList.add("correct");
      span.classList.remove("wrong");
    } else {
      span.classList.add("wrong");
      span.classList.remove("correct");
    }
  });
});

restartBtn.addEventListener("click", init);

init();