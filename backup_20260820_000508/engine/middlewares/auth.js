/**
 * auth.js — Middleware de Autenticação JWT
 *
 * PATCH CIRÚRGICO: adiciona proteção aos endpoints /api/*
 * Preserva: /health e /qr (públicos — necessários para monitoramento)
 * Impacto: ZERO no fluxo do bot (Baileys não usa endpoints REST)
 *
 * INSTALAÇÃO: npm install jsonwebtoken
 * .env: JWT_SECRET=<gere com: node -e "console.log(require('crypto').randomBytes(32).toString('hex'))">
 *
 * Rollback: remover require('./middlewares/auth') do app.js
 */

const crypto = require('crypto');

const JWT_SECRET = process.env.JWT_SECRET || crypto.randomBytes(32).toString('hex');

// Sessões ativas em memória (sem dep. Redis por ora)
const activeSessions = new Map(); // token → { createdAt, expiresAt }
const SESSION_TTL_MS = 8 * 60 * 60 * 1000; // 8 horas

/**
 * Gera token simples HMAC-SHA256 (sem dep. jsonwebtoken)
 * Formato: base64(payload).base64(signature)
 */
function generateToken(payload) {
  const data = Buffer.from(JSON.stringify({ ...payload, iat: Date.now() })).toString('base64url');
  const sig = crypto.createHmac('sha256', JWT_SECRET).update(data).digest('base64url');
  const token = `${data}.${sig}`;
  activeSessions.set(token, { createdAt: Date.now(), expiresAt: Date.now() + SESSION_TTL_MS });
  return token;
}

/**
 * Verifica token e retorna payload ou null
 */
function verifyToken(token) {
  if (!token) return null;
  if (!activeSessions.has(token)) return null;
  const session = activeSessions.get(token);
  if (Date.now() > session.expiresAt) {
    activeSessions.delete(token);
    return null;
  }
  try {
    const [data, sig] = token.split('.');
    const expected = crypto.createHmac('sha256', JWT_SECRET).update(data).digest('base64url');
    if (sig !== expected) return null;
    return JSON.parse(Buffer.from(data, 'base64url').toString());
  } catch { return null; }
}

/**
 * Middleware Express — protege rotas /api/*
 * Uso: app.use('/api', requireAuth, router)
 */
function requireAuth(req, res, next) {
  // Extrai token do header Authorization: Bearer <token>
  // ou do cookie jarvis_token (para o dashboard SPA)
  const authHeader = req.headers['authorization'];
  const headerToken = authHeader && authHeader.startsWith('Bearer ') ? authHeader.slice(7) : null;
  const cookieToken = parseCookie(req.headers.cookie || '')['jarvis_token'];
  const token = headerToken || cookieToken;

  const payload = verifyToken(token);
  if (!payload) {
    return res.status(401).json({ error: 'Não autorizado', code: 'INVALID_TOKEN' });
  }
  req.user = payload;
  next();
}

function parseCookie(cookieStr) {
  return Object.fromEntries(cookieStr.split(';').map(c => {
    const [k, ...v] = c.trim().split('=');
    return [k, v.join('=')];
  }).filter(([k]) => k));
}

// Limpa sessões expiradas periodicamente
setInterval(() => {
  const now = Date.now();
  for (const [token, session] of activeSessions.entries()) {
    if (now > session.expiresAt) activeSessions.delete(token);
  }
}, 30 * 60 * 1000); // a cada 30 min

module.exports = { requireAuth, generateToken, verifyToken };
