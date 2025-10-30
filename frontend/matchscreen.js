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
        const nextHole = holesData.find(h => h.winner === null);
        if (nextHole) {
            selectedHoleNumber = nextHole.hole_number;
            holeDropdown.value = selectedHoleNumber;
        } else {
            // als alles ingevuld is, pak de laatste hole
            selectedHoleNumber = 18;
            holeDropdown.value = selectedHoleNumber;
        }

        displayCurrentWinner();
        }

  async function updateHole(holeNumber, winner) {
    await fetch(`${apiUrl}/matches/${matchId}/holes/${holeNumber}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ winner }),
    });

    // kleine delay zodat je de klik visueel ziet
    // ⚠️ alleen loadHoles als match niet over is
    if (!holesData.some(h => h.matchOver)) {
        setTimeout(loadHoles, 100);
    }
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

        // alleen refreshen als match niet klaar is
        if (!holesData.some(h => h.matchOver)) {
            const nextHole = holesData.find(h => h.winner === null);
            if (nextHole) {
                selectedHoleNumber = nextHole.hole_number;
                holeDropdown.value = selectedHoleNumber;
            }
            displayCurrentWinner();
        }
    }, 100);
}
// Scorekaart functionaliteit
const scoreCardButtons = document.querySelectorAll("#scoreCard"); // gebruik class ipv id
const scoreCardModal = document.getElementById("scoreCardModal");
const closeScoreCardBtn = document.getElementById("closeScoreCard");
const scoreCardBody = document.querySelector("#scoreCardTable tbody");

// herhaal voor elke button
scoreCardButtons.forEach(btn => {
    btn.addEventListener("click", () => {
        updateScoreCard();
        scoreCardModal.classList.add("open");
    });
});

closeScoreCardBtn.addEventListener("click", () => {
    scoreCardModal.classList.remove("open");
});

// vul de scorekaart
function updateScoreCard() {
    if (!holesData.length) return;
    scoreCardBody.innerHTML = "";

    holesData.forEach(h => {
        const tr = document.createElement("tr");
        let winnerText = "";
        let colorClass = "";

        if (h.winner === 1) {
            winnerText = player1Name;
            colorClass = "red";
        } else if (h.winner === 2) {
            winnerText = player2Name;
            colorClass = "blue";
        } else if (h.winner === 0) {
            winnerText = "Gelijk";
            colorClass = "gray";
        } else {
            winnerText = "-";
            colorClass = "";
        }

        tr.innerHTML = `
            <td class="hole">${h.hole_number}</td>
            <td class="${colorClass}">${winnerText}</td>
        `;
        scoreCardBody.appendChild(tr);
    });
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