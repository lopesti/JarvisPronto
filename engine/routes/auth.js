const express = require('express');
const router = express.Router();
const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');
const { query } = require('../models/database');
const logger = require('../utils/logger');

const JWT_SECRET = process.env.JWT_SECRET;

router.post('/register', async (req, res) => {
    try {
        const { name, email, password } = req.body;

        if (!name || !email || !password) {
            return res.status(400).json({ error: 'Nome, email e senha s?o obrigat?rios' });
        }

        const existing = await query('SELECT * FROM users WHERE email = ', [email]);
        if (existing.rows.length > 0) {
            return res.status(400).json({ error: 'Email j? cadastrado' });
        }

        const hashedPassword = await bcrypt.hash(password, 10);
        const result = await query(
            'INSERT INTO users (name, email, password, created_at) VALUES (, , , NOW()) RETURNING id, name, email, created_at',
            [name, email, hashedPassword]
        );

        const user = result.rows[0];
        const token = jwt.sign({ id: user.id, email: user.email }, JWT_SECRET, { expiresIn: '7d' });

        res.status(201).json({
            message: 'Usu?rio criado com sucesso',
            token,
            user: {
                id: user.id,
                name: user.name,
                email: user.email,
                created_at: user.created_at
            }
        });
    } catch (error) {
        logger.error('Erro no registro:', error.message);
        res.status(500).json({ error: 'Erro ao criar usu?rio' });
    }
});

router.post('/login', async (req, res) => {
    try {
        const { email, password } = req.body;

        if (!email || !password) {
            return res.status(400).json({ error: 'Email e senha s?o obrigat?rios' });
        }

        const result = await query('SELECT * FROM users WHERE email = ', [email]);
        if (result.rows.length === 0) {
            return res.status(401).json({ error: 'Credenciais inv?lidas' });
        }

        const user = result.rows[0];
        const isValid = await bcrypt.compare(password, user.password);
        if (!isValid) {
            return res.status(401).json({ error: 'Credenciais inv?lidas' });
        }

        const token = jwt.sign({ id: user.id, email: user.email }, JWT_SECRET, { expiresIn: '7d' });

        res.json({
            token,
            user: {
                id: user.id,
                name: user.name,
                email: user.email,
                created_at: user.created_at
            }
        });
    } catch (error) {
        logger.error('Erro no login:', error.message);
        res.status(500).json({ error: 'Erro ao fazer login' });
    }
});

module.exports = router;
