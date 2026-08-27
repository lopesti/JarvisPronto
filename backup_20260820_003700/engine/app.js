require('dotenv').config({ path: require('path').resolve(__dirname, '../.env') });
const express = require('express');
const cors = require('cors');
const rateLimit = require('express-rate-limit');
const path = require('path');
const logger = require('./utils/logger');

// Validar variáveis obrigatórias
const requiredEnv = ['JWT_SECRET', 'DATABASE_URL'];
const missing = requiredEnv.filter(key => !process.env[key]);
if (missing.length) {
    logger.error('❌ Variáveis obrigatórias faltando: ' + missing.join(', '));
    process.exit(1);
}

const app = express();
const PORT = process.env.PORT || 3000;

// Middlewares
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// CORS
app.use(cors({
    origin: ['http://localhost:3001', 'http://localhost:3000'],
    credentials: true
}));

// Rate Limiting
const limiter = rateLimit({
    windowMs: 15 * 60 * 1000,
    max: 100,
    message: 'Muitas requisições, tente novamente mais tarde'
});
app.use('/api', limiter);

// Rotas
app.use('/auth', require('./routes/auth'));
app.use('/api/users', require('./routes/users'));
app.use('/api/produtos', require('./routes/produtos'));
app.use('/api/conversations', require('./routes/conversations'));
app.use('/api/etiquetas', require('./routes/etiquetas'));

// Health check
app.get('/health', (req, res) => {
    res.json({ status: 'ok', timestamp: new Date().toISOString() });
});

// QR Code
app.get('/qr', (req, res) => {
    res.sendFile(path.join(__dirname, '../public/qr.html'));
});

// Executar migrations
const { runMigrations } = require('./models/migrate');
runMigrations();

// Iniciar WhatsApp
const whatsappService = require('./services/whatsappService');
whatsappService.start();

app.listen(PORT, () => {
    logger.info('✅ Servidor rodando em http://0.0.0.0:' + PORT);
    logger.info('📊 Dashboard: http://localhost:' + PORT + '/');
    logger.info('📱 QR Code: http://localhost:' + PORT + '/qr');
});

// Shutdown gracioso
process.on('SIGINT', async () => {
    logger.info('🛑 Desligando...');
    await whatsappService.disconnect();
    process.exit(0);
});
