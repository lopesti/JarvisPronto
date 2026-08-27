const express = require('express');
const router = express.Router();
const { query } = require('../models/database');
const logger = require('../utils/logger');

// Listar produtos
router.get('/', async (req, res) => {
    try {
        const result = await query('SELECT * FROM produtos ORDER BY id');
        res.json(result.rows);
    } catch (error) {
        logger.error('Erro ao listar produtos:', error.message);
        res.status(500).json({ error: 'Erro ao listar produtos' });
    }
});

// Buscar produto por ID
router.get('/:id', async (req, res) => {
    try {
        const { id } = req.params;
        const result = await query('SELECT * FROM produtos WHERE id = ', [id]);
        if (result.rows.length === 0) {
            return res.status(404).json({ error: 'Produto não encontrado' });
        }
        res.json(result.rows[0]);
    } catch (error) {
        logger.error('Erro ao buscar produto:', error.message);
        res.status(500).json({ error: 'Erro ao buscar produto' });
    }
});

// Criar produto
router.post('/', async (req, res) => {
    try {
        const { nome, preco, descricao, estoque } = req.body;
        if (!nome || !preco) {
            return res.status(400).json({ error: 'Nome e preço são obrigatórios' });
        }
        const result = await query(
            'INSERT INTO produtos (nome, preco, descricao, estoque) VALUES (, , , ) RETURNING *',
            [nome, preco, descricao, estoque || 0]
        );
        res.status(201).json(result.rows[0]);
    } catch (error) {
        logger.error('Erro ao criar produto:', error.message);
        res.status(500).json({ error: 'Erro ao criar produto' });
    }
});

// Atualizar produto
router.put('/:id', async (req, res) => {
    try {
        const { id } = req.params;
        const { nome, preco, descricao, estoque } = req.body;
        const result = await query(
            'UPDATE produtos SET nome = , preco = , descricao = , estoque = , updated_at = NOW() WHERE id =  RETURNING *',
            [nome, preco, descricao, estoque, id]
        );
        if (result.rows.length === 0) {
            return res.status(404).json({ error: 'Produto não encontrado' });
        }
        res.json(result.rows[0]);
    } catch (error) {
        logger.error('Erro ao atualizar produto:', error.message);
        res.status(500).json({ error: 'Erro ao atualizar produto' });
    }
});

// Deletar produto
router.delete('/:id', async (req, res) => {
    try {
        const { id } = req.params;
        const result = await query('DELETE FROM produtos WHERE id =  RETURNING id', [id]);
        if (result.rows.length === 0) {
            return res.status(404).json({ error: 'Produto não encontrado' });
        }
        res.json({ message: 'Produto deletado com sucesso' });
    } catch (error) {
        logger.error('Erro ao deletar produto:', error.message);
        res.status(500).json({ error: 'Erro ao deletar produto' });
    }
});

module.exports = router;
