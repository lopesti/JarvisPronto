const { getPool } = require('./database');
const bcrypt = require('bcrypt');
const logger = require('../utils/logger');

class User {
  static async getAll() {
    try {
      const pool = getPool();
      if (!pool) throw new Error('Banco de dados não disponível');
      const result = await pool.query(
        'SELECT id, name, email, role, created_at, updated_at FROM users ORDER BY id'
      );
      return result.rows;
    } catch (error) {
      logger.error('Erro ao buscar usuários:', error.message);
      throw error;
    }
  }

  static async findById(id) {
    try {
      const pool = getPool();
      if (!pool) throw new Error('Banco de dados não disponível');
      const result = await pool.query(
        'SELECT id, name, email, role, password, created_at, updated_at FROM users WHERE id = $1',
        [id]
      );
      return result.rows[0] || null;
    } catch (error) {
      logger.error('Erro ao buscar usuário por ID:', error.message);
      throw error;
    }
  }

  static async findByEmail(email) {
    try {
      const pool = getPool();
      if (!pool) throw new Error('Banco de dados não disponível');
      const result = await pool.query(
        'SELECT id, name, email, role, password, created_at, updated_at FROM users WHERE email = $1',
        [email]
      );
      return result.rows[0] || null;
    } catch (error) {
      logger.error('Erro ao buscar usuário por email:', error.message);
      throw error;
    }
  }

  static async create({ name, email, password, role = 'user' }) {
    try {
      const pool = getPool();
      if (!pool) throw new Error('Banco de dados não disponível');
      
      const existingUser = await this.findByEmail(email);
      if (existingUser) {
        throw new Error('Email já está em uso');
      }
      
      const hashedPassword = await bcrypt.hash(password, 10);
      const result = await pool.query(
        `INSERT INTO users (name, email, password, role) 
         VALUES ($1, $2, $3, $4) 
         RETURNING id, name, email, role, created_at, updated_at`,
        [name, email, hashedPassword, role]
      );
      return result.rows[0];
    } catch (error) {
      logger.error('Erro ao criar usuário:', error.message);
      throw error;
    }
  }

  static async update(id, { name, email }) {
    try {
      const pool = getPool();
      if (!pool) throw new Error('Banco de dados não disponível');
      
      const result = await pool.query(
        `UPDATE users 
         SET name = $1, email = $2, updated_at = CURRENT_TIMESTAMP 
         WHERE id = $3 
         RETURNING id, name, email, role, created_at, updated_at`,
        [name, email, id]
      );
      return result.rows[0] || null;
    } catch (error) {
      logger.error('Erro ao atualizar usuário:', error.message);
      throw error;
    }
  }

  static async updatePassword(id, newPassword) {
    try {
      const pool = getPool();
      if (!pool) throw new Error('Banco de dados não disponível');
      
      const hashedPassword = await bcrypt.hash(newPassword, 10);
      const result = await pool.query(
        `UPDATE users 
         SET password = $1, updated_at = CURRENT_TIMESTAMP 
         WHERE id = $2 
         RETURNING id`,
        [hashedPassword, id]
      );
      return result.rows[0] || null;
    } catch (error) {
      logger.error('Erro ao atualizar senha do usuário:', error.message);
      throw error;
    }
  }

  static async comparePassword(plainPassword, hashedPassword) {
    try {
      return await bcrypt.compare(plainPassword, hashedPassword);
    } catch (error) {
      logger.error('Erro ao comparar senha:', error.message);
      throw error;
    }
  }

  static async delete(id) {
    try {
      const pool = getPool();
      if (!pool) throw new Error('Banco de dados não disponível');
      
      const result = await pool.query(
        'DELETE FROM users WHERE id = $1 RETURNING id',
        [id]
      );
      return result.rows.length > 0;
    } catch (error) {
      logger.error('Erro ao deletar usuário:', error.message);
      throw error;
    }
  }
}

module.exports = User;
