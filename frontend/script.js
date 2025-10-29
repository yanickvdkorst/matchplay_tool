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
    

   // Berekening van live UP-score
function calculateUpScore(holes) {
    let score1 = 0;
    let score2 = 0;

    holes.forEach(h => {
        if (h.winner === 1) score1++;
        if (h.winner === 2) score2++;
        // winner === 0 --> gelijkspel, niet tellen
    });

    const diff = score1 - score2;

    if (diff > 0) return { player1Up: `${diff}UP`, player2Up: "" };
    if (diff < 0) return { player1Up: "", player2Up: `${-diff}UP` };
    // bij gelijke stand
    return { player1Up: "A/S", player2Up: "A/S" };
}

   function getCurrentHole(holes) {
    // zoek de laatste hole die een winnaar heeft
    const lastPlayed = [...holes].reverse().find(h => h.winner !== null);
    if (lastPlayed) {
        // als er nog ruimte is voor de volgende hole → toon dat nummer
        return lastPlayed.hole_number === 18 ? "F" : lastPlayed.hole_number;
    } else {
        // nog geen enkele hole gespeeld
        return 0;
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
        const currentHole = getCurrentHole(holes);

        // standaard classes
        let player1Class = "";
        let player2Class = "";
        let score1Class = "";
        let score2Class = "";

       // kleur bepalen
        if (upScore.player1Up && upScore.player1Up !== "A/S") {
            player1Class = "red";
            score1Class = "red";
        } else if (upScore.player2Up && upScore.player2Up !== "A/S") {
            player2Class = "blue";
            score2Class = "blue";
        }

       const row = document.createElement("tr");

        // Voeg eventueel de classes toe zoals rood/blauw voor de score en speler
        row.innerHTML = `
            <td class="${score1Class} score">${upScore.player1Up}</td>
            <td class="${player1Class}">${m.player1_name}</td>
            <td class="currentHole">${currentHole}</td>
            <td class="${player2Class}">${m.player2_name}</td>
            <td class="${score2Class} score">${upScore.player2Up}</td>
        `;

        // Hele rij klikbaar maken
        row.style.cursor = "pointer"; // laat zien dat het klikbaar is
        row.onclick = () => {
            window.location.href = `matchscreen.html?matchId=${m.id}`;
        };

        matchesBody.appendChild(row);
        }
    }

    // Nieuwe match toevoegen
    addMatchBtn.onclick = async () => {
      const p1Name = newPlayer1Input.value.trim();
      const p2Name = newPlayer2Input.value.trim();
      if (!p1Name || !p2Name) return alert("Vul beide spelers in");

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

      // Match aanmaken
      await fetch(`${apiUrl}/matches`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ player1_id: p1.id, player2_id: p2.id }),
      });
    modals.forEach(modal => modal.classList.remove('open'));
      // Velden leegmaken en dashboard refreshen
      newPlayer1Input.value = "";
      newPlayer2Input.value = "";
      loadDashboard();
    };

    loadDashboard();
    setInterval(loadDashboard, 5000); // elke 3 seconden live update