const { Pool } = require('pg');

let pool = null;

function getPool() {
  if (pool) return pool;
  
  if (!process.env.DATABASE_URL) {
    console.warn('[DB] DATABASE_URL não configurado. Banco de dados desabilitado.');
    return null;
  }

  const isLocal = process.env.DATABASE_URL.includes('localhost') || 
                  process.env.DATABASE_URL.includes('127.0.0.1');

  pool = new Pool({
    connectionString: process.env.DATABASE_URL,
    ssl: isLocal ? false : { rejectUnauthorized: false },
    max: 10,
    idleTimeoutMillis: 30000,
    connectionTimeoutMillis: 5000,
  });

  pool.on('error', (err) => {
    console.error('[DB] Erro no pool de conexões:', err.message);
  });

  console.log('[DB] Pool de conexões criado com sucesso.');
  return pool;
}

async function initDb() {
  const p = getPool();
  if (!p) {
    console.warn('[DB] Banco de dados não disponível para inicialização.');
    return;
  }

  try {
    await p.query(`
      CREATE TABLE IF NOT EXISTS conversations (
        id SERIAL PRIMARY KEY,
        phone VARCHAR(30) NOT NULL UNIQUE,
        step INT DEFAULT 1,
        dor TEXT,
        created_at TIMESTAMP DEFAULT NOW(),
        updated_at TIMESTAMP DEFAULT NOW()
      );
    `);

    await p.query(`
      CREATE TABLE IF NOT EXISTS sales (
        id SERIAL PRIMARY KEY,
        phone VARCHAR(30) NOT NULL,
        dor TEXT,
        created_at TIMESTAMP DEFAULT NOW()
      );
    `);

    await p.query(`
      CREATE TABLE IF NOT EXISTS messages (
        id SERIAL PRIMARY KEY,
        phone VARCHAR(30) NOT NULL,
        role VARCHAR(10) NOT NULL,
        content TEXT NOT NULL,
        created_at TIMESTAMP DEFAULT NOW()
      );
    `);

    await p.query(`
      CREATE TABLE IF NOT EXISTS users (
        id SERIAL PRIMARY KEY,
        name VARCHAR(100) NOT NULL,
        email VARCHAR(100) UNIQUE NOT NULL,
        password VARCHAR(255) NOT NULL,
        role VARCHAR(50) DEFAULT 'user',
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      );
    `);

    console.log('[DB] Tabelas inicializadas com sucesso.');
  } catch (err) {
    console.error('[DB] Erro ao inicializar tabelas:', err.message);
  }
}

async function checkConnection() {
  try {
    const p = getPool();
    if (!p) return false;
    await p.query('SELECT 1');
    return true;
  } catch (err) {
    console.error('[DB] Erro na conexão:', err.message);
    return false;
  }
}

// Exportações
module.exports = {
  getPool,
  initDb,
  checkConnection,
  saveConversation: async (phone, step, dor) => {
    const p = getPool();
    if (!p) return;
    try {
      await p.query(
        `INSERT INTO conversations (phone, step, dor, updated_at)
         VALUES ($1, $2, $3, NOW())
         ON CONFLICT (phone) DO UPDATE SET step = $2, dor = $3, updated_at = NOW()`,
        [phone, step, dor]
      );
    } catch (err) {
      console.error('[DB] saveConversation error:', err.message);
    }
  },
  logSale: async (phone, dor) => {
    const p = getPool();
    if (!p) return;
    try {
      await p.query('INSERT INTO sales (phone, dor) VALUES ($1, $2)', [phone, dor]);
    } catch (err) {
      console.error('[DB] logSale error:', err.message);
    }
  },
  saveMessage: async (phone, role, content) => {
    const p = getPool();
    if (!p) return;
    try {
      await p.query('INSERT INTO messages (phone, role, content) VALUES ($1, $2, $3)', [phone, role, content]);
    } catch (err) {
      console.error('[DB] saveMessage error:', err.message);
    }
  },
  getMessages: async (phone, limit = 20) => {
    const p = getPool();
    if (!p) return [];
    try {
      const result = await p.query(
        'SELECT role, content FROM messages WHERE phone = $1 ORDER BY created_at DESC LIMIT $2',
        [phone, limit]
      );
      return result.rows.reverse();
    } catch (err) {
      console.error('[DB] getMessages error:', err.message);
      return [];
    }
  }
};