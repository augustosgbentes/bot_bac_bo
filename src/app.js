// src/app.js
const { getBacBoResultado } = require('./services/dataFetcher');
const { globalState } = require('../config/config');
const { enviarTelegram } = require('./utils/telegram');
const {
  enviarRelatorioEstatistico,
  enviarResumo,
  enviarRelatorioDetalhado,
  enviarRelatorioDiarioEReiniciar,
  enviarRelatorioPorPeriodo,
  enviarRelatorioBlocosDe50Rodadas
} = require('./services/reporter');

/**
 * Classe principal do aplicativo que coordena as estratégias
 */
class BacBoApp {
  /**
   * Construtor da classe BacBoApp
   * @param {Object[]} estrategias - Array de estratégias a serem monitoradas
   */
  constructor(estrategias = []) {
    this.estrategias = {};
    
    // Inicializa as estratégias passadas
    if (Array.isArray(estrategias) && estrategias.length > 0) {
      estrategias.forEach(estrategia => {
        if (estrategia && estrategia.nome) {
          const nomeFormatado = this.formatarNomeEstrategia(estrategia.nome);
          this.estrategias[nomeFormatado] = estrategia;
        }
      });
    }
    
    this.monitoramentoAtivo = false;
    this.intervalId = null;

    // Inicializar contadores por período se não existirem
    if (!globalState.historicoRodadas) {
      globalState.historicoRodadas = {
        blocos: [],
        blocoAtual: {
          inicio: globalState.contadorRodadas,
          sequencia: { greensG0: 0, greensG1: 0, reds: 0, ties: 0 },
          aposempate: { greensG0: 0, greensG1: 0, reds: 0, ties: 0 },
          alternancia: { greensG0: 0, greensG1: 0, reds: 0, ties: 0 },
          proporcaodinamica: { greensG0: 0, greensG1: 0, reds: 0, ties: 0 }
        }
      };
    }
  }

  /**
   * Formata o nome da estratégia para usar como chave
   * @param {string} nome - Nome da estratégia
   * @returns {string} Nome formatado
   */
  formatarNomeEstrategia(nome) {
    return nome.toLowerCase()
      .replace(/á|à|â|ã/g, 'a')
      .replace(/é|è|ê/g, 'e')
      .replace(/í|ì|î/g, 'i')
      .replace(/ó|ò|ô|õ/g, 'o')
      .replace(/ú|ù|û/g, 'u')
      .replace(/ç/g, 'c')
      .replace(/\s+/g, '')
      .replace(/[^a-z0-9]/g, '');
  }

  /**
   * Adiciona uma estratégia à lista de monitoramento
   * @param {Object} estrategia - Estratégia a ser adicionada
   */
  adicionarEstrategia(estrategia) {
    if (estrategia && estrategia.nome) {
      const nomeFormatado = this.formatarNomeEstrategia(estrategia.nome);
      this.estrategias[nomeFormatado] = estrategia;
      console.log(`Estratégia "${estrategia.nome}" adicionada com sucesso`);
    } else {
      console.error("Tentativa de adicionar estratégia inválida");
    }
  }

  /**
   * Remove uma estratégia da lista de monitoramento
   * @param {string} nomeEstrategia - Nome da estratégia a ser removida
   */
  removerEstrategia(nomeEstrategia) {
    const nomeFormatado = this.formatarNomeEstrategia(nomeEstrategia);
    if (this.estrategias[nomeFormatado]) {
      delete this.estrategias[nomeFormatado];
      console.log(`Estratégia "${nomeEstrategia}" removida com sucesso`);
    } else {
      console.error(`Estratégia "${nomeEstrategia}" não encontrada`);
    }
  }

  /**
   * Lista todas as estratégias ativas
   * @returns {string[]} Lista de nomes das estratégias
   */
  listarEstrategias() {
    return Object.values(this.estrategias).map(e => e.nome);
  }

  /**
   * Processa um resultado para todas as estratégias ativas
   * @param {Object} res - Resultado a ser processado
   */
  async processarResultado(res) {
    console.log(
      `Processando resultado: ${res.resultado} (Player: ${res.player}, Banker: ${res.banker})`
    );
    globalState.contadorRodadas++;

    // Incrementa os contadores globais
    if (res.resultado === "player") {
      globalState.totalPlayer++;
      globalState.sequenciaAtualPlayer++;
      globalState.sequenciaAtualBanker = 0;
      globalState.sequenciaAtualTie = 0;

      // Atualiza a maior sequência
      if (globalState.sequenciaAtualPlayer > globalState.maiorSequenciaPlayer) {
        globalState.maiorSequenciaPlayer = globalState.sequenciaAtualPlayer;
      }
    } else if (res.resultado === "banker") {
      globalState.totalBanker++;
      globalState.sequenciaAtualBanker++;
      globalState.sequenciaAtualPlayer = 0;
      globalState.sequenciaAtualTie = 0;

      // Atualiza a maior sequência
      if (globalState.sequenciaAtualBanker > globalState.maiorSequenciaBanker) {
        globalState.maiorSequenciaBanker = globalState.sequenciaAtualBanker;
      }
    } else if (res.resultado === "tie") {
      globalState.totalTie++;
      globalState.sequenciaAtualTie++;
      globalState.sequenciaAtualPlayer = 0;
      globalState.sequenciaAtualBanker = 0;

      // Atualiza a maior sequência
      if (globalState.sequenciaAtualTie > globalState.maiorSequenciaTie) {
        globalState.maiorSequenciaTie = globalState.sequenciaAtualTie;
      }
    }

    // Atualiza as maiores pontuações
    if (res.player > globalState.maiorPontuacaoPlayer) {
      globalState.maiorPontuacaoPlayer = res.player;
      console.log(`Nova maior pontuação de Player: ${globalState.maiorPontuacaoPlayer}`);
    }
    if (res.banker > globalState.maiorPontuacaoBanker) {
      globalState.maiorPontuacaoBanker = res.banker;
      console.log(`Nova maior pontuação de Banker: ${globalState.maiorPontuacaoBanker}`);
    }

    // Log detalhado do estado atual para depuração
    console.log(`--- ESTADO ATUAL ---`);
    const alertasAtivos = Object.values(this.estrategias)
      .map(e => `${e.nome}: ${e.alertaAtivo ? 'SIM' : 'NÃO'}`)
      .join(', ');
    console.log(`Alertas ativos: ${alertasAtivos}`);
    console.log(
      `Player: ${globalState.totalPlayer}, Banker: ${globalState.totalBanker}, Tie: ${globalState.totalTie}`
    );
    console.log(`Diferença atual: ${res.diferenca}`);
    console.log(`-------------------`);

    // Atualizar contadores do bloco atual
    const blocoAtual = globalState.historicoRodadas.blocoAtual;
    
    // Processar o resultado para cada estratégia ativa
    for (const estrategia of Object.values(this.estrategias)) {
      // Antes de processar o resultado, capturar os contadores atuais
      const contadoresAntes = {
        greensG0: estrategia.greensG0 || 0,
        greensG1: estrategia.greensG1 || 0,
        reds: estrategia.totalReds || 0,
        ties: estrategia.ties || 0
      };
      
      // Processar o resultado
      await estrategia.processarResultado(res);
      
      // Depois de processar, verificar o que mudou
      const nomeFormatado = this.formatarNomeEstrategia(estrategia.nome);
      
      // Verificar se o bloco atual tem entrada para esta estratégia
      if (!blocoAtual[nomeFormatado]) {
        blocoAtual[nomeFormatado] = { greensG0: 0, greensG1: 0, reds: 0, ties: 0 };
      }
      
      if ((estrategia.greensG0 || 0) > contadoresAntes.greensG0) {
        blocoAtual[nomeFormatado].greensG0++;
      }
      if ((estrategia.greensG1 || 0) > contadoresAntes.greensG1) {
        blocoAtual[nomeFormatado].greensG1++;
      }
      if ((estrategia.totalReds || 0) > contadoresAntes.reds) {
        blocoAtual[nomeFormatado].reds++;
      }
      if ((estrategia.ties || 0) > contadoresAntes.ties) {
        blocoAtual[nomeFormatado].ties++;
      }
    }

    // Verificar se completou um bloco de 50 rodadas
    if (globalState.contadorRodadas % 50 === 0) {
      // Adicionar bloco atual ao histórico
      const blocoCompleto = {
        inicio: blocoAtual.inicio,
        fim: globalState.contadorRodadas,
        sequencia: { ...blocoAtual.sequencia },
        aposempate: { ...blocoAtual.aposempate },
        alternancia: { ...blocoAtual.alternancia },
        proporcaodinamica: { ...blocoAtual.proporcaodinamica }
      };
      
      globalState.historicoRodadas.blocos.push(blocoCompleto);
      
      // Resetar bloco atual
      globalState.historicoRodadas.blocoAtual = {
        inicio: globalState.contadorRodadas,
        sequencia: { greensG0: 0, greensG1: 0, reds: 0, ties: 0 },
        aposempate: { greensG0: 0, greensG1: 0, reds: 0, ties: 0 },
        alternancia: { greensG0: 0, greensG1: 0, reds: 0, ties: 0 },
        proporcaodinamica: { greensG0: 0, greensG1: 0, reds: 0, ties: 0 }
      };
      
      // Enviar relatório do bloco atual
      await enviarRelatorioPorPeriodo(blocoCompleto);
    }
    
    // Enviar relatório de blocos a cada 200 rodadas
    if (globalState.contadorRodadas % 200 === 0) {
      await enviarRelatorioBlocosDe50Rodadas();
    }

    // Envia relatório estatístico a cada 50 rodadas
    if (globalState.contadorRodadas % 50 === 0) {
      await enviarRelatorioEstatistico(this.estrategias);
    }

    // Envia resumo a cada 100 rodadas
    if (globalState.contadorRodadas % 100 === 0) {
      await enviarResumo(this.estrategias);
    }

    // Envia relatório detalhado a cada 200 rodadas
    if (globalState.contadorRodadas % 200 === 0) {
      await enviarRelatorioDetalhado(this.estrategias);
    }
  }

  /**
   * Verifica mudança de dia e processa relatório diário se necessário
   */
  async verificarMudancaDeDia() {
    const dataAtual = new Date();
    const diaAtual = dataAtual.getDate();

    // Se o dia mudou
    if (diaAtual !== globalState.ultimoDiaVerificado) {
      console.log(`Dia mudou de ${globalState.ultimoDiaVerificado} para ${diaAtual}. Enviando relatório diário e reiniciando contadores.`);
      await enviarRelatorioDiarioEReiniciar(this.estrategias);
      globalState.ultimoDiaVerificado = diaAtual;
      
      // Também resetar o histórico de rodadas
      globalState.historicoRodadas = {
        blocos: [],
        blocoAtual: {
          inicio: 0,
          sequencia: { greensG0: 0, greensG1: 0, reds: 0, ties: 0 },
          aposempate: { greensG0: 0, greensG1: 0, reds: 0, ties: 0 },
          alternancia: { greensG0: 0, greensG1: 0, reds: 0, ties: 0 },
          proporcaodinamica: { greensG0: 0, greensG1: 0, reds: 0, ties: 0 }
        }
      };
    }
  }

  /**
   * Inicia o monitoramento
   * @param {number} intervalo - Intervalo em milissegundos entre as verificações
   */
  async iniciarMonitoramento(intervalo = 8000) {
    if (this.monitoramentoAtivo) {
      console.log('Monitoramento já está ativo.');
      return;
    }

    console.log('🎲 Bot do Bac Bo iniciado!');
    console.log('🔍 Monitorando resultados do Bac Bo...');

    // Inicializa cada estratégia
    for (const estrategia of Object.values(this.estrategias)) {
      await estrategia.enviarMensagemInicial();
    }

    // Mensagem geral de inicialização
    await enviarTelegram(
      "🎲 Bot do Bac Bo iniciado! Monitorando resultados e enviando relatórios gerais..."
    );

    // Espera 5 segundos antes da primeira execução
    console.log("Esperando 5 segundos antes da primeira execução...");
    await new Promise((resolve) => setTimeout(resolve, 5000));

    // Executa a primeira vez
    await this.executarCicloMonitoramento();

    // Define o intervalo para execuções subsequentes
    this.intervalId = setInterval(async () => {
      await this.executarCicloMonitoramento();
    }, intervalo);

    // Configura verificação de mudança de dia a cada minuto
    setInterval(async () => {
      await this.verificarMudancaDeDia();
    }, 60000);

    this.monitoramentoAtivo = true;
    console.log(`⏱️ Monitoramento iniciado com intervalo de ${intervalo}ms`);
  }

  /**
   * Executa um ciclo de monitoramento
   */
  async executarCicloMonitoramento() {
    try {
      const resultado = await getBacBoResultado(
        async () => await enviarRelatorioDiarioEReiniciar(this.estrategias),
        async (res) => await this.processarResultado(res)
      );
      
      // Se não houver resultado novo, não faz nada
      if (!resultado) {
        return;
      }
    } catch (error) {
      console.error('Erro durante ciclo de monitoramento:', error);
    }
  }

  /**
   * Para o monitoramento
   */
  pararMonitoramento() {
    if (!this.monitoramentoAtivo) {
      console.log('Monitoramento não está ativo.');
      return;
    }

    if (this.intervalId) {
      clearInterval(this.intervalId);
      this.intervalId = null;
    }

    this.monitoramentoAtivo = false;
    console.log('Monitoramento parado.');
  }
}

module.exports = BacBoApp;