const apiUrl = "http://localhost:5050";
    const matchIdDisplay = document.getElementById("matchIdDisplay");
    const player1El = document.getElementById("player1Name");
    const player2El = document.getElementById("player2Name");

    const urlParams = new URLSearchParams(window.location.search);
    const matchId = urlParams.get("matchId");
    matchIdDisplay.textContent = matchId;

    // globale variabelen
    let player1Name = "";
    let player2Name = "";
    let holesData = [];
    let selectedHoleNumber = 1;

    // fetch match info
    fetch(`${apiUrl}/matches?id=${matchId}`)
      .then(res => res.json())
      .then(data => {
          const match = data.find(m => m.id == matchId);
          if (match) {
            player1El.textContent = match.player1_name;
            player2El.textContent = match.player2_name;
            player1Name = match.player1_name;
            player2Name = match.player2_name;
                // buttons updaten met echte namen
            player1Btn.firstChild.textContent = player1Name;
            player2Btn.firstChild.textContent = player2Name;
            loadHoles();
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

    // vul dropdown
    for (let i = 1; i <= 18; i++) {
      const option = document.createElement("option");
      option.value = i;
      option.textContent = `Hole ${i}`;
      holeDropdown.appendChild(option);
    }

    holeDropdown.addEventListener("change", () => {
      selectedHoleNumber = parseInt(holeDropdown.value);
      displayCurrentWinner();
    });

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
        setTimeout(loadHoles, 200); // 200ms, kan je aanpassen
        }

 function handleHoleClick(winner) {
    // reset buttons
    [player1Btn, player2Btn, drawBtn].forEach(btn => btn.classList.remove("currentWinner"));

    // voeg class direct toe
    if (winner === 1) player1Btn.classList.add("currentWinner");
    if (winner === 2) player2Btn.classList.add("currentWinner");
    if (winner === 0) drawBtn.classList.add("currentWinner");

    // update score-divs direct
    const player1ScoreEl = player1Btn.querySelector(".currentScore");
    const player2ScoreEl = player2Btn.querySelector(".currentScore");
    let score1 = 0, score2 = 0;
    holesData.forEach(h => {
        if (h.winner === 1) score1++;
        if (h.winner === 2) score2++;
    });
    if (winner === 1) score1++;
    if (winner === 2) score2++;
    const diff = score1 - score2;
    if (diff > 0) {
        player1ScoreEl.textContent = diff + "UP";
        player2ScoreEl.textContent = "";
        player1ScoreEl.classList.add('show')
        player2ScoreEl.classList.remove('show')
    } else if (diff < 0) {
        player1ScoreEl.textContent = "";
        player1ScoreEl.classList.remove('show')
        player2ScoreEl.classList.add('show')
        player2ScoreEl.textContent = -diff + "UP";
    } else {
        player1ScoreEl.textContent = "A/S";
        player2ScoreEl.textContent = "A/S";
        player1ScoreEl.classList.add('show')
        player2ScoreEl.classList.add('show')
    }

    // kleine delay voor backend update
    setTimeout(async () => {
    // update lokale data zodat het direct klopt
    const holeIndex = holesData.findIndex(h => h.hole_number === selectedHoleNumber);
    if (holeIndex !== -1) holesData[holeIndex].winner = winner;

    // update backend
    await updateHole(selectedHoleNumber, winner);

    // ververs pas later vanuit backend om kleine latency te maskeren
    setTimeout(loadHoles, 300);

    // bepaal volgende hole lokaal
    const nextHole = holesData.find(h => h.winner === null);
    if (nextHole) {
        selectedHoleNumber = nextHole.hole_number;
        holeDropdown.value = selectedHoleNumber;
    }
    displayCurrentWinner();
}, 400);
}