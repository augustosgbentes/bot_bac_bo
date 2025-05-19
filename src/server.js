// src/server.js
const express = require('express');
const { serverConfig } = require('../config/config');

/**
 * Inicia o servidor express para manter o bot ativo em serviços como Render
 * @param {Object} app - Instância do BacBoApp (opcional)
 * @returns {Object} Instância do servidor express
 */
function iniciarServidor(app = null) {
  const server = express();
  const PORT = serverConfig.port;

  // Rota principal que retorna o status do bot
  server.get('/', (req, res) => {
    res.send('✅ Bot do Bac Bo está rodando!');
  });

  // Rota de status que mostra informações das estratégias
  server.get('/status', (req, res) => {
    if (app) {
      const estrategias = app.listarEstrategias();
      res.json({
        status: '✅ Bot do Bac Bo está rodando!',
        estrategias_ativas: estrategias,
        ultima_verificacao: new Date().toISOString(),
        monitoramento_ativo: app.monitoramentoAtivo
      });
    } else {
      res.json({
        status: '✅ Bot do Bac Bo está rodando!',
        nota: 'Servidor em modo standalone - sem acesso ao status das estratégias'
      });
    }
  });

  // Inicia o servidor na porta especificada
  const serverInstance = server.listen(PORT, () => {
    console.log(`🌐 Web service ativo na porta ${PORT}`);
  });

  return serverInstance;
}

module.exports = {
  iniciarServidor
};