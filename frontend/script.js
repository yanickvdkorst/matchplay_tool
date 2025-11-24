// Refactored dashboard script
// Structuur: config -> DOM -> utils -> api -> rendering -> events -> init

// ----------------------------
// 1. CONFIG
// ----------------------------
const apiUrl = window.location.hostname === "127.0.0.1"
  ? "http://localhost:5050"
  : "https://matchplay-platform.onrender.com";

// ----------------------------
// 2. DOM ELEMENTEN
// ----------------------------
const matchesBody = document.getElementById("matchesBody");
const addMatchBtn = document.getElementById("addMatchBtn");
const newPlayer1Input = document.getElementById("newPlayer1");
const newPlayer2Input = document.getElementById("newPlayer2");
const newMatchNameInput = document.getElementById("newName");
const modals = document.querySelectorAll(".modal");
const openModalBtns = document.querySelectorAll(".openModal");
const closeModalBtns = document.querySelectorAll(".closeModal");
const dashboardLoader = document.getElementById("dashboardLoader");

let lastDashboardState = "";


// ----------------------------
// 3. UTILS
// ----------------------------
function setLoading(isLoading) {
  if (!dashboardLoader) return;
  dashboardLoader.classList.toggle("hidden", !isLoading);
}

function calculateUpScore(holes) {
  let score1 = 0;
  let score2 = 0;

  holes.forEach(h => {
    if (h.winner === 1) score1++;
    if (h.winner === 2) score2++;
  });

  const played = holes.filter(h => h.winner !== null).length;
  const remaining = 18 - played;
  const diff = score1 - score2;

  if (diff > 0) {
    if (diff > remaining) return { p1: `${diff}&${remaining}`, p2: "", end: true };
    return { p1: `${diff}UP`, p2: "", end: false };
  }

  if (diff < 0) {
    if (-diff > remaining) return { p1: "", p2: `${-diff}&${remaining}`, end: true };
    return { p1: "", p2: `${-diff}UP`, end: false };
  }

  return { p1: "A/S", p2: "A/S", end: false };
}

function getCurrentHole(holes, matchOver) {
  if (matchOver) return "F";

  const last = [...holes].reverse().find(h => h.winner !== null);
  if (!last) return 0;
  return last.hole_number === 18 ? "F" : last.hole_number;
}

// ----------------------------
// 4. API CALLS
// ----------------------------
async function apiGet(path) {
  const res = await fetch(`${apiUrl}${path}`);
  if (!res.ok) throw new Error(res.status);
  return res.json();
}

async function apiPost(path, data) {
  const res = await fetch(`${apiUrl}${path}`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(data)
  });
  if (!res.ok) throw new Error(res.status);
  return res.json();
}

// ----------------------------
// 5. RENDERING
// ----------------------------
function renderScoreCardButton(container, matchId) {
  const btnWrapper = document.createElement("div");
  btnWrapper.className = "bottom-bottom";

  const btn = document.createElement("button");
  btn.className = "scorecard-btn";
  btn.textContent = "Scorekaart";

  btn.onclick = async e => {
    e.stopPropagation();
    container.classList.toggle("open");

    if (container.classList.contains("open")) {
      const holesContainer = container.querySelector(".holeskaart");
      holesContainer.innerHTML = "";

      const holes = await apiGet(`/matches/${matchId}/score`);

      holes.forEach(h => {
        const div = document.createElement("div");
        div.classList.add("hole");
        div.textContent = h.hole_number;
        if (h.winner === 1) div.classList.add("speler-1");
        else if (h.winner === 2) div.classList.add("speler-2");
        else if (h.winner === 0) div.classList.add("gelijk");
        holesContainer.appendChild(div);
      });
    }
  };

  btnWrapper.appendChild(btn);
  return btnWrapper;
}

function renderMatchCard(match, holes) {
  const up = calculateUpScore(holes);
  const hole = getCurrentHole(holes, up.end);

  const card = document.createElement("div");
  card.className = "kaart";
  card.style.cursor = "pointer";
  card.onclick = () => window.location.href = `matchscreen.html?matchId=${match.id}`;

  // TOP
  const top = document.createElement("div");
  top.className = "kaart-top";

  const name = document.createElement("h4");
  name.className = "match-name";
  name.textContent = match.match_name;

  const holeDiv = document.createElement("div");
  holeDiv.className = "hole";

  const holeText = document.createElement("p");
  if (hole === 0) holeText.textContent = "Nog niet gestart";
  else if (hole !== "F") holeText.textContent = `Hole ${hole} / 18`;
  else {
    holeText.textContent = "F";
    holeDiv.classList.add("finished");
  }

  holeDiv.appendChild(holeText);
  top.appendChild(name);
  top.appendChild(holeDiv);

  // BOTTOM
  const bottom = document.createElement("div");
  bottom.className = "kaart-bottom";

  const p1 = document.createElement("div");
  p1.className = `naam ${up.p1 && up.p1 !== "A/S" ? "gold" : ""}`;
  p1.innerHTML = `<h4>${match.player1_name}</h4><h4 class="score">${up.p1}</h4>`;

  const vs = document.createElement("h4");
  vs.className = "vs";
  vs.textContent = "vs";

  const p2 = document.createElement("div");
  p2.className = `naam ${up.p2 && up.p2 !== "A/S" ? "gold" : ""}`;
  p2.innerHTML = `<h4>${match.player2_name}</h4><h4 class="score">${up.p2}</h4>`;

  const namesWrapper = document.createElement("div");
  namesWrapper.className = "bottom-top";
  namesWrapper.appendChild(p1);
  namesWrapper.appendChild(vs);
  namesWrapper.appendChild(p2);

  // Scorekaart container
  const scoreContainer = document.createElement("div");
  scoreContainer.className = "kaart-container";

  const holesDiv = document.createElement("div");
  holesDiv.className = "holeskaart";
  scoreContainer.appendChild(holesDiv);

  bottom.appendChild(namesWrapper);
  bottom.appendChild(renderScoreCardButton(scoreContainer, match.id));
  bottom.appendChild(scoreContainer);

  // combine
  card.appendChild(top);
  card.appendChild(bottom);

  return card;
}

// ----------------------------
// 6. DASHBOARD LOGICA
// ----------------------------
async function loadDashboard(force = false) {
  try {
    setLoading(true); // show loader
    const matches = await apiGet("/matches");
    if (!Array.isArray(matches)) return;

    const newState = JSON.stringify(matches);
    if (!force && newState === lastDashboardState) return;
    lastDashboardState = newState;

    matchesBody.innerHTML = "";

    for (let m of matches) {
      const holes = await apiGet(`/matches/${m.id}/score`);
      const card = renderMatchCard(m, holes);
      matchesBody.appendChild(card);
    }
  } catch (err) {
    console.warn("API tijdelijk niet bereikbaar", err);
  } finally {
    setLoading(false); // hide loader
  }
}

// ----------------------------
// 7. EVENTS
// ----------------------------
openModalBtns.forEach(btn => btn.addEventListener("click", () => modals.forEach(m => m.classList.add("open"))));
closeModalBtns.forEach(btn => btn.addEventListener("click", () => modals.forEach(m => m.classList.remove("open"))));
modals.forEach(m => m.addEventListener("click", e => { if (e.target === m) m.classList.remove("open"); }));

addMatchBtn.onclick = async () => {
  const p1 = newPlayer1Input.value.trim();
  const p2 = newPlayer2Input.value.trim();
  const matchName = newMatchNameInput.value.trim();

  if (!p1 || !p2 || !matchName) return alert("Vul alle velden in");

  try {
    setLoading(true);

    const { token } = await apiGet("/api/get-token");
    const player1 = await apiPost("/players", { token, name: p1 });
    const player2 = await apiPost("/players", { token, name: p2 });

    await apiPost("/matches", {
      token,
      player1_id: player1.id,
      player2_id: player2.id,
      match_name: matchName
    });

    modals.forEach(m => m.classList.remove("open"));
    newPlayer1Input.value = "";
    newPlayer2Input.value = "";
    newMatchNameInput.value = "";

    await loadDashboard(true);
  } catch (err) {
    console.error(err);
    alert("Er is iets misgegaan tijdens het toevoegen van de match.");
  } finally {
    setLoading(false);
  }
};

// ----------------------------
// 8. INIT
// ----------------------------
window.addEventListener("DOMContentLoaded", () => {
  loadDashboard(true);
});