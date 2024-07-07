const express = require('express');
const router = express.Router();
const pool = require('../db');

router.get('/get-games', async (req, res) => {
    try {
        console.log("Entrando a get games")
        const [games] = await pool.execute(
            `SELECT * FROM games_details`
        );

        if (games.length === 0) {
            return res.status(401).json({ message: 'No se han configurado aun juegos' });
        }

       

        res.json( games);
    } catch (error) {
        console.error('Error obteniendo los juegos', error);
        res.status(500).json({ message: 'Error obteniendo los juegos' });
    }
})

router.post('/score', async (req, res) => {
    const { user_id, points } = req.body;
  
    if (!user_id || !points) {
      return res.status(400).json({ error: 'user_id and points are required' });
    }
  
    try {
      const [result] = await pool.query(
        'INSERT INTO scores (user_id, points, score_date) VALUES (?, ?, ?)',
        [user_id, points, new Date()]
      );
  
      const newScore = {
        score_id: result.insertId,
        user_id,
        points,
        score_date: new Date()
      };
  
      res.status(201).json(newScore);
    } catch (error) {
      console.error('Error saving score:', error);
      res.status(500).json({ error: 'An error occurred while saving the score' });
    }
  });

module.exports = router;
