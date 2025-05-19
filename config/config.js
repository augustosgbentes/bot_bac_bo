// config/config.js
require("dotenv").config();

// Configuração do Telegram
const telegramConfig = {
  main: {
    token: process.env.TELEGRAM_TOKEN,
    chatId: process.env.TELEGRAM_CHAT_ID,
  },
  sequencia: {
    token: process.env.TELEGRAM_TOKEN_SEQUENCIA,
    chatId: process.env.TELEGRAM_CHAT_ID_SEQUENCIA,
    chatIdRed: process.env.TELEGRAM_CHAT_ID_SEQUENCIA_RED,
  },
  aposEmpate: {
    token: process.env.TELEGRAM_TOKEN_APOS_EMPATE,
    chatId: process.env.TELEGRAM_CHAT_ID_APOS_EMPATE,
    chatIdRed: process.env.TELEGRAM_CHAT_ID_APOS_EMPATE_RED,
  },
  alternancia: {
    token: process.env.TELEGRAM_TOKEN_ALTERNANCIA,
    chatId: process.env.TELEGRAM_CHAT_ID_ALTERNANCIA,
    chatIdRed: process.env.TELEGRAM_CHAT_ID_ALTERNANCIA_RED,
  },
  proporcao: {
    token: process.env.TELEGRAM_TOKEN_PROPORCAO,
    chatId: process.env.TELEGRAM_CHAT_ID_PROPORCAO,
    chatIdRed: process.env.TELEGRAM_CHAT_ID_PROPORCAO_RED,
  },
};

// Configurações de navegador
const browserConfig = {
  intervalDeReinicializacao: 15 * 60 * 1000, // 15 minutos em milissegundos
  puppeteerOptions: {
    headless: "new",
    args: [
      "--no-sandbox",
      "--disable-setuid-sandbox",
      "--disable-dev-shm-usage",
      "--disable-gpu",
      "--disable-features=AudioServiceOutOfProcess",
      "--disable-extensions",
      "--window-size=1366,768",
      "--disable-accelerated-2d-canvas",
      "--disable-gl-drawing-for-tests",
    ],
    defaultViewport: {
      width: 1366,
      height: 768,
    },
  },
};

// Configurações de monitoramento
const monitorConfig = {
  urlBacBo: "https://www.tipminer.com/br/historico/blaze/bac-bo-ao-vivo",
  intervaloChecagem: 8000, // 8 segundos
  intervaloVerificacaoDia: 60000, // 1 minuto
};

// Configurações do servidor Express
const serverConfig = {
  port: process.env.PORT || 3001,
};

// Estado global compartilhado entre estratégias
const globalState = {
  historico: [],
  contadorRodadas: 0,
  ultimoDiaVerificado: new Date().getDate(),
  ultimoResultadoProcessado: null,

  // Contadores gerais
  totalPlayer: 0,
  totalBanker: 0,
  totalTie: 0,

  // Maior pontuação já registrada para cada lado
  maiorPontuacaoPlayer: 0,
  maiorPontuacaoBanker: 0,

  // Rastreamento de sequências
  sequenciaAtualPlayer: 0,
  sequenciaAtualBanker: 0,
  maiorSequenciaPlayer: 0,
  maiorSequenciaBanker: 0,
  sequenciaAtualTie: 0,
  maiorSequenciaTie: 0,

  // Última vitória registrada
  ultimaVitoria: {
    resultado: null,
    playerScore: null,
    bankerScore: null,
    estrategia: null,
    dataHora: null,
  },

  historicoRodadas: {
    blocos: [],
    blocoAtual: {
      inicio: 0,
      sequencia: { greensG0: 0, greensG1: 0, reds: 0 },
      aposEmpate: { greensG0: 0, greensG1: 0, reds: 0 },
      alternancia: { greensG0: 0, greensG1: 0, reds: 0 },
      proporcaoDinamica: { greensG0: 0, greensG1: 0, reds: 0 },
    },
  },
};

// Exporta todas as configurações
module.exports = {
  telegramConfig,
  browserConfig,
  monitorConfig,
  serverConfig,
  globalState,

  // Função para resetar os contadores (usado no relatório diário)
  resetContadores: () => {
    globalState.totalPlayer = 0;
    globalState.totalBanker = 0;
    globalState.totalTie = 0;
    globalState.contadorRodadas = 0;
    // Não reiniciamos as sequências máximas históricas
  },
};
