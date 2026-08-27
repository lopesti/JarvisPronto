const { query } = require('./database');
const logger = require('../utils/logger');

class Produto {
    static async findAll() {
        const result = await query('SELECT * FROM produtos ORDER BY id');
        return result.rows;
    }

    static async findById(id) {
        const result = await query('SELECT * FROM produtos WHERE id = ', [id]);
        return result.rows[0] || null;
    }

    static async create(data) {
        const { nome, descricao, preco, categoria, estoque, status } = data;
        const result = await query(
            INSERT INTO produtos (nome, descricao, preco, categoria, estoque, status, created_at, updated_at) 
             VALUES (, , , , , , NOW(), NOW()) 
             RETURNING *,
            [nome, descricao, preco, categoria, estoque || 0, status || 'ativo']
        );
        return result.rows[0];
    }

    static async update(id, data) {
        const { nome, descricao, preco, categoria, estoque, status } = data;
        const result = await query(
            UPDATE produtos 
             SET nome = , descricao = , preco = , categoria = , estoque = , status = , updated_at = NOW() 
             WHERE id =  
             RETURNING *,
            [nome, descricao, preco, categoria, estoque, status, id]
        );
        return result.rows[0] || null;
    }

    static async delete(id) {
        const result = await query('DELETE FROM produtos WHERE id =  RETURNING id', [id]);
        return result.rows[0] || null;
    }
}

module.exports = Produto;
