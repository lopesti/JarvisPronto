const { getPool } = require('./database');
const logger = require('../utils/logger');

class Produto {
  static async create({ nome, descricao, preco, categoria, estoque, status = 'Ativo' }) {
    try {
      const pool = getPool();
      if (!pool) throw new Error('Banco de dados não disponível');
      
      const result = await pool.query(
        `INSERT INTO produtos (nome, descricao, preco, categoria, estoque, status, created_at, updated_at)
         VALUES ($1, $2, $3, $4, $5, $6, NOW(), NOW())
         RETURNING *`,
        [nome, descricao, preco, categoria, estoque, status]
      );
      return result.rows[0];
    } catch (error) {
      logger.error('Erro ao criar produto:', error.message);
      throw error;
    }
  }

  static async findAll() {
    try {
      const pool = getPool();
      if (!pool) return [];
      
      const result = await pool.query(
        'SELECT * FROM produtos ORDER BY id DESC'
      );
      return result.rows;
    } catch (error) {
      logger.error('Erro ao listar produtos:', error.message);
      return [];
    }
  }

  static async findById(id) {
    try {
      const pool = getPool();
      if (!pool) return null;
      
      const result = await pool.query(
        'SELECT * FROM produtos WHERE id = $1',
        [id]
      );
      return result.rows[0] || null;
    } catch (error) {
      logger.error('Erro ao buscar produto:', error.message);
      return null;
    }
  }

  static async update(id, data) {
    try {
      const pool = getPool();
      if (!pool) throw new Error('Banco de dados não disponível');
      
      const { nome, descricao, preco, categoria, estoque, status } = data;
      const result = await pool.query(
        `UPDATE produtos 
         SET nome = $1, descricao = $2, preco = $3, categoria = $4, 
             estoque = $5, status = $6, updated_at = NOW()
         WHERE id = $7
         RETURNING *`,
        [nome, descricao, preco, categoria, estoque, status, id]
      );
      return result.rows[0];
    } catch (error) {
      logger.error('Erro ao atualizar produto:', error.message);
      throw error;
    }
  }

  static async delete(id) {
    try {
      const pool = getPool();
      if (!pool) throw new Error('Banco de dados não disponível');
      
      await pool.query(
        'DELETE FROM produtos WHERE id = $1',
        [id]
      );
      return true;
    } catch (error) {
      logger.error('Erro ao deletar produto:', error.message);
      throw error;
    }
  }

  static async updateStock(id, quantidade) {
    try {
      const pool = getPool();
      if (!pool) throw new Error('Banco de dados não disponível');
      
      const result = await pool.query(
        `UPDATE produtos 
         SET estoque = estoque + $1, updated_at = NOW()
         WHERE id = $2
         RETURNING *`,
        [quantidade, id]
      );
      return result.rows[0];
    } catch (error) {
      logger.error('Erro ao atualizar estoque:', error.message);
      throw error;
    }
  }
}

module.exports = Produto;
