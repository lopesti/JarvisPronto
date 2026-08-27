const logger = require('../utils/logger');

async function handleMessage(from, text, sock) {
    logger.info('Mensagem de ' + from + ': ' + text);

    const response = 'Ola! Recebi sua mensagem: "' + text + '". Como posso ajudar?';

    try {
        await sock.sendMessage(from, { text: response });
        logger.info('Resposta enviada para ' + from);
    } catch (error) {
        logger.error('Erro ao enviar mensagem:', error.message);
    }
}

module.exports = { handleMessage };
