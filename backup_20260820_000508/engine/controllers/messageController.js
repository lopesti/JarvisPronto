const path = require('path');
const fs = require('fs');
const antiSpam = require('../middlewares/antiSpam');
const logger = require('../utils/logger');
const { getGeminiResponse } = require('../services/geminiService');
const { getMemory, updateMemory, deleteMemory } = require('../services/memoryService');
const { calculateScore, shouldGoToOffer, shouldGoToCheckout } = require('../services/leadScoring');

const BOT_CONFIG_PATH = path.resolve(__dirname, '../../bot_volumetrao.json');
let botConfig;
try {
  botConfig = JSON.parse(fs.readFileSync(BOT_CONFIG_PATH, 'utf8'));
  console.log('[BOT] Configuração carregada com sucesso');
} catch (err) {
  console.error('[BOT] Erro ao carregar bot_volumetrao.json:', err.message);
  process.exit(1);
}

const conversationContext = new Map();
const MAX_CONTEXT_LENGTH = 20;
const precos = { 1: 89.90, 2: 99.90, 3: 139.90, 4: 179.90 };
const lastSentMessage = new Map();

function humanDelay(text) {
  const words = text.split(' ').length;
  const typingSpeed = 80;
  const min = 1500;
  const max = 4000;
  const calculated = words * typingSpeed;
  return Math.min(Math.max(calculated, min), max);
}

async function sendWithTyping(sock, to, text) {
  const lastMsg = lastSentMessage.get(to);
  if (lastMsg === text) return;
  lastSentMessage.set(to, text);
  try {
    await sock.readMessages([{ remoteJid: to, id: 'latest', fromMe: false }]).catch(() => {});
    await sock.sendPresenceUpdate('composing', to);
    const delay = humanDelay(text);
    await new Promise(resolve => setTimeout(resolve, delay));
    await sock.sendPresenceUpdate('paused', to);
    await sock.sendMessage(to, { text });
  } catch (err) {
    await sock.sendMessage(to, { text });
  }
}

function matchesIntent(message, intentName) {
  const keywords = botConfig.palavrasChave?.[intentName] || [];
  const lower = message.toLowerCase();
  return keywords.some(kw => lower.includes(kw));
}

function handleObjection(message) {
  const lower = message.toLowerCase();
  const objecoes = botConfig.objecoes || [];
  for (const obj of objecoes) {
    if (obj.keywords && obj.keywords.some(p => lower.includes(p))) {
      return obj.resposta;
    }
  }
  return null;
}

function getStepMessage(stepId) {
  const step = botConfig.mainFlow?.find(s => s.stepId === stepId);
  return step ? step.message : null;
}

async function advanceStep(sock, from, userCtx, nextStepId, extraData = null) {
  userCtx.step = nextStepId;
  if (extraData) Object.assign(userCtx, extraData);
  const nextMsg = getStepMessage(nextStepId);
  if (nextMsg) {
    await sendWithTyping(sock, from, nextMsg);
  } else {
    logger.warn(`[FLOW] Step ${nextStepId} não encontrado`);
  }
}

function extractCep(text) {
  const match = text.match(/\b(\d{5}-?\d{3})\b/);
  if (match) return match[1].replace(/\D/g, '');
  return null;
}

async function fetchAddressByCep(cep) {
  try {
    const response = await fetch(`https://viacep.com.br/ws/${cep}/json/`);
    const data = await response.json();
    if (data.erro) return null;
    return {
      cep: data.cep,
      logradouro: data.logradouro,
      bairro: data.bairro,
      cidade: data.localidade,
      uf: data.uf,
      completo: `${data.logradouro}, ${data.bairro} - ${data.localidade}/${data.uf}`
    };
  } catch (error) {
    logger.error(`[CEP] Erro: ${error.message}`);
    return null;
  }
}

// ========== DETECÇÃO DE PERGUNTAS COMUNS ==========
const keywords = {
  howToUse: ['como usa', 'como usar', 'modo de usar', 'aplicar', 'instruções', 'como aplica'],
  effectiveness: ['funciona', 'resultado', 'eficácia', 'resolve', 'da certo', 'realmente funciona'],
  composition: ['composição', 'ingredientes', 'fórmula', 'componentes', 'do que é feito', 'anvisa'],
  price: ['preço', 'quanto custa', 'valor', 'preços', 'quanto é', 'custa'],
  delivery: ['entrega', 'prazo', 'frete', 'envio', 'chega em', 'sp', 'são paulo', 'entregam', 'receber', 'demora']
};

function matchKeyword(message, key) {
  const lower = message.toLowerCase();
  return keywords[key].some(kw => lower.includes(kw));
}

const respostas = {
  howToUse: [
    "Claro! Aplicação é simples: lave bem, pegue uma porção do tamanho de uma ervilha, massageie até absorver, espere 15-20min e pronto. Reaplique se quiser. Pagamento só na entrega, ok? 😊",
    "Bora lá: 1) Lave a região 2) Aplique uma pequena quantidade 3) Massageie suavemente 4) Aguarde 15-20min. Fácil, né? E lembre: você só paga quando receber!",
    "Uso: aplique uma camada fina 15-20 minutos antes da relação. Massageie até secar. Reaplicar se necessário. Tem mais alguma dúvida?"
  ],
  effectiveness: [
    "Sim, ele funciona! O gel age na circulação local, trazendo mais firmeza, volume e libido. Milhares de clientes já tiveram resultados. E você só paga na entrega, sem risco.",
    "Com certeza! O Volumetrão é formulado para dar mais potência, firmeza e volume. Clientes notam diferença já na primeira semana. Quer testar sem compromisso?",
    "Funciona sim! Ele melhora a ereção, aumenta a confiança e ainda dá mais tempo de ação. Posso te mostrar os preços?"
  ],
  composition: [
    "A composição é natural: Ginseng, L-arginina, Maca Peruana, própolis... Tudo aprovado pela ANVISA e sem hormônios. Quer saber os preços?",
    "Produto com ativos naturais (Ginseng, L-arginina, Maca), sem hormônios. Aprovado pela ANVISA. Posso te passar os valores?",
    "Ingredientes: extratos botânicos que melhoram a circulação e a libido. Nada de química pesada. Se quiser, te mostro as opções de compra."
  ],
  price: [
    "Hoje tenho: 1 unidade R$89,90 | 2 por R$99,90 | 3 (mais pedido) R$139,90 | 4 por R$179,90. Qual te atende melhor?",
    "Os preços estão assim: 1 - R$89,90; 2 - R$99,90; 3 - R$139,90; 4 - R$179,90. O que acha?",
    "Olha: 1 unidade sai R$89,90, 2 unidades R$99,90, 3 unidades R$139,90 (é o mais vendido), 4 unidades R$179,90. Qual você prefere?"
  ],
  delivery: [
    "Entregamos em todo Brasil! Em SP, chega em 1 a 3 dias úteis. Só paga quando receber. Manda seu CEP aí que confirmo certinho.",
    "Frete grátis para São Paulo? Depende da região, mas em geral entregamos rapidinho. Pagamento na entrega. Me passa seu CEP pra eu ver a data exata.",
    "Pra SP costuma levar 1-3 dias úteis, e você só paga na hora que o produto chegar. Qual seu CEP? Posso consultar o prazo pra você."
  ]
};

function getRandomResponse(type) {
  const arr = respostas[type];
  return arr[Math.floor(Math.random() * arr.length)];
}

async function handleMessage(from, message, sock) {
  if (!antiSpam.check(from)) {
    logger.warn(`[SPAM] Bloqueado ${from}`);
    return;
  }

  logger.info(`[MSG] ${from}: ${message?.substring(0, 80)}`);

  // Respostas imediatas para perguntas comuns
  if (matchKeyword(message, 'howToUse')) { await sendWithTyping(sock, from, getRandomResponse('howToUse')); return; }
  if (matchKeyword(message, 'effectiveness')) { await sendWithTyping(sock, from, getRandomResponse('effectiveness')); return; }
  if (matchKeyword(message, 'composition')) { await sendWithTyping(sock, from, getRandomResponse('composition')); return; }
  if (matchKeyword(message, 'price')) { await sendWithTyping(sock, from, getRandomResponse('price')); return; }
  if (matchKeyword(message, 'delivery')) { await sendWithTyping(sock, from, getRandomResponse('delivery')); return; }

  // Mensagens curtas/genéricas
  if (message.trim().length <= 2 || message.match(/^\?+$/i) || ['não sei', 'sei lá', 'tanto faz'].includes(message.toLowerCase())) {
    await sendWithTyping(sock, from, "Fique à vontade pra perguntar, tô aqui pra isso. O que você gostaria de saber?");
    return;
  }

  // Carregar memória persistente
  let persistentMemory = getMemory(from);
  let userCtx = conversationContext.get(from);

  if (!userCtx && persistentMemory) {
    userCtx = {
      step: persistentMemory.step || 1,
      dor: persistentMemory.dor_principal || null,
      quantidade: persistentMemory.produto_escolhido || null,
      valor: null,
      history: persistentMemory.history || [],
      leadScore: persistentMemory.lead_score || 0,
      startedAt: persistentMemory.ultima_interacao || new Date().toISOString(),
      waitingForCep: false,
      waitingCepConfirmation: false,
      waitingFullAddressConfirm: false,
      enderecoEncontrado: null,
      rawAddress: null,
      waitingForOfferResponse: false
    };
    conversationContext.set(from, userCtx);
    logger.info(`[CTX] Restaurado memória para ${from}, step ${userCtx.step}`);
  }

  // ATIVAÇÃO: RESPONDE QUALQUER MENSAGEM (sem exigir palavras-chave)
  if (!userCtx) {
    userCtx = {
      step: 1, dor: null, quantidade: null, valor: null, history: [], leadScore: 0,
      startedAt: new Date().toISOString(), waitingForCep: false, waitingCepConfirmation: false,
      waitingFullAddressConfirm: false, enderecoEncontrado: null, rawAddress: null, waitingForOfferResponse: false
    };
    conversationContext.set(from, userCtx);
    updateMemory(from, { step: 1, lead_score: 0, ultima_interacao: new Date().toISOString() });
    const step1Msg = getStepMessage(1);
    if (step1Msg) {
      await sendWithTyping(sock, from, step1Msg);
    } else {
      await sendWithTyping(sock, from, "Olá! Sou o Rodrigo, especialista em performance masculina. Posso te ajudar?");
    }
    return;
  }

  // ATUALIZA LEAD SCORE
  const newScore = calculateScore(message);
  userCtx.leadScore += newScore;
  updateMemory(from, { lead_score: userCtx.leadScore, ultima_interacao: new Date().toISOString() });

  // PULO DE ETAPAS POR SCORE
  if (shouldGoToCheckout(userCtx.leadScore) && userCtx.step < 8) {
    logger.info(`[SCORE] Score ${userCtx.leadScore} → fechamento`);
    userCtx.step = 8;
    await advanceStep(sock, from, userCtx, 8);
    return;
  }
  if (shouldGoToOffer(userCtx.leadScore) && userCtx.step < 7) {
    logger.info(`[SCORE] Score ${userCtx.leadScore} → oferta`);
    userCtx.step = 7;
    await advanceStep(sock, from, userCtx, 7);
    return;
  }

  // OBJEÇÕES
  const objection = handleObjection(message);
  if (objection) {
    await sendWithTyping(sock, from, objection);
    userCtx.history.push({ role: 'user', content: message }, { role: 'assistant', content: objection });
    if (userCtx.history.length > MAX_CONTEXT_LENGTH) userCtx.history = userCtx.history.slice(-MAX_CONTEXT_LENGTH);
    updateMemory(from, { history: userCtx.history, step: userCtx.step });
    return;
  }

  const currentStep = userCtx.step;

  // STEPS 1 a 6
  if (currentStep === 1) {
    if (matchesIntent(message, 'sim') || message.toLowerCase().includes('pode')) {
      await advanceStep(sock, from, userCtx, 2);
    } else {
      await sendWithTyping(sock, from, "Posso continuar explicando?");
    }
    return;
  }
  if (currentStep === 2) {
    userCtx.dor = message;
    updateMemory(from, { dor_principal: message, step: 3 });
    await advanceStep(sock, from, userCtx, 3);
    return;
  }
  if (currentStep === 3) {
    updateMemory(from, { tempo_interesse: message, step: 4 });
    await advanceStep(sock, from, userCtx, 4);
    return;
  }
  if (currentStep === 4) { await advanceStep(sock, from, userCtx, 5); return; }
  if (currentStep === 5) { await advanceStep(sock, from, userCtx, 6); return; }
  if (currentStep === 6) {
    if (matchesIntent(message, 'sim') || message.toLowerCase().includes('mostrar')) {
      await advanceStep(sock, from, userCtx, 7);
    } else {
      await sendWithTyping(sock, from, "Quer ver as opções?");
    }
    return;
  }

  // STEP 7: OFERTA
  if (currentStep === 7) {
    const cep = extractCep(message);
    if (cep) {
      const endereco = await fetchAddressByCep(cep);
      if (endereco) {
        userCtx.enderecoEncontrado = endereco;
        await sendWithTyping(sock, from, `Encontrei o endereço: ${endereco.completo}. Agora, qual quantidade você deseja? (1, 2, 3 ou 4 unidades)`);
        userCtx.waitingForQuantityAfterCep = true;
        return;
      } else {
        await sendWithTyping(sock, from, `CEP ${cep} não encontrado. Você pode digitar o endereço completo ou escolher a quantidade primeiro. Qual quantidade você quer? (1, 2, 3, 4)`);
        return;
      }
    }
    const match = message.match(/\b(1|2|3|4)\b/);
    if (match && precos[parseInt(match[1])]) {
      const qtd = parseInt(match[1]);
      userCtx.quantidade = qtd;
      userCtx.valor = precos[qtd].toFixed(2).replace('.', ',');
      updateMemory(from, { produto_escolhido: qtd, step: 8 });
      await sendWithTyping(sock, from, `Ok! ${qtd} unidade(s) por R$ ${userCtx.valor}. Agora me envie seu CEP para confirmar a entrega.`);
      userCtx.step = 8;
      userCtx.waitingForCep = true;
    } else {
      await sendWithTyping(sock, from, "Qual quantidade você quer? Responda 1, 2, 3 ou 4. Se preferir, já me mande seu CEP.");
    }
    return;
  }

  // Estado especial: aguardando quantidade após CEP
  if (userCtx.waitingForQuantityAfterCep) {
    const match = message.match(/\b(1|2|3|4)\b/);
    if (match && precos[parseInt(match[1])]) {
      const qtd = parseInt(match[1]);
      userCtx.quantidade = qtd;
      userCtx.valor = precos[qtd].toFixed(2).replace('.', ',');
      updateMemory(from, { produto_escolhido: qtd, step: 8 });
      await sendWithTyping(sock, from, `Perfeito! ${qtd} unidade(s) por R$ ${userCtx.valor}. Confirme o endereço: ${userCtx.enderecoEncontrado.completo} (SIM/NÃO)?`);
      userCtx.step = 8;
      userCtx.waitingForQuantityAfterCep = false;
      userCtx.waitingCepConfirmation = true;
    } else {
      await sendWithTyping(sock, from, "Por favor, informe a quantidade: 1, 2, 3 ou 4 unidades.");
    }
    return;
  }

  // STEP 8: CEP e confirmação
  if (currentStep === 8) {
    if (userCtx.waitingForCep) {
      const matchNumber = message.match(/\b(1|2|3|4)\b/);
      if (matchNumber && precos[parseInt(matchNumber[1])]) {
        const novaQtd = parseInt(matchNumber[1]);
        userCtx.quantidade = novaQtd;
        userCtx.valor = precos[novaQtd].toFixed(2).replace('.', ',');
        updateMemory(from, { produto_escolhido: novaQtd });
        await sendWithTyping(sock, from, `Quantidade alterada para ${novaQtd} unidade(s) por R$ ${userCtx.valor}. Agora me envie o CEP para confirmar a entrega.`);
        return;
      }
      const cep = extractCep(message);
      if (cep) {
        const endereco = await fetchAddressByCep(cep);
        if (endereco) {
          await sendWithTyping(sock, from, `Seu endereço é ${endereco.completo}. Confirma? (SIM/NÃO)`);
          userCtx.waitingForCep = false;
          userCtx.waitingCepConfirmation = true;
          userCtx.enderecoEncontrado = endereco;
        } else {
          await sendWithTyping(sock, from, 'CEP não encontrado. Digite novamente ou o endereço completo.');
        }
      } else {
        await sendWithTyping(sock, from, 'Envie o CEP com 8 números (ex: 01452002) ou digite 1,2,3,4 para alterar a quantidade.');
      }
      return;
    }

    if (userCtx.waitingCepConfirmation) {
      if (message.toLowerCase().includes('sim')) {
        updateMemory(from, { endereco: userCtx.enderecoEncontrado.completo, step: 10 });
        await sendWithTyping(sock, from, botConfig.successMessage || 'Pedido registrado com sucesso! Obrigado. 🎉');
        logger.info(`[PEDIDO] ${from} - ${userCtx.quantidade} un. - Endereço: ${userCtx.enderecoEncontrado.completo}`);
        conversationContext.delete(from);
        deleteMemory(from);
      } else {
        userCtx.waitingCepConfirmation = false;
        userCtx.waitingFullAddress = true;
        await sendWithTyping(sock, from, 'Ok, digite o endereço completo (rua, número, bairro, cidade).');
      }
      return;
    }

    if (userCtx.waitingFullAddress) {
      userCtx.rawAddress = message;
      await sendWithTyping(sock, from, `O endereço informado foi: "${message}". Confirma? (SIM/NÃO)`);
      userCtx.waitingFullAddress = false;
      userCtx.waitingFullAddressConfirm = true;
      return;
    }

    if (userCtx.waitingFullAddressConfirm) {
      if (message.toLowerCase().includes('sim')) {
        updateMemory(from, { endereco: userCtx.rawAddress, step: 10 });
        await sendWithTyping(sock, from, botConfig.successMessage || 'Pedido registrado com sucesso! Obrigado. 🎉');
        logger.info(`[PEDIDO] ${from} - ${userCtx.quantidade} un. - Endereço manual: ${userCtx.rawAddress}`);
        conversationContext.delete(from);
        deleteMemory(from);
      } else {
        userCtx.waitingFullAddressConfirm = false;
        userCtx.waitingFullAddress = true;
        await sendWithTyping(sock, from, 'Por favor, digite o endereço completo novamente.');
      }
      return;
    }
  }

  // STEP 9
  if (currentStep === 9) {
    updateMemory(from, { dados_cliente: message, step: 10 });
    await advanceStep(sock, from, userCtx, 10);
    return;
  }

  // STEP 10
  if (currentStep === 10) {
    await sendWithTyping(sock, from, botConfig.successMessage || 'Pedido já registrado. Obrigado!');
    return;
  }

  // FALLBACK IA
  userCtx.history.push({ role: 'user', content: message });
  if (userCtx.history.length > MAX_CONTEXT_LENGTH) userCtx.history = userCtx.history.slice(-MAX_CONTEXT_LENGTH);
  let response;
  try {
    const prompt = `Você é Rodrigo, um vendedor simpático e atencioso do Volumetrão. Responda de forma natural, evitando repetições. Use poucos emojis. Seja breve. O cliente disse: "${message}". Histórico: ${JSON.stringify(userCtx.history.slice(-3))}`;
    response = await getGeminiResponse(prompt, []);
  } catch (err) {
    logger.error('[AI] Erro:', err.message);
    response = botConfig.fallbackMessage || 'Não entendi. Pode reformular?';
  }
  if (!response) response = botConfig.fallbackMessage || 'Não entendi. Pode reformular?';
  userCtx.history.push({ role: 'assistant', content: response });
  await sendWithTyping(sock, from, response);
  updateMemory(from, { history: userCtx.history, step: userCtx.step });
}

module.exports = { handleMessage };