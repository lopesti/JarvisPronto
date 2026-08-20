const express = require('express');
const router = express.Router();

/**
 * GET /etiquetas
 * List available label/tag categories
 */
router.get('/', (req, res) => {
  res.json({
    etiquetas: [
      { id: 'lead_quente', label: 'Lead Quente', cor: '#FF5733' },
      { id: 'aguardando_pagamento', label: 'Aguardando Pagamento', cor: '#FFC300' },
      { id: 'pedido_feito', label: 'Pedido Feito', cor: '#28B463' },
      { id: 'suporte', label: 'Suporte', cor: '#3498DB' },
      { id: 'bloqueado', label: 'Bloqueado', cor: '#7F8C8D' },
    ],
  });
});

/**
 * POST /etiquetas/aplicar
 * Apply a label to a conversation
 * Body: { phone: string, etiqueta: string }
 */
router.post('/aplicar', async (req, res) => {
  const { phone, etiqueta } = req.body;

  if (!phone || !etiqueta) {
    return res.status(400).json({ error: 'phone e etiqueta são obrigatórios' });
  }

  // TODO: integrate with WhatsApp label API when available in Baileys
  console.log(`[ETIQUETA] Aplicando "${etiqueta}" para ${phone}`);

  res.json({ success: true, phone, etiqueta });
});

/**
 * DELETE /etiquetas/remover
 * Remove a label from a conversation
 * Body: { phone: string, etiqueta: string }
 */
router.delete('/remover', async (req, res) => {
  const { phone, etiqueta } = req.body;

  if (!phone || !etiqueta) {
    return res.status(400).json({ error: 'phone e etiqueta são obrigatórios' });
  }

  console.log(`[ETIQUETA] Removendo "${etiqueta}" de ${phone}`);

  res.json({ success: true, phone, etiqueta });
});

module.exports = router;
