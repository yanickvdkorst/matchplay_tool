const apiUrl = "http://localhost:5050";

const player1Input = document.getElementById("player1");
const player2Input = document.getElementById("player2");
const startMatchBtn = document.getElementById("startMatch");

const matchSelect = document.getElementById("matchSelect");
const matchSection = document.getElementById("matchSection");
const matchIdDisplay = document.getElementById("matchIdDisplay");
const holesTableBody = document.querySelector("#holesTable tbody");

let currentMatchId = null;

// Player aanmaken
async function createPlayer(name) {
  const res = await fetch(`${apiUrl}/players`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ name }),
  });
  return res.json();
}

// Nieuwe match starten
async function startMatch(player1Name, player2Name) {
  const p1 = await createPlayer(player1Name);
  const p2 = await createPlayer(player2Name);

  const res = await fetch(`${apiUrl}/matches`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ player1_id: p1.id, player2_id: p2.id }),
  });
  const match = await res.json();
  return match.match_id;
}

// Holes laden
async function loadHoles(matchId) {
  const res = await fetch(`${apiUrl}/matches/${matchId}/score`);
  const holes = await res.json();
  holesTableBody.innerHTML = "";
  holes.forEach(h => {
    const row = document.createElement("tr");
    const holeCell = document.createElement("td");
    holeCell.textContent = h.hole_number;

    const winnerCell = document.createElement("td");
    const btn1 = document.createElement("button");
    btn1.textContent = "Speler 1";
    btn1.onclick = () => updateHole(matchId, h.hole_number, 1);

    const btn2 = document.createElement("button");
    btn2.textContent = "Speler 2";
    btn2.onclick = () => updateHole(matchId, h.hole_number, 2);

    const btn0 = document.createElement("button");
    btn0.textContent = "Gelijk";
    btn0.onclick = () => updateHole(matchId, h.hole_number, 0);

    winnerCell.appendChild(btn1);
    winnerCell.appendChild(btn2);
    winnerCell.appendChild(btn0);

    row.appendChild(holeCell);
    row.appendChild(winnerCell);
    holesTableBody.appendChild(row);
  });
}

// Hole bijwerken
async function updateHole(matchId, holeNumber, winner) {
  await fetch(`${apiUrl}/matches/${matchId}/holes/${holeNumber}`, {
    method: "PUT",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ winner }),
  });
  loadHoles(matchId);
}

// Alle matches ophalen
async function loadMatches() {
  const res = await fetch(`${apiUrl}/matches`);
  const matches = await res.json();
  matchSelect.innerHTML = '<option value="">Selecteer een match</option>';
  matches.forEach(m => {
    const option = document.createElement("option");
    option.value = m.id;
    option.textContent = `Match ${m.id}: ${m.player1_name} vs ${m.player2_name}`;
    matchSelect.appendChild(option);
  });
}

// Nieuwe match starten en lijst updaten
startMatchBtn.onclick = async () => {
  const p1 = player1Input.value.trim();
  const p2 = player2Input.value.trim();
  if (!p1 || !p2) return alert("Vul beide spelers in");

  const matchId = await startMatch(p1, p2);
  await loadMatches(); // update dropdown
  matchSelect.value = matchId;
  currentMatchId = matchId;
  matchIdDisplay.textContent = currentMatchId;
  matchSection.style.display = "block";
  loadHoles(currentMatchId);
};

// Event listener match selectie
matchSelect.addEventListener("change", () => {
  const matchId = matchSelect.value;
  if (matchId) {
    currentMatchId = matchId;
    matchIdDisplay.textContent = matchId;
    matchSection.style.display = "block";
    loadHoles(matchId);
  } else {
    matchSection.style.display = "none";
  }
});

// Initial load
loadMatches();