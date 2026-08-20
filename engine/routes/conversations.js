const express = require('express');
const router = express.Router();
const ConversationController = require('../controllers/conversationController');
const authMiddleware = require('../middlewares/auth');

router.use(authMiddleware.verifyToken);

router.get('/', ConversationController.list);
router.get('/stats', ConversationController.getStats);
router.get('/:id', ConversationController.get);
router.post('/:id/messages', ConversationController.sendMessage);

module.exports = router;