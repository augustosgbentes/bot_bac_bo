// runners/runAposEmpate.js
require('dotenv').config();
const BacBoApp = require('../src/app');
const { iniciarServidor } = require('../src/server');
const EstrategiaAposEmpate = require('../src/strategies/aposEmpate');

/**
 * Script para executar apenas a estratégia Após Empate
 */
async function main() {
  try {
    console.log('Iniciando Bot Bac Bo com estratégia Após Empate...');
    
    // Cria instância da estratégia
    const aposEmpate = new EstrategiaAposEmpate();
    
    // Inicializa a aplicação com a estratégia
    const app = new BacBoApp([aposEmpate]);
    
    // Inicia o servidor web para manter o bot ativo
    iniciarServidor(app);
    
    // Inicia o monitoramento
    await app.iniciarMonitoramento();

    console.log('Bot Bac Bo iniciado com estratégia Após Empate!');
  } catch (error) {
    console.error('Erro ao iniciar o Bot Bac Bo:', error);
    process.exit(1);
  }
}

// Executa o script principal
main();