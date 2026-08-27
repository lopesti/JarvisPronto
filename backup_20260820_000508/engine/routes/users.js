const express = require('express');
const router = express.Router();
const User = require('../models/user');
const { requireAuth } = require('../middlewares/auth');
const logger = require('../utils/logger');

// Todas as rotas precisam de autenticação
router.use(requireAuth);

// GET - Listar todos os usuários
router.get('/', async (req, res) => {
  try {
    const users = await User.getAll();
    res.json(users);
  } catch (error) {
    logger.error('Erro ao listar usuários:', error.message);
    res.status(500).json({ error: 'Erro ao buscar usuários' });
  }
});

// GET - Buscar usuário por ID
router.get('/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const user = await User.findById(id);
    if (!user) {
      return res.status(404).json({ error: 'Usuário não encontrado' });
    }
    delete user.password;
    res.json(user);
  } catch (error) {
    logger.error('Erro ao buscar usuário:', error.message);
    res.status(500).json({ error: 'Erro ao buscar usuário' });
  }
});

// PUT - Atualizar usuário
router.put('/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const { name, email } = req.body;

    if (!name || !email) {
      return res.status(400).json({ error: 'Nome e email são obrigatórios' });
    }

    const existingUser = await User.findByEmail(email);
    if (existingUser && existingUser.id !== parseInt(id)) {
      return res.status(400).json({ error: 'Email já está em uso' });
    }

    const updatedUser = await User.update(id, { name, email });
    if (!updatedUser) {
      return res.status(404).json({ error: 'Usuário não encontrado' });
    }
    delete updatedUser.password;
    res.json(updatedUser);
  } catch (error) {
    logger.error('Erro ao atualizar usuário:', error.message);
    res.status(500).json({ error: 'Erro ao atualizar usuário' });
  }
});

// DELETE - Deletar usuário
router.delete('/:id', async (req, res) => {
  try {
    const { id } = req.params;

    if (parseInt(id) === req.user.id) {
      return res.status(400).json({ error: 'Não é possível deletar seu próprio usuário' });
    }

    const deleted = await User.delete(id);
    if (!deleted) {
      return res.status(404).json({ error: 'Usuário não encontrado' });
    }

    res.json({ message: 'Usuário deletado com sucesso' });
  } catch (error) {
    logger.error('Erro ao deletar usuário:', error.message);
    res.status(500).json({ error: 'Erro ao deletar usuário' });
  }
});

module.exports = router;
