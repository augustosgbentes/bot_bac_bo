// src/utils/telegram.js
const axios = require("axios");
const { telegramConfig } = require("../../config/config");

/**
 * Envia mensagem para o Telegram
 * @param {string} mensagem - Texto da mensagem
 * @param {string} estrategia - Nome da estratégia (para selecionar o canal correto)
 * @returns {Promise} Resultado da requisição
 */
async function enviarTelegram(mensagem, estrategia = "geral", isRed = false) {
  try {
    console.log(
      `Enviando para Telegram (${estrategia}${
        isRed ? " RED" : ""
      }): ${mensagem}`
    );

    let token, chatId;

    // Seleciona o token e chat ID apropriados com base na estratégia
    switch (estrategia) {
      case "sequencia":
        token = telegramConfig.sequencia.token;
        chatId = isRed
          ? telegramConfig.sequencia.chatIdRed
          : telegramConfig.sequencia.chatId;
        break;
      case "aposEmpate":
        token = telegramConfig.aposEmpate.token;
        chatId = isRed
          ? telegramConfig.aposEmpate.chatIdRed
          : telegramConfig.aposEmpate.chatId;
        break;
      case "alternancia":
        token = telegramConfig.alternancia.token;
        chatId = isRed
          ? telegramConfig.alternancia.chatIdRed
          : telegramConfig.alternancia.chatId;
        break;
      case "proporcao":
        token = telegramConfig.proporcao.token;
        chatId = isRed
          ? telegramConfig.proporcao.chatIdRed
          : telegramConfig.proporcao.chatId;
        break;
      default:
        // Para relatórios e resultados gerais
        token = telegramConfig.main.token;
        chatId = telegramConfig.main.chatId;
    }

    // Verifica se o token e o chatId são válidos antes de enviar
    if (!token || !chatId) {
      console.error(
        `Token ou chatId indefinido para estratégia ${estrategia}${
          isRed ? " RED" : ""
        }. Usando token geral.`
      );
      token = telegramConfig.main.token;
      chatId = telegramConfig.main.chatId;
    }

    const url = `https://api.telegram.org/bot${token}/sendMessage`;

    const response = await axios.post(url, {
      chat_id: chatId,
      text: mensagem,
    });

    console.log(
      `Mensagem enviada com sucesso para grupo de ${estrategia}${
        isRed ? " RED" : ""
      }`
    );
    return response;
  } catch (err) {
    console.error(
      `Erro ao enviar mensagem para o Telegram (${estrategia}${
        isRed ? " RED" : ""
      }):`,
      err.message
    );
    if (err.response) {
      console.error("Resposta do Telegram:", err.response.data);
    }

    // Em caso de erro, tenta enviar pelo bot principal como fallback
    if (estrategia !== "geral") {
      try {
        console.log("Tentando enviar pelo bot principal como fallback...");
        const urlFallback = `https://api.telegram.org/bot${telegramConfig.main.token}/sendMessage`;
        await axios.post(urlFallback, {
          chat_id: telegramConfig.main.chatId,
          text: `[FALLBACK - Falha ao enviar para grupo ${estrategia}${
            isRed ? " RED" : ""
          }] ${mensagem}`,
        });
        console.log("Mensagem enviada pelo bot fallback");
      } catch (fallbackErr) {
        console.error("Erro também no fallback:", fallbackErr.message);
      }
    }
  }
}

module.exports = {
  enviarTelegram,
};
