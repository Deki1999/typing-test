// @ts-nocheck

// ---------- Elements ----------
const quoteEl      = document.querySelector("#quote");
const inputEl      = document.querySelector("#input");
const timerEl      = document.querySelector("#timer");
const wpmEl        = document.querySelector("#wpm");
const accuracyEl   = document.querySelector("#accuracy");
const bestEl       = document.querySelector("#best");
const restartBtn   = document.querySelector("#restart");
const pauseBtn     = document.querySelector("#pause");
const newQuoteBtn  = document.querySelector("#newQuote");
const durationBtns = document.querySelectorAll(".dur-btn");
const soundBtn     = document.querySelector("#sound");
const progressBar  = document.querySelector("#progressBar");
const toastEl      = document.querySelector("#toast");

// ---------- State ----------
let timer = null;
let duration = 30;                 // default (30s dugme je aktivno)
let timeLeft = duration;
let started = false;
let paused = false;
let currentQuote = "";

let best = loadBest();             // { wpm, acc }
let soundOn = loadSound();         // true / false

// ---------- Boot ----------
updateBestUI();
updateSoundUI();
init();

// ---------- Init ----------
function init() {
  clearInterval(timer);
  started = false;
  paused  = false;

  inputEl.value = "";
  inputEl.disabled = false;

  timeLeft = duration;
  timerEl.textContent = `Time: ${timeLeft}s`;
  wpmEl.textContent   = "Speed: 0 WPM";
  if (accuracyEl) accuracyEl.textContent = "Accuracy: 100%";
  restartBtn.disabled = true;

  if (progressBar) progressBar.style.width = "100%";
  quoteEl.classList.remove("finish-anim");
  quoteEl.innerHTML = "";

  fetchQuote();
  inputEl.focus();
}

// ---------- Quotes (API + fallback) ----------
async function fetchQuote() {
  try {
    const ctrl = new AbortController();
    const to = setTimeout(() => ctrl.abort(), 3000);
    const res = await fetch("https://api.quotable.io/random?minLength=60&maxLength=120", { signal: ctrl.signal });
    clearTimeout(to);
    if (!res.ok) throw new Error("bad status");
    const data = await res.json();
    currentQuote = data.content;
  } catch {
    const fallback = [
      "Programming is a journey not just a destination keep typing and improving every single day.",
      "The only way to learn is by doing keep your hands on the keyboard and your mind curious.",
      "Work smarter not just harder focus on small consistent progress and it will compound.",
      "Every line of code you write has a purpose make it clean simple and readable."
    ];
    currentQuote = fallback[Math.floor(Math.random() * fallback.length)];
  }
  renderQuote();
}

// ---------- Render (words + chars) ----------
function renderQuote() {
  quoteEl.innerHTML = "";
  const words = currentQuote.split(" ");
  words.forEach((word, wi) => {
    const wSpan = document.createElement("span");
    wSpan.className = "word";
    wSpan.dataset.index = String(wi);
    [...word].forEach(ch => {
      const cSpan = document.createElement("span");
      cSpan.className = "char";
      cSpan.textContent = ch;
      wSpan.appendChild(cSpan);
    });
    quoteEl.appendChild(wSpan);
    if (wi !== words.length - 1) quoteEl.append(" ");
  });
}

// ---------- Timer ----------
function startTimer() {
  started = true;
  paused  = false;
  timer = setInterval(() => {
    if (paused) return;
    timeLeft--;
    timerEl.textContent = `Time: ${timeLeft}s`;

    // progress bar
    if (progressBar) {
      const pct = Math.max(0, (timeLeft / duration) * 100);
      progressBar.style.width = pct + "%";
    }

    if (timeLeft <= 0) {
      clearInterval(timer);
      finishRun();
    }
  }, 1000);
}

// ---------- Metrics ----------
function elapsedSeconds() {
  return Math.max(1, duration - timeLeft); // radi i sa pauzom
}
function liveWPM() {
  const words = inputEl.value.trim().split(/\s+/).filter(Boolean).length;
  return Math.round((words / elapsedSeconds()) * 60);
}
function calcAccuracyPct() {
  // Word-level accuracy: reč je tačna samo ako je potpuno jednaka
  const expectedWords = currentQuote.split(" ");
  const typedWords = inputEl.value.split(" ");
  let ok = 0;
  for (let i = 0; i < expectedWords.length; i++) {
    if (typedWords[i] && typedWords[i] === expectedWords[i]) ok++;
  }
  const total = expectedWords.length || 1;
  return Math.round((ok / total) * 100);
}

// ---------- Paint (chars + words) ----------
function repaint() {
  const wordSpans = quoteEl.querySelectorAll(".word");
  const typed = inputEl.value;
  const typedWords = typed.split(" ");

  wordSpans.forEach((wSpan, i) => {
    const target = currentQuote.split(" ")[i] ?? "";
    const typedW = typedWords[i] ?? "";

    wSpan.classList.remove("word-ok", "word-bad");

    const charSpans = wSpan.querySelectorAll(".char");
    charSpans.forEach((cSpan, ci) => {
      const c = typedW[ci];
      cSpan.classList.remove("correct", "wrong");
      if (c == null) return;
      if (c === cSpan.textContent) cSpan.classList.add("correct");
      else cSpan.classList.add("wrong");
    });

    // markiraj celu reč kada je unesena
    if (typedW.length >= target.length || (typedWords.length - 1) >= i) {
      if (typedW === target) wSpan.classList.add("word-ok");
      else if (typedW.length > 0) wSpan.classList.add("word-bad");
    }
  });
}

// ---------- Finish ----------
function finishRun() {
  inputEl.disabled = true;
  inputEl.blur(); // zatvori mobilnu tastaturu
  restartBtn.disabled = false;

  const finalWpm = liveWPM();
  const finalAcc = calcAccuracyPct();
  wpmEl.textContent      = `Speed: ${finalWpm} WPM`;
  if (accuracyEl) accuracyEl.textContent = `Accuracy: ${finalAcc}%`;

  // best
  if (finalWpm > best.wpm) best.wpm = finalWpm;
  if (finalAcc > best.acc) best.acc = finalAcc;
  saveBest(); updateBestUI();

  // progress do 0 i efekti
  if (progressBar) progressBar.style.width = "0%";
  beep();
  quoteEl.classList.add("finish-anim");

  // auto restart posle 3s
  setTimeout(() => init(), 3000);
}

// ---------- Best storage ----------
function loadBest() {
  try { return JSON.parse(localStorage.getItem("typing.best.v1")) ?? { wpm: 0, acc: 0 }; }
  catch { return { wpm: 0, acc: 0 }; }
}
function saveBest() {
  localStorage.setItem("typing.best.v1", JSON.stringify(best));
}
function updateBestUI() {
  bestEl.textContent = `Best: ${best.wpm} WPM • ${best.acc}%`;
}

// ---------- Sound pref ----------
function loadSound() {
  try { return JSON.parse(localStorage.getItem("typing.sound.on")) ?? true; }
  catch { return true; }
}
function saveSound() {
  localStorage.setItem("typing.sound.on", JSON.stringify(soundOn));
}
function updateSoundUI() {
  if (!soundBtn) return;
  soundBtn.textContent = soundOn ? "Sound: On" : "Sound: Off";
  soundBtn.classList.toggle("muted", !soundOn);
}

// ---------- Beep ----------
function beep() {
  if (!soundOn) return;
  try {
    const ctx = new (window.AudioContext || window.webkitAudioContext)();
    const o = ctx.createOscillator();
    const g = ctx.createGain();
    o.type = "sine";
    o.frequency.value = 880;
    o.connect(g); g.connect(ctx.destination);
    g.gain.setValueAtTime(0.0001, ctx.currentTime);
    g.gain.exponentialRampToValueAtTime(0.2, ctx.currentTime + 0.01);
    o.start();
    setTimeout(() => {
      g.gain.exponentialRampToValueAtTime(0.0001, ctx.currentTime + 0.1);
      o.stop(ctx.currentTime + 0.12);
    }, 120);
  } catch {}
}

// ---------- Toast ----------
function showToast(msg){
  if(!toastEl) return;
  toastEl.textContent = msg;
  toastEl.classList.add("show");
  setTimeout(() => toastEl.classList.remove("show"), 1500);
}

// ---------- Events ----------
inputEl.addEventListener("input", () => {
  if (!started) startTimer();

  // live brojke
  wpmEl.textContent = `Speed: ${liveWPM()} WPM`;
  if (accuracyEl) accuracyEl.textContent = `Accuracy: ${calcAccuracyPct()}%`;

  repaint();
});

restartBtn.addEventListener("click", init);

newQuoteBtn.addEventListener("click", async () => {
  clearInterval(timer);
  started = false; paused = false;
  inputEl.value = ""; inputEl.disabled = false;
  timeLeft = duration;
  timerEl.textContent = `Time: ${timeLeft}s`;
  wpmEl.textContent = "Speed: 0 WPM";
  if (accuracyEl) accuracyEl.textContent = "Accuracy: 100%";
  restartBtn.disabled = true;
  quoteEl.classList.remove("finish-anim");
  if (progressBar) progressBar.style.width = "100%";
  await fetchQuote();
  inputEl.focus();
});

pauseBtn.addEventListener("click", () => {
  if (!started) return;
  paused = !paused;
  pauseBtn.textContent = paused ? "Resume" : "Pause";
  if (paused) inputEl.blur(); else inputEl.focus();
});

durationBtns.forEach(btn => {
  btn.addEventListener("click", () => {
    durationBtns.forEach(b => b.classList.remove("active"));
    btn.classList.add("active");
    duration = Number(btn.dataset.dur);
    init(); // restart sa novim trajanjem
  });
});

soundBtn.addEventListener("click", () => {
  soundOn = !soundOn;
  saveSound();
  updateSoundUI();
});

// Focus anywhere (sem na dugmad/input)
document.addEventListener("click", (e) => {
  if (inputEl.disabled) return;
  if (e.target === inputEl) return;
  if (e.target.closest("button")) return;
  setTimeout(() => inputEl.focus(), 0);
});

// Disable paste (anti-cheat)
inputEl.addEventListener("paste", (e) => {
  e.preventDefault();
  showToast("Paste is disabled for this test");
});