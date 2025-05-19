// runners/runProporcao.js
require('dotenv').config();
const BacBoApp = require('../src/app');
const { iniciarServidor } = require('../src/server');
const EstrategiaProporcaoDinamica = require('../src/strategies/proporcaoDinamica');

/**
 * Script para executar apenas a estratégia de Proporção Dinâmica
 */
async function main() {
  try {
    console.log('Iniciando Bot Bac Bo com estratégia de Proporção Dinâmica...');
    
    // Cria instância da estratégia
    const proporcao = new EstrategiaProporcaoDinamica();
    
    // Inicializa a aplicação com a estratégia
    const app = new BacBoApp([proporcao]);
    
    // Inicia o servidor web para manter o bot ativo
    iniciarServidor(app);
    
    // Inicia o monitoramento
    await app.iniciarMonitoramento();

    console.log('Bot Bac Bo iniciado com estratégia de Proporção Dinâmica!');
  } catch (error) {
    console.error('Erro ao iniciar o Bot Bac Bo:', error);
    process.exit(1);
  }
}

// Executa o script principal
main();