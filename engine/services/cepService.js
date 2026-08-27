const { CepService } = require('core-zipcode-br');

// Inicializa o serviço, com logs ativados para depuração (opcional)
const cepService = new CepService({ log: true });

/**
 * Função para extrair CEP de um texto livre.
 * @param {string} text - Mensagem recebida do cliente.
 * @returns {string|null} - CEP encontrado ou null.
 */
function extractCep(text) {
    // Remove tudo que não é número e garante ao menos 8 dígitos
    const clean = text.replace(/\D/g, '');
    if (clean.length === 8 && /^[0-9]{8}$/.test(clean)) {
        return clean;
    }
    return null;
}

/**
 * Função para buscar o endereço a partir do CEP.
 * @param {string} cep - CEP com 8 dígitos.
 * @returns {Promise<object|null>} - Dados do endereço ou null.
 */
async function searchAddress(cep) {
    try {
        const address = await cepService.searchAddressByZipCode(cep);
        if (address && address.street && address.city) {
            return address;
        }
        return null;
    } catch (error) {
        console.error(`[CEP] Erro na consulta: ${error.message}`);
        return null;
    }
}

module.exports = { extractCep, searchAddress };