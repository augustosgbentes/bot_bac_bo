// runners/runSequencia.js
require('dotenv').config();
const BacBoApp = require('../src/app');
const { iniciarServidor } = require('../src/server');
const EstrategiaSequencia = require('../src/strategies/sequencia');

/**
 * Script para executar apenas a estratégia de Sequência
 */
async function main() {
  try {
    console.log('Iniciando Bot Bac Bo com estratégia de Sequência...');
    
    // Cria instância da estratégia
    const sequencia = new EstrategiaSequencia();
    
    // Inicializa a aplicação com a estratégia
    const app = new BacBoApp([sequencia]);
    
    // Inicia o servidor web para manter o bot ativo
    iniciarServidor(app);
    
    // Inicia o monitoramento
    await app.iniciarMonitoramento();

    console.log('Bot Bac Bo iniciado com estratégia de Sequência!');
  } catch (error) {
    console.error('Erro ao iniciar o Bot Bac Bo:', error);
    process.exit(1);
  }
}

// Executa o script principal
main();