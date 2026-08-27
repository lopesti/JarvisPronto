const { Pool } = require('pg');
const logger = require('../utils/logger');

// Configuração do PostgreSQL sem SSL
const pool = new Pool({
    connectionString: process.env.DATABASE_URL,
    ssl: false,
    max: 20,
    idleTimeoutMillis: 30000,
    connectionTimeoutMillis: 2000,
});

// Eventos do pool
pool.on('connect', () => {
    logger.info('✅ PostgreSQL conectado com sucesso!');
});

pool.on('error', (err) => {
    logger.error('❌ Erro no PostgreSQL:', err.message);
});

// Função para executar queries
const query = (text, params) => {
    return pool.query(text, params);
};

// Função para obter cliente
const getClient = () => {
    return pool.connect();
};

// Função para obter o pool
const getPool = () => {
    return pool;
};

module.exports = {
    query,
    getClient,
    getPool,
    pool
};
