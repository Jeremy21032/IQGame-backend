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

module.exports = router;
