const express = require('express');
const router = express.Router();
const User = require('../models/user');
const authMiddleware = require('../middlewares/auth');
const logger = require('../utils/logger');

router.post('/register', async (req, res) => {
  try {
    const { name, email, password } = req.body;

    if (!name || !email || !password) {
      return res.status(400).json({ message: 'Todos os campos são obrigatórios' });
    }

    if (password.length < 6) {
      return res.status(400).json({ message: 'Senha deve ter no mínimo 6 caracteres' });
    }

    const existingUser = await User.findByEmail(email);
    if (existingUser) {
      return res.status(409).json({ message: 'Email já está em uso' });
    }

    const user = await User.create({ name, email, password });
    const token = authMiddleware.generateToken(user.id);

    logger.info(`Novo usuário registrado: ${email}`);
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
    res.status(500).json({ message: 'Erro ao criar usuário' });
  }
});

router.post('/login', async (req, res) => {
  try {
    const { email, password } = req.body;

    if (!email || !password) {
      return res.status(400).json({ message: 'Email e senha são obrigatórios' });
    }

    const user = await User.findByEmail(email);
    if (!user) {
      return res.status(401).json({ message: 'Email ou senha inválidos' });
    }

    const isValid = await User.comparePassword(password, user.password);
    if (!isValid) {
      return res.status(401).json({ message: 'Email ou senha inválidos' });
    }

    const token = authMiddleware.generateToken(user.id);

    logger.info(`Usuário logado: ${email}`);
    res.json({
      message: 'Login realizado com sucesso',
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
    res.status(500).json({ message: 'Erro ao fazer login' });
  }
});

router.get('/me', authMiddleware.verifyToken, async (req, res) => {
  try {
    res.json(req.user);
  } catch (error) {
    logger.error('Erro ao buscar perfil:', error);
    res.status(500).json({ message: 'Erro ao buscar perfil' });
  }
});

module.exports = router;