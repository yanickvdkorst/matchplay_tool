const apiUrl = window.location.hostname === "127.0.0.1" 
  ? "http://localhost:5050" 
  : "https://matchplay-platform.onrender.com";
  
    const matchIdDisplay = document.getElementById("matchIdDisplay");
    const player1El = document.getElementById("player1Name");
    const player1ElIndex = document.getElementById("player1NameIndex");
    const player2ElIndex = document.getElementById("player2NameIndex");
    const player2El = document.getElementById("player2Name");
    const matchNameEl = document.getElementById("matchName");
    let matchOver = false;

    const urlParams = new URLSearchParams(window.location.search);
    const matchId = urlParams.get("matchId");

    // globale variabelen
    let player1Name = "";
    let player2Name = "";
    let matchName = "";
    let holesData = [];
    let selectedHoleNumber = 1;

   fetch(`${apiUrl}/matches?id=${matchId}`)
  .then(res => res.json())
  .then(data => {
      const match = data.find(m => m.id == matchId);
      // console.log(match);
      if (match) {
          player1El.textContent = match.player1_name;
          player2El.textContent = match.player2_name;
          player1ElIndex.textContent = match.player1_name;
          player2ElIndex.textContent = match.player2_name;
          matchNameEl.textContent = match.match_name;
          player1Name = match.player1_name;
          player2Name = match.player2_name;
          player1Btn.firstChild.textContent = player1Name;
          player2Btn.firstChild.textContent = player2Name;
          loadHoles();
      } else {
          alert("Verkeerd wedstrijd ID!");
          window.location.href = "./index.html"; // terug naar overzicht
      }
  });

    // Delete match
    const deleteMatchBtn = document.getElementById("deleteMatchBtn");
    deleteMatchBtn.addEventListener("click", async () => {
        const confirmDelete = confirm("Weet je zeker dat je deze match wilt verwijderen?");
        if (!confirmDelete) return;

        try {
            const res = await fetch(`${apiUrl}/matches/${matchId}`, { method: "DELETE" });
            if (res.ok) {
                alert("Match verwijderd!");
                window.location.href = "./index.html";
            } else {
                alert("Fout bij verwijderen!");
            }
        } catch (error) {
            console.error(error);
            alert("Er is iets misgegaan.");
        }
    });


    // dropdown en buttons
    const holeDropdown = document.getElementById("holeDropdown");
    const player1Btn = document.getElementById("player1Btn");
    const player2Btn = document.getElementById("player2Btn");
    const drawBtn = document.getElementById("drawBtn");
   

function displayCurrentWinner() {
    if (!holesData.length) return;

    const player1ScoreEl = document.getElementById("scoreP1");
    const player2ScoreEl = document.getElementById("scoreP2");

    const hole = holesData.find(h => h.hole_number === selectedHoleNumber);

    // reset winner classes
    [player1Btn, player2Btn, drawBtn].forEach(btn => btn.classList.remove("currentWinner"));

    // score berekenen
    let score1 = 0, score2 = 0;
    holesData.forEach(h => {
        if (h.winner === 1) score1++;
        if (h.winner === 2) score2++;
    });

    const diff = score1 - score2;
    const holesPlayed = holesData.filter(h => h.winner !== null).length;
    const totalHoles = 18; // pas aan als het anders is
    const remainingHoles = totalHoles - holesPlayed;

    // --- MATCH STATUS LOGICA ---
    let p1Text = "";
    let p2Text = "";

    if (diff > 0) {
        // speler 1 voor
        if (diff > remainingHoles) {
            p1Text = `${diff}&${remainingHoles}`;
            p2Text = "";
        } else {
            p1Text = `${diff}UP`;
            p2Text = "";
        }
    } 
    else if (diff < 0) {
        // speler 2 voor
        if (-diff > remainingHoles) {
            p1Text = "";
            p2Text = `${-diff}&${remainingHoles}`;
        } else {
            p1Text = "";
            p2Text = `${-diff}UP`;
        }
    } 
    else {
        // all square
        p1Text = "A/S";
        p2Text = "A/S";
    }

    // update UI
    player1ScoreEl.textContent = p1Text;
    player2ScoreEl.textContent = p2Text;

    // reset eerst eventueel de class
    player1ScoreEl.classList.remove("as");
    player2ScoreEl.classList.remove("as");

    // voeg class toe als het A/S is
    if (p1Text === "A/S") player1ScoreEl.classList.add("as");
    if (p2Text === "A/S") player2ScoreEl.classList.add("as");

    // hole highlight
    if (hole.winner === 1) player1Btn.classList.add("currentWinner");
    if (hole.winner === 2) player2Btn.classList.add("currentWinner");
    if (hole.winner === 0) drawBtn.classList.add("currentWinner");
}

player1Btn.addEventListener("click", () => handleHoleClick(1));
player2Btn.addEventListener("click", () => handleHoleClick(2));
drawBtn.addEventListener("click", () => handleHoleClick(0));

async function loadHoles(force = false) {
    const res = await fetch(`${apiUrl}/matches/${matchId}/score`);
    const newData = await res.json();

    // vergelijk data
    if (!force && JSON.stringify(newData) === JSON.stringify(holesData)) {
        return; // niks veranderd → niet rerenderen
    }

    holesData = newData;

    renderHoles();
    displayCurrentWinner();
}

  async function updateHole(holeNumber, winner) {
    await fetch(`${apiUrl}/matches/${matchId}/holes/${holeNumber}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ winner }),
    });
}

// voeg deze functie toe ergens bovenin je file, buiten handleHoleClick
function showToast(message, duration = 2000) {
    let toastEl = document.querySelector(".toast");
    let toastElp = document.querySelector(".toast p");
    // console.log(toastElp);

    toastElp.textContent = message;
    toastEl.classList.add("show");

    // verwijder na duration
    setTimeout(() => {
        toastEl.classList.remove("show");
    }, duration);
}



async function handleHoleClick(winner) {
  // immediate UI toggle for clicked buttons
  [player1Btn, player2Btn, drawBtn].forEach(btn => btn.classList.remove("currentWinner"));
  if (winner === 1) player1Btn.classList.add("currentWinner");
  if (winner === 2) player2Btn.classList.add("currentWinner");
  if (winner === 0) drawBtn.classList.add("currentWinner");
const player1ScoreEl = document.getElementById("scoreP1");
const player2ScoreEl = document.getElementById("scoreP2");

  // calculate current aggregate scores (based on holesData)
  let score1 = 0, score2 = 0;
  holesData.forEach(h => {
    if (h.winner === 1) score1++;
    if (h.winner === 2) score2++;
  });

  // optimistic local update for the UI (show what it will be)
  if (winner === 1) score1++;
  if (winner === 2) score2++;

  const diff = score1 - score2;

  // update score visuals immediately
  if (Math.abs(diff) > 0) {
    if (diff > 0) {
      player1ScoreEl.textContent = diff + "UP";
      player2ScoreEl.textContent = "";
    } else {
      player1ScoreEl.textContent = (-diff) + "UP";
      player2ScoreEl.textContent = "";
    }
    player1ScoreEl.classList.add('show');
    player2ScoreEl.classList.add('show');
  } else {
    player1ScoreEl.textContent = "A/S";
    player2ScoreEl.textContent = "A/S";
    player1ScoreEl.classList.add('show');
    player2ScoreEl.classList.add('show');
  }

  // update model locally
  const holeIndex = holesData.findIndex(h => h.hole_number === selectedHoleNumber);
  if (holeIndex !== -1) holesData[holeIndex].winner = winner;

  // send to backend and wait
  try {
    await updateHole(selectedHoleNumber, winner);
  } catch (err) {
    console.error("Failed to update hole:", err);
    showToast("Opslaan mislukt");
    return;
  }

  // re-render everything reliably
  if (typeof renderHoles === "function") renderHoles();
  displayCurrentWinner();

  // show success toast
  showToast(`Hole ${selectedHoleNumber} opgeslagen!`);

  // ---- recompute whether match is over (based on updated holesData) ----
  let s1 = 0, s2 = 0;
  holesData.forEach(h => {
    if (h.winner === 1) s1++;
    if (h.winner === 2) s2++;
  });
  const newDiff = s1 - s2;
  const playedNow = holesData.filter(h => h.winner !== null).length;
  const remainingNow = 18 - playedNow;
  const recomputedMatchOver = Math.abs(newDiff) > remainingNow;

  // console.log("auto-next check:", {
  //   selectedHoleNumber,
  //   playedNow,
  //   remainingNow,
  //   newDiff,
  //   recomputedMatchOver
  // });

  // only auto-advance if not match over and not last hole
  if (!recomputedMatchOver && selectedHoleNumber < 18) {
    setTimeout(() => {
      selectedHoleNumber++;
      // safe update display: check elements exist
      if (currentHoleEl) currentHoleEl.textContent = selectedHoleNumber;
      const dropdown = document.getElementById("holeDropdown");
      if (dropdown) dropdown.value = selectedHoleNumber;
      if (typeof updateHoleDisplay === "function") updateHoleDisplay();
      if (kaartContainer) renderHoles();
    }, 800); // small delay so user sees toast
  } else {
    // if match over or last hole, log for debugging
    // console.log("Not auto-advancing (match over or last hole).");
  }
}


const prevHoleBtn = document.querySelector(".currentHole-container .left");
const nextHoleBtn = document.querySelector(".currentHole-container .right");
const currentHoleEl = document.querySelector(".currentHole");

prevHoleBtn.addEventListener("click", () => {
  if (selectedHoleNumber > 1) {
    selectedHoleNumber--;
    updateHoleDisplay();
  }
});

nextHoleBtn.addEventListener("click", () => {
  if (selectedHoleNumber < 18) {
    selectedHoleNumber++;
    updateHoleDisplay();
  }
});

function updateHoleDisplay() {
  // update visuele hole tekst
  currentHoleEl.textContent = selectedHoleNumber;
  // update dropdown (zodat alles in sync blijft)
  holeDropdown.value = selectedHoleNumber;
  // herbereken huidige score etc.
  displayCurrentWinner();
}

const kaartContainer = document.querySelector(".holeskaart");

function renderHoles() {
  if (!holesData.length) return;

  kaartContainer.innerHTML = ""; // reset even

  holesData.forEach((h) => {
    const holeDiv = document.createElement("div");
    holeDiv.classList.add("hole");
    holeDiv.textContent = h.hole_number;

    // voeg een class toe afhankelijk van winnaar
    if (h.winner === 1) holeDiv.classList.add("speler-1");
    else if (h.winner === 2) holeDiv.classList.add("speler-2");
    else if (h.winner === 0) holeDiv.classList.add("gelijk");

    // check of dit de geselecteerde hole is
    if (h.hole_number === selectedHoleNumber) {
      holeDiv.classList.add("selected-hole");
    }

    // klik-event om naar die hole te gaan
    holeDiv.addEventListener("click", () => {
      selectedHoleNumber = h.hole_number;
      updateHoleDisplay();
      renderHoles(); // hertekenen zodat highlight meeverandert
    });

    kaartContainer.appendChild(holeDiv);
  });
}

const scorecardEl = document.querySelector(".scorecard");

if (scorecardEl) {
  scorecardEl.addEventListener("click", () => {
    openScorecard();
    scorecardEl.classList.toggle("open");
  });
}

function openScorecard() {
  const kaart = document.querySelector(".kaart-container");
  kaart.classList.toggle("open");
}

setInterval(() => {
    loadHoles();
}, 1500); // elke 1.5 sec