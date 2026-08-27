const express = require('express');
const Joi = require('joi');
const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');
const { query } = require('../models/database');
const logger = require('../utils/logger');

const router = express.Router();
const JWT_SECRET = process.env.JWT_SECRET;

// Schema de validação
const registerSchema = Joi.object({
    name: Joi.string().min(3).max(100).required(),
    email: Joi.string().email().required(),
    password: Joi.string().min(8)
        .pattern(/^(?=.*[A-Z])(?=.*\d)/)
        .required()
        .messages({
            'string.pattern.base': 'Senha deve ter pelo menos 8 caracteres, 1 maiúscula e 1 número',
            'string.min': 'Senha deve ter pelo menos 8 caracteres'
        })
});

const loginSchema = Joi.object({
    email: Joi.string().email().required(),
    password: Joi.string().required()
});

// Registrar usuário
router.post('/register', async (req, res) => {
    try {
        // Validar entrada
        const { error } = registerSchema.validate(req.body);
        if (error) {
            return res.status(400).json({ error: error.details[0].message });
        }

        const { name, email, password } = req.body;

        // Verificar se usuário já existe
        const existing = await query('SELECT * FROM users WHERE email = ', [email]);
        if (existing.rows.length > 0) {
            return res.status(400).json({ error: 'Email já cadastrado' });
        }

        // Hash da senha
        const hashedPassword = await bcrypt.hash(password, 10);

        // Salvar usuário
        const result = await query(
            'INSERT INTO users (name, email, password) VALUES (, , ) RETURNING id, name, email, created_at',
            [name, email, hashedPassword]
        );

        const user = result.rows[0];
        
        // Gerar token
        const token = jwt.sign(
            { id: user.id, email: user.email },
            JWT_SECRET,
            { expiresIn: '7d' }
        );

        res.status(201).json({
            message: 'Usuário criado com sucesso',
            token,
            user: {
                id: user.id,
                name: user.name,
                email: user.email,
                created_at: user.created_at
            }
        });
    } catch (error) {
        logger.error('Erro no registro:', error);
        res.status(500).json({ error: 'Erro ao criar usuário' });
    }
});

// Login
router.post('/login', async (req, res) => {
    try {
        // Validar entrada
        const { error } = loginSchema.validate(req.body);
        if (error) {
            return res.status(400).json({ error: error.details[0].message });
        }

        const { email, password } = req.body;

        // Buscar usuário
        const result = await query('SELECT * FROM users WHERE email = ', [email]);
        if (result.rows.length === 0) {
            return res.status(401).json({ error: 'Credenciais inválidas' });
        }

        const user = result.rows[0];

        // Verificar senha
        const isValid = await bcrypt.compare(password, user.password);
        if (!isValid) {
            return res.status(401).json({ error: 'Credenciais inválidas' });
        }

        // Gerar token
        const token = jwt.sign(
            { id: user.id, email: user.email },
            JWT_SECRET,
            { expiresIn: '7d' }
        );

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
        logger.error('Erro no login:', error);
        res.status(500).json({ error: 'Erro ao fazer login' });
    }
});

module.exports = router;
