// ----------------------------
// 1. CONFIG
// ----------------------------
const apiUrl = window.location.hostname === "127.0.0.1" 
  ? "http://localhost:5050" 
  : "https://matchplay-platform.onrender.com";

const totalHoles = 18;

// ----------------------------
// 2. DOM ELEMENTS
// ----------------------------
const matchIdDisplay = document.getElementById("matchIdDisplay");
const player1El = document.getElementById("player1Name");
const player2El = document.getElementById("player2Name");
const player1ElIndex = document.getElementById("player1NameIndex");
const player2ElIndex = document.getElementById("player2NameIndex");
const matchNameEl = document.getElementById("matchName");

const deleteMatchBtn = document.getElementById("deleteMatchBtn");
const holeDropdown = document.getElementById("holeDropdown");
const player1Btn = document.getElementById("player1Btn");
const player2Btn = document.getElementById("player2Btn");
const drawBtn = document.getElementById("drawBtn");

const prevHoleBtn = document.querySelector(".currentHole-container .left");
const nextHoleBtn = document.querySelector(".currentHole-container .right");
const currentHoleEl = document.querySelector(".currentHole");
const kaartContainer = document.querySelector(".holeskaart");
const scorecardEl = document.querySelector(".scorecard");

// ----------------------------
// 3. GLOBALS
// ----------------------------
let matchId = new URLSearchParams(window.location.search).get("matchId");
let player1Name = "";
let player2Name = "";
let matchName = "";
let holesData = [];
let selectedHoleNumber = 1;

// ----------------------------
// 4. UTILS
// ----------------------------
function showToast(message, duration = 2000) {
  const toastEl = document.querySelector(".toast");
  const toastElp = toastEl.querySelector("p");

  toastElp.textContent = message;
  toastEl.classList.add("show");

  setTimeout(() => toastEl.classList.remove("show"), duration);
}

function updateScoreDisplay(score1, score2) {
  const player1ScoreEl = document.getElementById("scoreP1");
  const player2ScoreEl = document.getElementById("scoreP2");

  let p1Text = "", p2Text = "";
  const diff = score1 - score2;
  const holesPlayed = holesData.filter(h => h.winner !== null).length;
  const remainingHoles = totalHoles - holesPlayed;

  if (diff > 0) p1Text = diff > remainingHoles ? `${diff}&${remainingHoles}` : `${diff}UP`;
  else if (diff < 0) p2Text = -diff > remainingHoles ? `${-diff}&${remainingHoles}` : `${-diff}UP`;
  else p1Text = p2Text = "A/S";

  player1ScoreEl.textContent = p1Text;
  player2ScoreEl.textContent = p2Text;

  [player1ScoreEl, player2ScoreEl].forEach(el => el.classList.remove("as"));
  if (p1Text === "A/S") player1ScoreEl.classList.add("as");
  if (p2Text === "A/S") player2ScoreEl.classList.add("as");
}

function resetWinnerButtons() {
  [player1Btn, player2Btn, drawBtn].forEach(btn => btn.classList.remove("currentWinner"));
}

function markWinnerButton(winner) {
  resetWinnerButtons();
  if (winner === 1) player1Btn.classList.add("currentWinner");
  if (winner === 2) player2Btn.classList.add("currentWinner");
  if (winner === 0) drawBtn.classList.add("currentWinner");
}

// ----------------------------
// 5. API
// ----------------------------
async function fetchMatch() {
  const res = await fetch(`${apiUrl}/matches?id=${matchId}`);
  const data = await res.json();
  return data.find(m => m.id == matchId);
}

async function fetchHoles() {
  const res = await fetch(`${apiUrl}/matches/${matchId}/score`);
  return await res.json();
}

async function updateHole(holeNumber, winner) {
  await fetch(`${apiUrl}/matches/${matchId}/holes/${holeNumber}`, {
    method: "PUT",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ winner }),
  });
}

async function deleteMatch() {
  const res = await fetch(`${apiUrl}/matches/${matchId}`, { method: "DELETE" });
  if (!res.ok) throw new Error("Fout bij verwijderen!");
}

// ----------------------------
// 6. RENDERING
// ----------------------------
function renderHoles() {
  if (!holesData.length || !kaartContainer) return;
  kaartContainer.innerHTML = "";

  holesData.forEach(h => {
    const holeDiv = document.createElement("div");
    holeDiv.classList.add("hole");
    holeDiv.textContent = h.hole_number;

    if (h.winner === 1) holeDiv.classList.add("speler-1");
    else if (h.winner === 2) holeDiv.classList.add("speler-2");
    else if (h.winner === 0) holeDiv.classList.add("gelijk");

    if (h.hole_number === selectedHoleNumber) holeDiv.classList.add("selected-hole");

    holeDiv.addEventListener("click", () => {
      selectedHoleNumber = h.hole_number;
      updateHoleDisplay();
      renderHoles();
    });

    kaartContainer.appendChild(holeDiv);
  });
}

function updateHoleDisplay() {
  if (!currentHoleEl || !holeDropdown) return;
  currentHoleEl.textContent = selectedHoleNumber;
  holeDropdown.value = selectedHoleNumber;
  displayCurrentWinner();
}

function displayCurrentWinner() {
  if (!holesData.length) return;

  const hole = holesData.find(h => h.hole_number === selectedHoleNumber);
  const score1 = holesData.filter(h => h.winner === 1).length;
  const score2 = holesData.filter(h => h.winner === 2).length;

  updateScoreDisplay(score1, score2);
  if (hole) markWinnerButton(hole.winner);
}

// ----------------------------
// 7. EVENTS
// ----------------------------
player1Btn.addEventListener("click", () => handleHoleClick(1));
player2Btn.addEventListener("click", () => handleHoleClick(2));
drawBtn.addEventListener("click", () => handleHoleClick(0));

prevHoleBtn.addEventListener("click", () => {
  if (selectedHoleNumber > 1) { selectedHoleNumber--; updateHoleDisplay(); }
});
nextHoleBtn.addEventListener("click", () => {
  if (selectedHoleNumber < totalHoles) { selectedHoleNumber++; updateHoleDisplay(); }
});

holeDropdown.addEventListener("change", (e) => {
  selectedHoleNumber = parseInt(e.target.value, 10);
  updateHoleDisplay();
});

if (scorecardEl) scorecardEl.addEventListener("click", () => {
  document.querySelector(".kaart-container").classList.toggle("open");
  scorecardEl.classList.toggle("open");
});

deleteMatchBtn.addEventListener("click", async () => {
  if (!confirm("Weet je zeker dat je deze match wilt verwijderen?")) return;
  try {
    await deleteMatch();
    alert("Match verwijderd!");
    window.location.href = "./index.html";
  } catch (err) {
    alert(err.message);
  }
});

// ----------------------------
// 8. LOGIC / HANDLERS
// ----------------------------
async function handleHoleClick(winner) {
  markWinnerButton(winner);

  // optimistisch score update
  let score1 = holesData.filter(h => h.winner === 1).length;
  let score2 = holesData.filter(h => h.winner === 2).length;

  if (winner === 1) score1++;
  if (winner === 2) score2++;

  updateScoreDisplay(score1, score2);

  // update lokale data
  const holeIndex = holesData.findIndex(h => h.hole_number === selectedHoleNumber);
  if (holeIndex !== -1) holesData[holeIndex].winner = winner;

  try {
    await updateHole(selectedHoleNumber, winner);
    showToast(`Hole ${selectedHoleNumber} opgeslagen!`);
  } catch {
    showToast("Opslaan mislukt");
    return;
  }

  renderHoles();
  displayCurrentWinner();

  // auto-advance
  const newDiff = score1 - score2;
  const playedNow = holesData.filter(h => h.winner !== null).length;
  const remainingNow = totalHoles - playedNow;
  const matchOver = Math.abs(newDiff) > remainingNow;

  if (!matchOver && selectedHoleNumber < totalHoles) {
    setTimeout(() => {
      selectedHoleNumber++;
      updateHoleDisplay();
      renderHoles();
    }, 800);
  }
}

// ----------------------------
// 9. INIT
// ----------------------------
(async function init() {
  const match = await fetchMatch();
  if (!match) {
    alert("Verkeerd wedstrijd ID!");
    window.location.href = "./index.html";
    return;
  }

  // update DOM
  player1El.textContent = match.player1_name;
  player2El.textContent = match.player2_name;
  player1ElIndex.textContent = match.player1_name;
  player2ElIndex.textContent = match.player2_name;
  matchNameEl.textContent = match.match_name;
  player1Name = match.player1_name;
  player2Name = match.player2_name;
  player1Btn.firstChild.textContent = player1Name;
  player2Btn.firstChild.textContent = player2Name;

  // eerste load
  holesData = await fetchHoles();
  renderHoles();
  displayCurrentWinner();

  // periodic refresh
  setInterval(async () => {
    const newHoles = await fetchHoles();
    if (JSON.stringify(newHoles) !== JSON.stringify(holesData)) {
      holesData = newHoles;
      renderHoles();
      displayCurrentWinner();
    }
  }, 1500);
})();