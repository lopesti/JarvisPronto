const express = require('express');
const router = express.Router();
const { query } = require('../models/database');
const logger = require('../utils/logger');

// Listar todos os usuários
router.get('/', async (req, res) => {
    try {
        const result = await query('SELECT id, name, email, role, created_at FROM users ORDER BY id');
        res.json(result.rows);
    } catch (error) {
        logger.error('Erro ao listar usuários:', error.message);
        res.status(500).json({ error: 'Erro ao listar usuários' });
    }
});

// Buscar usuário por ID
router.get('/:id', async (req, res) => {
    try {
        const { id } = req.params;
        const result = await query('SELECT id, name, email, role, created_at FROM users WHERE id = ', [id]);
        if (result.rows.length === 0) {
            return res.status(404).json({ error: 'Usuário não encontrado' });
        }
        res.json(result.rows[0]);
    } catch (error) {
        logger.error('Erro ao buscar usuário:', error.message);
        res.status(500).json({ error: 'Erro ao buscar usuário' });
    }
});

module.exports = router;
