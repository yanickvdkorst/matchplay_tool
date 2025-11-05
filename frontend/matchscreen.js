const apiUrl = window.location.hostname === "127.0.0.1" 
  ? "http://localhost:5050" 
  : "https://matchplay-platform.onrender.com";
  
    const matchIdDisplay = document.getElementById("matchIdDisplay");
    const player1El = document.getElementById("player1Name");
    const player2El = document.getElementById("player2Name");
    const matchNameEl = document.getElementById("matchName");
    let matchOver = false;

    const urlParams = new URLSearchParams(window.location.search);
    const matchId = urlParams.get("matchId");
    matchIdDisplay.textContent = matchId;

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
      console.log(match);
      if (match) {
          player1El.textContent = match.player1_name;
          player2El.textContent = match.player2_name;
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
    const player1ScoreEl = player1Btn.querySelector(".currentScore");
    const player2ScoreEl = player2Btn.querySelector(".currentScore");


    const hole = holesData.find(h => h.hole_number === selectedHoleNumber);

    // reset alle buttons
    [player1Btn, player2Btn, drawBtn].forEach(btn => btn.classList.remove("currentWinner"));

    // bereken score tot nu
    let score1 = 0, score2 = 0;
    holesData.forEach(h => {
        if (h.winner === 1) score1++;
        if (h.winner === 2) score2++;
    });
    const diff = score1 - score2;

    // update score-divs
    // update score-divs
    if (diff > 0) {
        player1ScoreEl.textContent = diff + "UP";
        player2ScoreEl.textContent = "";
    } else if (diff < 0) {
        player1ScoreEl.textContent = "";
        player2ScoreEl.textContent = -diff + "UP";
    } else {
        // gelijkspel
        player1ScoreEl.textContent = "A/S";
        player2ScoreEl.textContent = "A/S";
    }

    // voeg class toe aan de huidige winner van de hole
    if (hole.winner === 1) player1Btn.classList.add("currentWinner");
    if (hole.winner === 2) player2Btn.classList.add("currentWinner");
    if (hole.winner === 0) drawBtn.classList.add("currentWinner");
}

player1Btn.addEventListener("click", () => handleHoleClick(1));
player2Btn.addEventListener("click", () => handleHoleClick(2));
drawBtn.addEventListener("click", () => handleHoleClick(0));

    async function loadHoles() {
        const res = await fetch(`${apiUrl}/matches/${matchId}/score`);
        holesData = await res.json();

        // bepaal eerste hole die nog geen winner heeft
       // laat de huidige geselecteerde hole staan
    holeDropdown.value = selectedHoleNumber;

        displayCurrentWinner();
          renderHoles(); // voeg deze regel toe
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

    // maak toast element aan als die nog niet bestaat
    if (!toastEl) {
        toastEl = document.createElement("div");
        toastEl.classList.add("toast");
        document.body.appendChild(toastEl);
    }

    toastEl.textContent = message;
    toastEl.classList.add("show");

    // verwijder na duration
    setTimeout(() => {
        toastEl.classList.remove("show");
    }, duration);
}



function handleHoleClick(winner) {
    // reset buttons
    [player1Btn, player2Btn, drawBtn].forEach(btn => btn.classList.remove("currentWinner"));

    // voeg class direct toe
    if (winner === 1) player1Btn.classList.add("currentWinner");
    if (winner === 2) player2Btn.classList.add("currentWinner");
    if (winner === 0) drawBtn.classList.add("currentWinner");

    const player1ScoreEl = player1Btn.querySelector(".currentScore");
    const player2ScoreEl = player2Btn.querySelector(".currentScore");

    // bereken huidige score
    let score1 = 0, score2 = 0;
    holesData.forEach(h => {
        if (h.winner === 1) score1++;
        if (h.winner === 2) score2++;
    });

    if (winner === 1) score1++;
    if (winner === 2) score2++;

    const diff = score1 - score2;
    const playedHoles = holesData.filter(h => h.winner !== null).length + 1;
    const remainingHoles = 18 - playedHoles;
    const matchOver = Math.abs(diff) > remainingHoles;

    // hier direct finale score zetten (optie 1)
    if (matchOver) {
        const lead = Math.abs(diff);
        const holesLeft = remainingHoles;
        const finalScore = `${lead}&${holesLeft}`;

        if (diff > 0) {
            player1ScoreEl.textContent = finalScore;
            player2ScoreEl.textContent = "";
        } else {
            player1ScoreEl.textContent = "";
            player2ScoreEl.textContent = finalScore;
        }

        player1ScoreEl.classList.add('show');
        player2ScoreEl.classList.add('show');

        // markeer dat de match over is zodat displayCurrentWinner niet refresh
        holesData.forEach(h => h.matchOver = true);

    } else {
        // gewone update zolang match niet klaar is
        if (diff > 0) {
            player1ScoreEl.textContent = diff + "UP";
            player2ScoreEl.textContent = "";
            player1ScoreEl.classList.add('show');
            player2ScoreEl.classList.remove('show');
        } else if (diff < 0) {
            player1ScoreEl.textContent = "";
            player2ScoreEl.textContent = (-diff) + "UP";
            player2ScoreEl.classList.add('show');
            player1ScoreEl.classList.remove('show');
        } else {
            player1ScoreEl.textContent = "A/S";
            player2ScoreEl.textContent = "A/S";
            player1ScoreEl.classList.add('show');
            player2ScoreEl.classList.add('show');
        }
    }

    // kleine delay voor backend update
    // kleine delay voor backend update
    setTimeout(async () => {
    const holeIndex = holesData.findIndex(h => h.hole_number === selectedHoleNumber);
    if (holeIndex !== -1) holesData[holeIndex].winner = winner;

    await updateHole(selectedHoleNumber, winner);
    renderHoles();

    // alleen refreshen als match niet klaar is
    if (!holesData.some(h => h.matchOver)) {
        displayCurrentWinner();
    }

    // toast laten zien
    showToast("Score opgeslagen!");
}, 100);
    
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
  const kaart = document.querySelector(".holeskaart");
  kaart.classList.toggle("open");
}