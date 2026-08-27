const fs = require('fs');
const path = require('path');
const { pool } = require('./database');
const logger = require('../utils/logger');

async function runMigrations() {
    try {
        const migrationsDir = path.join(__dirname, '../migrations');
        if (!fs.existsSync(migrationsDir)) {
            logger.warn('Pasta de migrations não encontrada');
            return;
        }
        
        const files = fs.readdirSync(migrationsDir).filter(f => f.endsWith('.sql')).sort();
        
        for (const file of files) {
            const sql = fs.readFileSync(path.join(migrationsDir, file), 'utf8');
            await pool.query(sql);
            logger.info('Migration ' + file + ' executada');
        }
        
        logger.info('Todas as migrations executadas com sucesso!');
    } catch (error) {
        logger.error('Erro ao executar migrations:', error.message);
    }
}

module.exports = { runMigrations };
