// runners/runAll.js
require('dotenv').config();
const BacBoApp = require('../src/app');
const { iniciarServidor } = require('../src/server');
const EstrategiaSequencia = require('../src/strategies/sequencia');
const EstrategiaAposEmpate = require('../src/strategies/aposEmpate');
const EstrategiaAlternancia = require('../src/strategies/alternancia');
const EstrategiaProporcaoDinamica = require('../src/strategies/proporcaoDinamica');

/**
 * Script principal para executar todas as estratégias
 */
async function main() {
  try {
    console.log('Iniciando Bot Bac Bo com todas as estratégias...');
    
    // Cria instâncias de todas as estratégias
    const estrategias = [
      new EstrategiaSequencia(),
      new EstrategiaAposEmpate(),
      new EstrategiaAlternancia(),
      new EstrategiaProporcaoDinamica()
    ];
    
    // Inicializa a aplicação com todas as estratégias
    const app = new BacBoApp(estrategias);
    
    // Inicia o servidor web para manter o bot ativo
    iniciarServidor(app);
    
    // Inicia o monitoramento
    await app.iniciarMonitoramento();

    console.log('Bot Bac Bo iniciado com todas as estratégias!');
  } catch (error) {
    console.error('Erro ao iniciar o Bot Bac Bo:', error);
    process.exit(1);
  }
}

// Executa o script principal
main();