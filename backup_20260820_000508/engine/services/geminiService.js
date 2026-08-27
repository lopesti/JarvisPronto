const Groq = require('groq-sdk');
const { GoogleGenerativeAI } = require('@google/generative-ai');

let groqClient = null;
let geminiClient = null;

const BASE_SYSTEM_PROMPT = `Você é Rodrigo, especialista em performance masculina. Vende o Gel Volumetrão via WhatsApp.

TAMANHO DAS RESPOSTAS:
- Máximo 3 linhas por mensagem.
- Seja direto e objetivo. Sem enrolação.
- Nunca mande tudo de uma vez. Vá conduzindo a conversa aos poucos.
- Use no máximo 1 emoji por mensagem.

ÁREA DE ATENDIMENTO:
- Apenas São Paulo capital e Grande São Paulo.
- Fora dessa área: "Por enquanto atendo só SP e Grande SP. Em breve chego na sua região! 🙏"
- Se não souber a cidade do cliente, pergunte antes de fechar o pedido.

REGRAS:
1. Cliente só paga na entrega, nunca adiantado.
2. Linguagem brasileira, natural e confiante.
3. Se disser "quero" ou "fechar" → vá direto pro fechamento.
4. Se perguntar preço → vá direto pra oferta.
5. Nunca seja robótico.

FLUXO (uma etapa por vez):
1. ABERTURA: apresente-se brevemente, reforce pagamento na entrega.
2. BENEFÍCIOS: cite 1 ou 2 benefícios do Volumetrão.
3. PERGUNTA DA DOR: pergunte qual a maior dificuldade do cliente.
4. VALIDAÇÃO: responda a dor com 1 frase personalizada.
5. OFERTA: 2 unidades por R$99,90 hoje.
6. FECHAMENTO: peça nome, bairro e telefone.

RESPOSTAS POR DOR (use apenas 1 frase):
- Firmeza/mole: "O Volumetrão dá firmeza e volume de forma natural, a maioria sente diferença na primeira semana."
- Precoce/rápido: "Ele tem ação retardadora forte, a maioria dos clientes dura bem mais tempo."
- Libido/vontade: "Ele estimula o desejo e a disposição, você vai sentir a diferença."
- Volume/tamanho: "Ele aumenta volume e grossura de forma perceptível com uso contínuo."`;

function initGemini(groqApiKey, geminiApiKey) {
  if (groqApiKey && groqApiKey !== 'sua_chave_aqui') {
    groqClient = new Groq({ apiKey: groqApiKey });
    console.log('✅ IA Groq configurada com sucesso!');
  }
  if (geminiApiKey && geminiApiKey !== 'sua_chave_aqui') {
    geminiClient = new GoogleGenerativeAI(geminiApiKey);
    console.log('✅ IA Gemini configurada com sucesso!');
  }
  return !!(groqClient || geminiClient);
}

async function getGeminiResponse(msg, history = [], stylePrompt = '') {
  let systemPrompt = BASE_SYSTEM_PROMPT;
  if (stylePrompt) systemPrompt = `${BASE_SYSTEM_PROMPT}\n\n${stylePrompt}`;

  const messages = [
    { role: 'system', content: systemPrompt },
    ...history.map(h => ({ role: h.role, content: h.content })),
    { role: 'user', content: msg },
  ];

  if (groqClient) {
    try {
      await new Promise(resolve => setTimeout(resolve, 150));
      const completion = await groqClient.chat.completions.create({
        model: 'llama-3.3-70b-versatile',
        messages,
        temperature: 0.85,
        max_tokens: 200,
      });
      const response = completion.choices[0]?.message?.content;
      if (response) return response;
    } catch (err) {
      console.error('❌ Erro na Groq:', err.message);
    }
  }

  if (geminiClient) {
    try {
      const geminiMessages = messages.map(m => ({
        role: m.role === 'system' ? 'user' : m.role,
        parts: [{ text: m.content }],
      }));
      const model = geminiClient.getGenerativeModel({ model: 'gemini-2.0-flash-exp' });
      const result = await model.generateContent({
        contents: geminiMessages,
        generationConfig: { temperature: 0.85, maxOutputTokens: 200 },
      });
      const response = result.response.text();
      if (response) return response;
    } catch (err) {
      console.error('❌ Erro no Gemini:', err.message);
    }
  }

  return null;
}

async function chat(systemPrompt, history) {
  const lastMsg = history[history.length - 1];
  const previousHistory = history.slice(0, -1);
  return await getGeminiResponse(lastMsg?.content || '', previousHistory, systemPrompt);
}

module.exports = { initGemini, getGeminiResponse, chat };