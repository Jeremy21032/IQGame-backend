const express = require("express");
const router = express.Router();
const pool = require("../db");

router.get("/get-games", async (req, res) => {
  try {
    console.log("Entrando a get games");
    const [games] = await pool.execute(`SELECT * FROM games_details`);

    if (games.length === 0) {
      return res
        .status(401)
        .json({ message: "No se han configurado aun juegos" });
    }

    res.json(games);
  } catch (error) {
    console.error("Error obteniendo los juegos", error);
    res.status(500).json({ message: "Error obteniendo los juegos" });
  }
});

router.post("/score", async (req, res) => {
  const { user_id, points } = req.body;

  if (!user_id || !points) {
    return res.status(400).json({ error: "user_id and points are required" });
  }

  try {
    const [result] = await pool.query(
      "INSERT INTO scores (user_id, points, score_date) VALUES (?, ?, ?)",
      [user_id, points, new Date()]
    );

    const newScore = {
      score_id: result.insertId,
      user_id,
      points,
      score_date: new Date(),
    };

    res.status(201).json(newScore);
  } catch (error) {
    console.error("Error saving score:", error);
    res.status(500).json({ error: "An error occurred while saving the score" });
  }
});
// Ruta para obtener los puntajes de un usuario específico
router.get("/get-scores/:user_id", async (req, res) => {
  const { user_id } = req.params;

  try {
    const [rows] = await pool.query("SELECT max(s.points) as maxPoints, s.* FROM scores s where s.user_id = ?", [
      user_id,
    ]);

    if (rows.length === 0) {
      return res
        .status(404)
        .json({ error: "No scores found for the specified user" });
    }

    res.status(200).json(rows);
  } catch (error) {
    console.error("Error retrieving scores:", error);
    res
      .status(500)
      .json({ error: "An error occurred while retrieving the scores" });
  }
});

// Ruta para obtener los puntajes de todos los usuarios
router.get("/get-all-scores", async (req, res) => {
  try {
    const [rows] = await pool.query(`SELECT 
    CONCAT(u.user_firstName, " ", u.user_lastName) AS fullName, 
    u.username ,
    MAX(s.points) AS maxPoints, 
    s.score_date
    FROM scores s 
    INNER JOIN users u ON s.user_id = u.user_id 
    GROUP BY u.user_id, fullName
    ORDER BY maxPoints DESC`);

    if (rows.length === 0) {
      return res.status(404).json({ error: "No scores found" });
    }

    res.status(200).json(rows);
  } catch (error) {
    console.error("Error retrieving scores:", error);
    res
      .status(500)
      .json({ error: "An error occurred while retrieving the scores" });
  }
});

module.exports = router;
