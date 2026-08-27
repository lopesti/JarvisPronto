const express = require('express');
const router = express.Router();
const { query } = require('../models/database');
const logger = require('../utils/logger');

router.get('/', async (req, res) => {
    try {
        const result = await query('SELECT * FROM conversations ORDER BY created_at DESC LIMIT 100');
        res.json(result.rows);
    } catch (error) {
        logger.error('Erro ao listar conversas:', error.message);
        res.status(500).json({ error: 'Erro ao listar conversas' });
    }
});

module.exports = router;
