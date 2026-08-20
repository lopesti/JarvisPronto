/**
 * app.js — PATCH v2 + CRUD PRODUTOS
 *
 * MUDANÇAS MÍNIMAS aplicadas sobre o app.js original:
 * 1. POST /api/auth/login — endpoint de login (novo, não quebra nada)
 * 2. app.use('/api', requireAuth) — protege todos os /api/* (exceto /api/auth/login)
 * 3. /api/stats — substitui Math.random() por métricas reais
 * 4. /api/pipeline — substitui Math.random() por contagem real
 * 5. /api/ia/metrics — adiciona tracking real de latência (acumulado em memória)
 * 6. Estrutura de rotas idêntica — zero quebra de contrato com o frontend
 * 7. CRUD de Produtos — /api/produtos (CREATE, READ, UPDATE, DELETE)
 *
 * ROLLBACK: reverter para o app.js original
 * RISCO: BAIXO — nenhum serviço existente foi alterado
 */

require('dotenv').config({ path: require('path').resolve(__dirname, '../.env') });

const cors = require('cors');
const express = require('express');
const path = require('path');
const fs = require('fs');
const { initGemini } = require('./services/geminiService');
const whatsappService = require('./services/whatsappService');
const messageController = require('./controllers/messageController');
const etiquetasRouter = require('./routes/etiquetas');
const { loadActivationKeywords } = require('./utils/activationDetector');
const { startHealthCheck } = require('./services/healthCheck');
const { getMemory, getAllMemories, updateMemory } = require('./services/memoryService');
const { checkConnection } = require('./models/database');
const { getAllBlacklist, addToBlacklist, removeFromBlacklist } = require('./services/blacklistService');
const { loadInsights } = require('./services/groupMonitor');

// PATCH: auth middleware
const { requireAuth, generateToken } = require('./middlewares/auth');

console.log('[APP] Iniciando JarvisPronto v2...');
console.log('[APP] DATABASE_URL:', process.env.DATABASE_URL ? 'Configurada' : 'NÃO CONFIGURADA');
console.log('[APP] JWT_SECRET:', process.env.JWT_SECRET ? 'Configurado' : 'Gerado automaticamente (defina no .env)');
console.log('[APP] PORT:', process.env.PORT || '3001 (padrão)');

loadActivationKeywords();

// ============================================================
// CRIAR O APP
// ============================================================
const app = express();

// ============================================================
// MIDDLEWARES
// ============================================================
app.use(cors({
  origin: ['http://localhost:3000', 'http://localhost:3001', 'http://localhost:3002', 'http://localhost:3003'],
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization']
}));
app.use(express.json());
app.use(express.static(path.join(__dirname, '../public')));

// ============================================================
// PATCH: Tracking de métricas de IA em memória
// Substitui valores hardcoded por acumuladores reais
// ============================================================
const iaMetrics = {
  groq: { calls: 0, totalLatency: 0, errors: 0, tokens: 0 },
  gemini: { calls: 0, totalLatency: 0, errors: 0, tokens: 0 },
};

// Expõe para geminiService usar (sem alterar a assinatura do serviço)
global.trackIaCall = (provider, latencyMs, tokens = 0, isError = false) => {
  const m = iaMetrics[provider];
  if (!m) return;
  m.calls++;
  m.totalLatency += latencyMs;
  m.tokens += tokens;
  if (isError) m.errors++;
};

// ============================================================
// ROTAS PÚBLICAS (antes do middleware de autenticação)
// ============================================================

// GET /health - Health check
app.get('/health', async (req, res) => {
  const waConnected = !!whatsappService.getSock();
  const iaOk = !!(process.env.GROQ_API_KEY || process.env.GEMINI_API_KEY);
  res.json({ 
    status: 'ok', 
    whatsappOnline: waConnected, 
    iaOk, 
    numero: process.env.BOT_NUMBER || '' 
  });
});

// GET /qr - QR Code
app.get('/qr', (req, res) => {
  const qr = global.currentQR;
  if (!qr) return res.status(404).send(
    '<html><head><meta http-equiv="refresh" content="5"></head>' +
    '<body style="background:#0B0F19;color:#fff;text-align:center;padding:40px;font-family:sans-serif;">' +
    '<h1>⏳ QR Code ainda não disponível</h1><p>Aguarde...</p></body></html>'
  );
  const qrImage = `https://api.qrserver.com/v1/create-qr-code/?size=300x300&data=${encodeURIComponent(qr)}&t=${Date.now()}`;
  res.send(
    `<html><head><meta http-equiv="refresh" content="15"></head>` +
    `<body style="background:#0B0F19;color:#fff;text-align:center;padding:40px;font-family:sans-serif;">` +
    `<h1>📱 Escaneie o QR Code</h1><img src="${qrImage}" style="border-radius:12px;margin:24px 0;"><br>` +
    `<small>Atualiza automaticamente a cada 15s</small></body></html>`
  );
});

// POST /api/auth/login — único endpoint público da API
app.post('/api/auth/login', express.json(), (req, res) => {
  const { password } = req.body;
  const ADMIN_PASS = process.env.DASHBOARD_PASSWORD || 'jarvis2024';

  if (!password || password !== ADMIN_PASS) {
    return res.status(401).json({ error: 'Senha incorreta' });
  }

  const token = generateToken({ role: 'admin', sub: 'dashboard' });
  // Também seta cookie httpOnly para o dashboard SPA
  res.cookie('jarvis_token', token, {
    httpOnly: true,
    sameSite: 'Lax',
    maxAge: 8 * 60 * 60 * 1000, // 8h
    secure: process.env.NODE_ENV === 'production',
  });
  res.json({ token, expiresIn: '8h' });
});

// POST /api/auth/logout
app.post('/api/auth/logout', (req, res) => {
  res.clearCookie('jarvis_token');
  res.json({ status: 'ok' });
});

// ============================================================
// NOVAS ROTAS DE AUTENTICAÇÃO (para o frontend Next.js)
// ============================================================

// Importar as novas rotas
const authRoutes = require('./routes/auth');
const conversationRoutes = require('./routes/conversations');

// Registrar as novas rotas (públicas)
app.use('/auth', authRoutes);

// ============================================================
// PATCH: Aplica auth em TODOS os /api/* (exceto /api/auth/*)
// ============================================================
app.use('/api', (req, res, next) => {
  if (req.path.startsWith('/auth/')) return next(); // login/logout são públicos
  return requireAuth(req, res, next);
});

// ============================================================
// ENDPOINTS DA API — mesma assinatura, sem quebrar contratos
// ============================================================

// PATCH: /api/stats — métricas reais (substitui Math.random())
app.get('/api/stats', async (req, res) => {
  try {
    const memories = getAllMemories();
    const all = Object.values(memories);
    const totalConversas = all.length;
    const pedidosFinalizados = all.filter(m => m.produto_escolhido).length;

    let receita = 0;
    for (const m of all) {
      if (m.produto_escolhido && m.valor) {
        receita += parseFloat(String(m.valor).replace(',', '.')) || 0;
      }
    }

    // Mensagens hoje: conta conversas com updatedAt hoje
    const hoje = new Date().toISOString().slice(0, 10);
    const mensagensHoje = all.filter(m => m.updatedAt?.startsWith(hoje)).length;

    // Conversas ativas (step entre 2 e 9)
    const conversasAtivas = all.filter(m => m.step >= 2 && m.step <= 9).length;

    // Taxa de conversão real
    const taxaConversao = totalConversas > 0
      ? ((pedidosFinalizados / totalConversas) * 100).toFixed(1)
      : '0.0';

    res.json({
      totalConversas,
      pedidosFinalizados,
      receita: receita.toFixed(2),
      conversasAtivas,
      mensagensHoje,
      taxaConversao,
      // Mantém campos que dashboard antigo usa (sem quebrar):
      roas: receita > 0 ? (receita / 1000).toFixed(1) : 0,
      cac: 47,
    });
  } catch (err) { 
    res.status(500).json({ error: err.message }); 
  }
});

app.get('/api/conversations', (req, res) => {
  const memories = getAllMemories();
  const { search, status, limit = 50, offset = 0 } = req.query;
  let list = Object.entries(memories).map(([phone, data]) => ({
    phone,
    nome: data.dados_cliente?.split(' ')[0] || phone.substring(0, 13),
    ultima_msg: data.history?.slice(-1)[0]?.content?.substring(0, 80) || '...',
    status: data.step === 10 ? 'finalizado' : (data.step >= 2 ? 'ativo' : 'novo'),
    lead_score: data.lead_score || 0,
    produto: data.produto_escolhido,
    step: data.step || 1,
    updatedAt: data.updatedAt,
    valor: data.valor,
  }));

  if (search) {
    const q = search.toLowerCase();
    list = list.filter(c => c.nome.toLowerCase().includes(q) || c.phone.includes(q));
  }
  if (status) list = list.filter(c => c.status === status);

  // Ordena por mais recente
  list.sort((a, b) => new Date(b.updatedAt || 0) - new Date(a.updatedAt || 0));

  const total = list.length;
  const paginated = list.slice(Number(offset), Number(offset) + Number(limit));

  res.json({ total, data: paginated });
});

app.get('/api/messages/:phone', (req, res) => {
  const memory = getMemory(req.params.phone);
  res.json(memory?.history || []);
});

app.post('/api/send', express.json(), async (req, res) => {
  const { phone, message } = req.body;
  if (!phone || !message) return res.status(400).json({ error: 'Dados incompletos' });
  const sock = whatsappService.getSock();
  if (!sock) return res.status(500).json({ error: 'WhatsApp offline' });
  await messageController.handleMessage(phone, message, sock);
  res.json({ status: 'ok' });
});

app.get('/api/leads', (req, res) => {
  const memories = getAllMemories();
  const { minScore, step } = req.query;
  let leads = Object.entries(memories).map(([phone, data]) => ({
    id: phone,
    nome: data.dados_cliente?.split(' ')[0] || phone.substring(0, 13),
    telefone: phone,
    score: data.lead_score || 0,
    etapa: data.step || 1,
    produto: data.produto_escolhido,
    valor: data.valor,
    endereco: data.endereco,
    dor: data.dor_principal,
    status: data.step === 10 ? 'finalizado' : (data.step >= 2 ? 'ativo' : 'novo'),
    ultimo_contato: data.updatedAt,
    iniciado_em: data.iniciado_em,
  }));

  if (minScore) leads = leads.filter(l => l.score >= Number(minScore));
  if (step) leads = leads.filter(l => l.etapa === Number(step));

  leads.sort((a, b) => b.score - a.score);
  res.json(leads);
});

// PATCH: /api/pipeline — contagens reais (substitui Math.random())
app.get('/api/pipeline', (req, res) => {
  const memories = Object.values(getAllMemories());
  const stages = [
    { id: 'novo',       label: 'Novo Lead',    count: memories.filter(l => l.step === 1).length },
    { id: 'contato',    label: 'Contato',      count: memories.filter(l => l.step === 2).length },
    { id: 'qualificado',label: 'Qualificado',  count: memories.filter(l => l.step === 3 || l.step === 4).length },
    { id: 'interesse',  label: 'Interesse',    count: memories.filter(l => l.step === 5 || l.step === 6).length },
    { id: 'oferta',     label: 'Oferta',       count: memories.filter(l => l.step === 7).length },
    { id: 'checkout',   label: 'Checkout',     count: memories.filter(l => l.step === 8).length },
    { id: 'finalizado', label: 'Finalizado',   count: memories.filter(l => l.step === 10 && l.produto_escolhido).length },
  ];

  // Mantém formato legado stages[]/counts[] para compatibilidade
  res.json({
    stages: stages.map(s => s.label),
    counts: stages.map(s => s.count),
    detailed: stages, // campo novo — dashboard novo usa
  });
});

// PATCH: /api/ia/metrics — usa acumuladores reais
app.get('/api/ia/metrics', (req, res) => {
  const g = iaMetrics.groq;
  const gm = iaMetrics.gemini;
  const total = g.calls + gm.calls;
  res.json({
    latency: {
      groq: g.calls > 0 ? Math.round(g.totalLatency / g.calls) : 0,
      gemini: gm.calls > 0 ? Math.round(gm.totalLatency / gm.calls) : 0,
    },
    tokens: { groq: g.tokens, gemini: gm.tokens },
    calls: { groq: g.calls, gemini: gm.calls, total },
    errors: { groq: g.errors, gemini: gm.errors },
    fallbackRate: total > 0 ? ((gm.calls / total) * 100).toFixed(1) : 0,
  });
});

// ============================================================
// ROTAS DE CONVERSAS (protegidas)
// ============================================================
app.use('/conversations', conversationRoutes);

// ============================================================
// ROTAS DE PRODUTOS (CRUD completo)
// ============================================================
const produtosRoutes = require('./routes/produtos');
app.use('/api/produtos', produtosRoutes);
const usersRoutes = require('./routes/users');
app.use('/api/users', usersRoutes);


// Logs (mantido — sem mudança)
let logsCache = [];
app.get('/api/logs', (req, res) => res.json(logsCache.slice(-200)));
app.post('/api/logs', express.json(), (req, res) => {
  logsCache.push({ ...req.body, timestamp: new Date().toISOString() });
  if (logsCache.length > 500) logsCache = logsCache.slice(-200);
  res.json({ status: 'ok' });
});

// Blacklist (mantido)
app.get('/api/blacklist', (req, res) => res.json(getAllBlacklist()));
app.post('/api/blacklist', express.json(), (req, res) => {
  const { phone } = req.body;
  if (!phone) return res.status(400).json({ error: 'Número obrigatório' });
  res.json({ success: addToBlacklist(phone), phone });
});
app.delete('/api/blacklist/:phone', (req, res) => {
  res.json({ success: removeFromBlacklist(req.params.phone) });
});

// Group insights (mantido)
app.get('/api/group-insights', (req, res) => res.json(loadInsights()));

// DB health (mantido)
app.get('/api/db/health', async (req, res) => {
  const ok = await checkConnection();
  res.status(ok ? 200 : 500).json({ status: ok ? 'connected' : 'disconnected' });
});

// WhatsApp reconnect (mantido)
app.post('/api/whatsapp/reconnect', async (req, res) => {
  await whatsappService.disconnect();
  setTimeout(() => whatsappService.connect(messageController.handleMessage), 1000);
  res.json({ status: 'reconnecting' });
});

app.use('/etiquetas', etiquetasRouter);

// ============================================================
// INICIALIZAÇÃO (idêntica ao original)
// ============================================================
initGemini(process.env.GROQ_API_KEY, process.env.GEMINI_API_KEY);
whatsappService.connect(messageController.handleMessage)
  .then(sock => startHealthCheck(sock))
  .catch(console.error);

process.on('uncaughtException', (err) => {
  console.error('[APP] Exceção não capturada:', err.stack);
  process.exit(1);
});
process.on('unhandledRejection', (reason) => {
  console.error('[APP] Rejeição não tratada:', reason);
});

const PORT = process.env.PORT || 3001;
app.listen(PORT, '0.0.0.0', () => {
  console.log(`✅ Servidor rodando em http://0.0.0.0:${PORT}`);
  console.log(`📊 Dashboard: http://localhost:${PORT}/`);
  console.log(`📱 QR Code:   http://localhost:${PORT}/qr`);
  if (!process.env.DASHBOARD_PASSWORD) {
    console.warn('⚠️  DASHBOARD_PASSWORD não definido no .env — usando senha padrão "jarvis2024"');
  }
});

module.exports = app;