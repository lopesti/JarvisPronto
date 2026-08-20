const { pool } = require('../models/database');
const logger = require('../utils/logger');

class ConversationController {
  // Listar todas as conversas
  static async list(req, res) {
    try {
      const result = await pool.query(`
        SELECT 
          c.phone,
          c.context,
          c.created_at as "createdAt",
          c.updated_at as "updatedAt",
          (
            SELECT content 
            FROM messages 
            WHERE phone = c.phone 
            ORDER BY created_at DESC 
            LIMIT 1
          ) as "lastMessage",
          (
            SELECT created_at 
            FROM messages 
            WHERE phone = c.phone 
            ORDER BY created_at DESC 
            LIMIT 1
          ) as "lastMessageAt",
          (
            SELECT COUNT(*) 
            FROM messages 
            WHERE phone = c.phone AND role = 'user'
          ) as "messageCount"
        FROM conversations c
        ORDER BY c.updated_at DESC
      `);

      res.json(result.rows);
    } catch (error) {
      logger.error('Erro ao listar conversas:', error);
      res.status(500).json({ message: 'Erro ao listar conversas' });
    }
  }

  // Obter uma conversa específica
  static async get(req, res) {
    try {
      const { id } = req.params;
      
      const convResult = await pool.query(
        'SELECT * FROM conversations WHERE phone = $1',
        [id]
      );

      if (convResult.rows.length === 0) {
        return res.status(404).json({ message: 'Conversa não encontrada' });
      }

      const messagesResult = await pool.query(`
        SELECT * FROM messages 
        WHERE phone = $1 
        ORDER BY created_at ASC
      `, [id]);

      const conversation = {
        ...convResult.rows[0],
        messages: messagesResult.rows
      };

      res.json(conversation);
    } catch (error) {
      logger.error('Erro ao buscar conversa:', error);
      res.status(500).json({ message: 'Erro ao buscar conversa' });
    }
  }

  // Enviar mensagem
  static async sendMessage(req, res) {
    try {
      const { id } = req.params;
      const { message } = req.body;

      if (!message) {
        return res.status(400).json({ message: 'Mensagem é obrigatória' });
      }

      await pool.query(
        `INSERT INTO messages (phone, role, content, created_at) 
         VALUES ($1, $2, $3, NOW())`,
        [id, 'user', message]
      );

      await pool.query(
        `INSERT INTO conversations (phone, updated_at) 
         VALUES ($1, NOW()) 
         ON CONFLICT (phone) DO UPDATE 
         SET updated_at = NOW()`,
        [id]
      );

      logger.info(`Mensagem enviada para ${id}: ${message.substring(0, 50)}...`);

      res.json({ 
        message: 'Mensagem enviada com sucesso',
        data: { phone: id, content: message }
      });
    } catch (error) {
      logger.error('Erro ao enviar mensagem:', error);
      res.status(500).json({ message: 'Erro ao enviar mensagem' });
    }
  }

  // Estatísticas
  static async getStats(req, res) {
    try {
      const result = await pool.query(`
        SELECT 
          (SELECT COUNT(*) FROM conversations) as "totalConversations",
          (SELECT COUNT(*) FROM messages WHERE role = 'user') as "totalMessages",
          (SELECT COUNT(*) FROM messages WHERE role = 'assistant') as "totalResponses",
          (SELECT COUNT(*) FROM messages WHERE created_at > NOW() - INTERVAL '24 hours') as "messagesToday"
      `);

      res.json(result.rows[0]);
    } catch (error) {
      logger.error('Erro ao buscar estatísticas:', error);
      res.status(500).json({ message: 'Erro ao buscar estatísticas' });
    }
  }
}

module.exports = ConversationController;