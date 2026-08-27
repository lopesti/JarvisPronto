const { query } = require('./database');
const bcrypt = require('bcrypt');
const logger = require('../utils/logger');

class User {
    static async getAll() {
        const result = await query('SELECT id, name, email, role, created_at, updated_at FROM users ORDER BY id');
        return result.rows;
    }

    static async findById(id) {
        const result = await query('SELECT id, name, email, role, created_at, updated_at FROM users WHERE id = ', [id]);
        return result.rows[0] || null;
    }

    static async findByEmail(email) {
        const result = await query('SELECT * FROM users WHERE email = ', [email]);
        return result.rows[0] || null;
    }

    static async create(name, email, password) {
        const hashedPassword = await bcrypt.hash(password, 10);
        const result = await query(
            'INSERT INTO users (name, email, password) VALUES (, , ) RETURNING id, name, email, created_at',
            [name, email, hashedPassword]
        );
        return result.rows[0];
    }

    static async update(id, data) {
        const { name, email } = data;
        const result = await query(
            'UPDATE users SET name = , email = , updated_at = NOW() WHERE id =  RETURNING id, name, email, role, created_at, updated_at',
            [name, email, id]
        );
        return result.rows[0] || null;
    }

    static async delete(id) {
        const result = await query('DELETE FROM users WHERE id =  RETURNING id', [id]);
        return result.rows[0] || null;
    }

    static async validatePassword(email, password) {
        const user = await this.findByEmail(email);
        if (!user) return null;
        const isValid = await bcrypt.compare(password, user.password);
        if (!isValid) return null;
        delete user.password;
        return user;
    }
}

module.exports = User;
