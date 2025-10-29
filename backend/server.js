const express = require("express");
const dotenv = require("dotenv");
const { Pool } = require("pg");
const cors = require("cors");

dotenv.config();
const app = express();
app.use(cors());
app.use(express.json());

const pool = new Pool({
  host: process.env.DB_HOST,
  user: process.env.DB_USER,
  password: process.env.DB_PASSWORD,
  database: process.env.DB_NAME,
  port: process.env.DB_PORT,
});

// ROUTE: nieuwe speler toevoegen
app.post("/players", async (req, res) => {
  const { name } = req.body;
  try {
    const result = await pool.query(
      "INSERT INTO players(name) VALUES($1) RETURNING *",
      [name]
    );
    res.json(result.rows[0]);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Speler toevoegen mislukt" });
  }
});
// ROUTE: match verwijderen
app.delete("/matches/:matchId", async (req, res) => {
  const { matchId } = req.params;

  try {
    // Eerst alle holes van de match verwijderen
    await pool.query("DELETE FROM holes WHERE match_id = $1", [matchId]);

    // Daarna de match zelf verwijderen
    await pool.query("DELETE FROM matches WHERE id = $1", [matchId]);

    res.json({ message: "Match succesvol verwijderd" });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Match verwijderen mislukt" });
  }
});

// ROUTE: nieuwe match starten
app.post("/matches", async (req, res) => {
  const { player1_id, player2_id } = req.body;
  try {
    // Match aanmaken
    const match = await pool.query(
      "INSERT INTO matches(player1_id, player2_id) VALUES($1, $2) RETURNING *",
      [player1_id, player2_id]
    );

    const matchId = match.rows[0].id;

        // 18 holes aanmaken met winner = null (nog niet gespeeld)
        for (let i = 1; i <= 18; i++) {
        await pool.query(
            "INSERT INTO holes(match_id, hole_number, winner) VALUES($1, $2, $3)",
            [matchId, i, null] // <-- hier null ipv 0
        );
}

    res.json({ message: "Match aangemaakt", match_id: matchId });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Match aanmaken mislukt" });
  }
});

// ROUTE: update hole winnaar
app.put("/matches/:matchId/holes/:holeNumber", async (req, res) => {
  const { matchId, holeNumber } = req.params;
  const { winner } = req.body; // 1 = player1, 2 = player2, 0 = gelijk

  try {
    await pool.query(
      "UPDATE holes SET winner=$1 WHERE match_id=$2 AND hole_number=$3",
      [winner, matchId, holeNumber]
    );
    res.json({ message: "Hole score bijgewerkt" });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Hole update mislukt" });
  }
});

// ROUTE: matchscore ophalen
app.get("/matches/:matchId/score", async (req, res) => {
  const { matchId } = req.params;
  try {
    const holes = await pool.query(
      "SELECT hole_number, winner FROM holes WHERE match_id=$1 ORDER BY hole_number",
      [matchId]
    );
    res.json(holes.rows);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Score ophalen mislukt" });
  }
});

// Alle matches ophalen voor dashboard
app.get("/matches", async (req, res) => {
  try {
    const result = await pool.query(`
      SELECT m.id, p1.name AS player1_name, p2.name AS player2_name
      FROM matches m
      JOIN players p1 ON m.player1_id = p1.id
      JOIN players p2 ON m.player2_id = p2.id
      ORDER BY m.id DESC
    `);
    res.json(result.rows);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Matches ophalen mislukt" });
  }
});

const PORT = 5050;
app.listen(PORT, "0.0.0.0", () => {
  console.log(`Server draait op http://localhost:${PORT}`);
});