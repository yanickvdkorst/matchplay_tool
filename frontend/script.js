const apiUrl = window.location.hostname === "127.0.0.1" 
  ? "http://localhost:5050" 
  : "https://matchplay-platform.onrender.com";
  
    const matchesBody = document.getElementById("matchesBody");
    const addMatchBtn = document.getElementById("addMatchBtn");
    const newPlayer1Input = document.getElementById("newPlayer1");
    const newPlayer2Input = document.getElementById("newPlayer2");
    const modals = document.querySelectorAll(".modal");
    const openModalBtns = document.querySelectorAll(".openModal"); // let op hoofdletter
    const closeModalBtn = document.querySelectorAll(".closeModal");

    openModalBtns.forEach(btn => {
    btn.addEventListener("click", () => {
        modals.forEach(modal => modal.classList.add('open'));
    });
    });
    modals.forEach(modal => {
    modal.addEventListener("click", (e) => {
        // check of je klikt op de modal zelf, niet de inhoud
        if (e.target === modal) {
            modal.classList.remove('open');
        }
    });
     closeModalBtn.forEach(btn => {
    btn.addEventListener("click", () => {
        modals.forEach(modal => modal.classList.remove('open'));
    });
    });
});
    

function calculateUpScore(holes) {
    let score1 = 0;
    let score2 = 0;

    holes.forEach(h => {
        if (h.winner === 1) score1++;
        if (h.winner === 2) score2++;
    });

    const playedHoles = holes.filter(h => h.winner !== null).length;
    const remainingHoles = 18 - playedHoles;
    const diff = score1 - score2;

    if (diff > 0) {
        if (diff > remainingHoles) {
            return { player1Up: `${diff}&${remainingHoles}`, player2Up: "", matchOver: true };
        }
        return { player1Up: `${diff}UP`, player2Up: "", matchOver: false };
    }

    if (diff < 0) {
        if (-diff > remainingHoles) {
            return { player1Up: "", player2Up: `${-diff}&${remainingHoles}`, matchOver: true };
        }
        return { player1Up: "", player2Up: `${-diff}UP`, matchOver: false };
    }

    return { player1Up: "A/S", player2Up: "A/S", matchOver: false };
}

// Bepaal welke hole getoond wordt
function getCurrentHole(holes, matchOver = false) {
    if (matchOver) return "F"; // match is beslist

    const lastPlayed = [...holes].reverse().find(h => h.winner !== null);
    if (lastPlayed) {
        return lastPlayed.hole_number === 18 ? "F" : lastPlayed.hole_number;
    } else {
        return 0; // nog geen enkele hole gespeeld
    }
}

async function loadDashboard() {
    const res = await fetch(`${apiUrl}/matches`);
    const matches = await res.json();
    matchesBody.innerHTML = "";

    for (let m of matches) {
        const holesRes = await fetch(`${apiUrl}/matches/${m.id}/score`);
        const holes = await holesRes.json();

        const upScore = calculateUpScore(holes);
        const currentHole = getCurrentHole(holes, upScore.matchOver);

        // kleur en score bepalen
        let player1Class = "";
        let player2Class = "";
        let player1Score = "";
        let player2Score = "";

        if (upScore.player1Up === "A/S" || upScore.player2Up === "A/S") {
            // gelijkspel -> beide spelers A/S
            player1Score = "A/S";
            player2Score = "A/S";
        } else if (upScore.player1Up && upScore.player1Up !== "A/S") {
            player1Class = "gold";
            player1Score = upScore.player1Up;
        } else if (upScore.player2Up && upScore.player2Up !== "A/S") {
            player2Class = "gold";
            player2Score = upScore.player2Up;
        }

        // kaart container
        const card = document.createElement("div");
        card.className = "kaart";
        card.style.cursor = "pointer";
        card.onclick = () => {
            window.location.href = `matchscreen.html?matchId=${m.id}`;
        };

        // kaart-top (matchnaam + hole nummer)
        const kaartTop = document.createElement("div");
        kaartTop.className = "kaart-top";

        // matchnaam div
        const matchNameDiv = document.createElement("h4");
        matchNameDiv.className = "match-name";
        matchNameDiv.textContent = m.match_name; // <--- hier de matchnaam

        // hole div
        const holeDiv = document.createElement("div");
        const holeText = document.createElement('p');
        holeDiv.className = 'hole'
        // console.log(currentHole)
       if (currentHole === 0) {
        holeText.textContent = `Nog niet gestart`;
        } else if (currentHole !== 'F') {
            holeText.textContent = `Hole ${currentHole} / 18`;
        } else {
            holeText.textContent = `${currentHole}`;
            holeDiv.className = 'hole finished'   
        }


        // voeg toe aan kaartTop
        holeDiv.appendChild(holeText);
        kaartTop.appendChild(matchNameDiv);
        kaartTop.appendChild(holeDiv);

        // kaart-bottom
        const kaartBottom = document.createElement("div");
        kaartBottom.className = "kaart-bottom";

        // speler1
        const player1Div = document.createElement("div");
        player1Div.className = `naam ${player1Class}`;

        const player1NameH2 = document.createElement("h4");
        player1NameH2.textContent = m.player1_name;

        const player1ScoreH2 = document.createElement("h4");
        player1ScoreH2.className = "score";
        player1ScoreH2.textContent = player1Score;

        player1Div.appendChild(player1NameH2);
        player1Div.appendChild(player1ScoreH2);

        // vs
        const vsDiv = document.createElement("h4");
        vsDiv.className = "vs";
        vsDiv.textContent = "vs";

        // speler2
        const player2Div = document.createElement("div");
        player2Div.className = `naam ${player2Class}`;

        const player2NameH2 = document.createElement("h4");
        player2NameH2.textContent = m.player2_name;

        const player2ScoreH2 = document.createElement("h4");
        player2ScoreH2.className = "score";
        player2ScoreH2.textContent = player2Score;

        player2Div.appendChild(player2NameH2);
        player2Div.appendChild(player2ScoreH2);

        // alles in kaart-bottom
        kaartBottom.appendChild(player1Div);
        kaartBottom.appendChild(vsDiv);
        kaartBottom.appendChild(player2Div);

        // voeg top en bottom toe aan kaart
        card.appendChild(kaartTop);
        card.appendChild(kaartBottom);

        matchesBody.appendChild(card);
    }
}

addMatchBtn.onclick = async () => {
  const p1Name = newPlayer1Input.value.trim();
  const p2Name = newPlayer2Input.value.trim();
  const matchName = document.getElementById("newName").value.trim(); // <-- hier

  if (!p1Name || !p2Name || !matchName) return alert("Vul beide spelers en de matchnaam in");

  // Spelers aanmaken
  const p1 = await fetch(`${apiUrl}/players`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ name: p1Name }),
  }).then(r => r.json());

  const p2 = await fetch(`${apiUrl}/players`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ name: p2Name }),
  }).then(r => r.json());

  // Match aanmaken met naam
  await fetch(`${apiUrl}/matches`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      player1_id: p1.id,
      player2_id: p2.id,
      match_name: matchName
    }),
  });

  modals.forEach(modal => modal.classList.remove('open'));
  newPlayer1Input.value = "";
  newPlayer2Input.value = "";
  document.getElementById("newName").value = "";
  loadDashboard();
};

    loadDashboard();
    // setInterval(loadDashboard, 5000); // elke 3 seconden live update