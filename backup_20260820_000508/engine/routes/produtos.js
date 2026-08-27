const express = require('express');
const router = express.Router();
const ProdutoController = require('../controllers/produtoController');
const { requireAuth } = require('../middlewares/auth');

// Todas as rotas precisam de autenticação
router.use(requireAuth);

// CRUD Produtos
router.get('/', ProdutoController.list);          // READ all
router.get('/:id', ProdutoController.getById);    // READ one
router.post('/', ProdutoController.create);       // CREATE
router.put('/:id', ProdutoController.update);     // UPDATE
router.delete('/:id', ProdutoController.delete);  // DELETE

module.exports = router;
