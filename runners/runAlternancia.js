// runners/runAlternancia.js
require('dotenv').config();
const BacBoApp = require('../src/app');
const { iniciarServidor } = require('../src/server');
const EstrategiaAlternancia = require('../src/strategies/alternancia');

/**
 * Script para executar apenas a estratégia de Alternância
 */
async function main() {
  try {
    console.log('Iniciando Bot Bac Bo com estratégia de Alternância...');
    
    // Cria instância da estratégia
    const alternancia = new EstrategiaAlternancia();
    
    // Inicializa a aplicação com a estratégia
    const app = new BacBoApp([alternancia]);
    
    // Inicia o servidor web para manter o bot ativo
    iniciarServidor(app);
    
    // Inicia o monitoramento
    await app.iniciarMonitoramento();

    console.log('Bot Bac Bo iniciado com estratégia de Alternância!');
  } catch (error) {
    console.error('Erro ao iniciar o Bot Bac Bo:', error);
    process.exit(1);
  }
}

// Executa o script principal
main();