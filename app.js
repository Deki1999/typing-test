// @ts-nocheck

// elements
const quoteEl = document.querySelector("#quote");
const inputEl = document.querySelector("#input");
const timerEl = document.querySelector("#timer");
const wpmEl = document.querySelector("#wpm");
const restartBtn = document.querySelector("#restart");

let timer;
let timeLeft = 30;
let currentQuote = "";
let started = false;

function init() {
  clearInterval(timer);
  started = false;
  inputEl.value = "";
  inputEl.disabled = false;
  timeLeft = 30;
  timerEl.textContent = `Time: ${timeLeft}s`;
  wpmEl.textContent = "Speed: 0 WPM";
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
  timer = setInterval(() => {
    timeLeft--;
    timerEl.textContent = `Time: ${timeLeft}s`;
    if (timeLeft <= 0) {
      clearInterval(timer);
      inputEl.disabled = true;
      restartBtn.disabled = false;
      calculateWPM();

      // 🔁 auto-restart after 3s
      setTimeout(() => init(), 3000);
    }
  }, 1000);
}

function calculateWPM() {
  const typedWords = inputEl.value.trim().split(/\s+/).filter(Boolean).length;
  const wpm = Math.round((typedWords / 30) * 60);
  wpmEl.textContent = `Speed: ${wpm} WPM`;
}

inputEl.addEventListener("input", () => {
  if (!started) startTimer();
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