// src/strategies/sequencia.js
const { enviarTelegram } = require('../utils/telegram');
const { globalState } = require('../../config/config');

/**
 * Classe que implementa a estratégia de sequência
 */
class EstrategiaSequencia {
  constructor() {
    // Configuração da estratégia
    this.nome = "Sequência";
    this.descricao = "Detecta sequência de 4 resultados iguais e aposta na continuação";
    
    // Estado da estratégia
    this.alertaAtivo = false;
    this.sequenciaConsiderada = 4; // 4 resultados
    this.ultimosResultados = []; // Para rastrear os últimos resultados
    this.alvoProximaRodada = null; // "player" ou "banker"
    this.alvoAtual = null; // Para compatibilidade
    this.rodadaG0 = null;
    
    // Contadores
    this.totalGreens = 0;
    this.totalReds = 0;
    this.greensG0 = 0; // Contador para vitórias no G0
    this.greensG1 = 0; // Contador para vitórias no G1
    this.redsG1 = 0; // Contador para derrotas no G1
    this.ties = 0; // Contador para empates que contam como green
    this.ultimaVitoria = null;
    this.vitoriaConsecutiva = 0;
    this.maiorVitoriaConsecutiva = 0;
    
    // Contador para rastrear REDs consecutivos
    this.redsConsecutivos = 0;
  }

  /**
   * Processa um novo resultado para a estratégia de sequência
   * @param {Object} res - Objeto contendo o resultado a ser processado
   * @returns {Promise<void>}
   */
  async processarResultado(res) {
    // Verificar se o resultado é um empate e se já temos um alerta ativo
    if (res.resultado === "tie" && this.alertaAtivo) {
      // Se for um empate quando temos um alerta ativo, consideramos como vitória
      console.log(
        "Empate detectado durante alerta ativo. Contabilizando como Green para estratégia de sequência, mas registrando como Tie"
      );

      // Incrementa contador de ties em vez de greens, mas mantém lógica de vitória
      this.ties++;
      this.vitoriaConsecutiva++;
      
      // Reset contador de REDs consecutivos ao ter um Green
      this.redsConsecutivos = 0;

      // Atualiza o contador de maior sequência de vitórias
      if (this.vitoriaConsecutiva > this.maiorVitoriaConsecutiva) {
        this.maiorVitoriaConsecutiva = this.vitoriaConsecutiva;
      }

      await enviarTelegram(
        `🟢 SEQUÊNCIA: TIE/EMPATE [${res.player}-${
          res.banker
        }], ✅ Tie (Conta como Green!) para estratégia de sequência! [${
          this.vitoriaConsecutiva
        } VITÓRIA${
          this.vitoriaConsecutiva > 1 ? "S" : ""
        } CONSECUTIVA${this.vitoriaConsecutiva > 1 ? "S" : ""}]
📊 Sequência: Greens: ${this.totalGreens} [G0=${
          this.greensG0
        } G1=${this.greensG1}] | Tie: ${this.ties} | Reds: ${
          this.totalReds
        }`,
        "sequencia"
      );

      // Registrar a vitória
      this.ultimaVitoria = {
        resultado: res.resultado,
        player: res.player,
        banker: res.banker,
        dataHora: new Date(),
      };

      // Resetar alerta
      this.resetarAlerta();
      return;
    }
    // Ignorar empates para análise de sequência e detecção
    else if (res.resultado === "tie") {
      console.log("Ignorando empate para análise de estratégia de sequência");
      return;
    }

    // Logs de depuração
    console.log(`Estado atual da estratégia de sequência:`);
    console.log(`- Alerta ativo: ${this.alertaAtivo}`);
    console.log(`- sequenciaConsiderada: ${this.sequenciaConsiderada}`);
    console.log(`- Total no histórico: ${globalState.historico.length}`);

    // Debug para verificar o estado atual
    const resultadosSemEmpate = globalState.historico.filter(
      (item) => item.resultado !== "tie"
    );
    console.log(
      `Estado para análise de sequência: ${resultadosSemEmpate
        .slice(0, 6)
        .map((r) => (r.resultado === "player" ? "P" : "B"))
        .join("")}`
    );

    // Primeira rodada após detectar padrão (G0)
    if (
      this.alertaAtivo &&
      this.alvoAtual &&
      this.rodadaG0 === null
    ) {
      console.log(
        `Alerta ativo para sequência, primeira tentativa (G0). Alvo: ${this.alvoAtual}`
      );

      if (res.resultado === this.alvoAtual) {
        this.totalGreens++;
        this.greensG0++; // Incrementa contador de G0
        this.vitoriaConsecutiva++;
        
        // Reset contador de REDs consecutivos ao ter um Green
        this.redsConsecutivos = 0;

        // Atualiza o contador de maior sequência de vitórias
        if (this.vitoriaConsecutiva > this.maiorVitoriaConsecutiva) {
          this.maiorVitoriaConsecutiva = this.vitoriaConsecutiva;
        }

        await enviarTelegram(
          `🟢 SEQUÊNCIA: ${res.resultado.toUpperCase()} [${res.player}-${
            res.banker
          }], ✅ Green para estratégia de sequência! [${
            this.vitoriaConsecutiva
          } VITÓRIA${
            this.vitoriaConsecutiva > 1 ? "S" : ""
          } CONSECUTIVA${this.vitoriaConsecutiva > 1 ? "S" : ""}]
📊 Sequência: Greens: ${this.totalGreens} [G0=${
            this.greensG0
          } G1=${this.greensG1}] | Tie: ${this.ties} | Reds: ${
            this.totalReds
          }`,
          "sequencia"
        );

        // Registrar a vitória
        this.ultimaVitoria = {
          resultado: res.resultado,
          player: res.player,
          banker: res.banker,
          dataHora: new Date(),
        };

        // Resetar alerta
        this.resetarAlerta();
      } else {
        await enviarTelegram(
          `🔄 SEQUÊNCIA: ${res.resultado.toUpperCase()} [${res.player}-${
            res.banker
          }], vamos para o G1 na estratégia de sequência...`,
          "sequencia"
        );
        this.rodadaG0 = res;
      }
    }
    // Segunda rodada após detectar padrão (G1)
    else if (
      this.alertaAtivo &&
      this.alvoAtual &&
      this.rodadaG0
    ) {
      console.log("Processando G1 para estratégia de sequência");

      if (res.resultado === this.alvoAtual) {
        this.totalGreens++;
        this.greensG1++; // Incrementa contador de G1
        this.vitoriaConsecutiva++;
        
        // Reset contador de REDs consecutivos ao ter um Green
        this.redsConsecutivos = 0;

        // Atualiza o contador de maior sequência de vitórias
        if (this.vitoriaConsecutiva > this.maiorVitoriaConsecutiva) {
          this.maiorVitoriaConsecutiva = this.vitoriaConsecutiva;
        }

        await enviarTelegram(
          `🟢 SEQUÊNCIA: ${res.resultado.toUpperCase()} [${res.player}-${
            res.banker
          }], ✅ Green no G1 para estratégia de sequência! [${
            this.vitoriaConsecutiva
          } VITÓRIA${
            this.vitoriaConsecutiva > 1 ? "S" : ""
          } CONSECUTIVA${this.vitoriaConsecutiva > 1 ? "S" : ""}]
📊 Sequência: Greens: ${this.totalGreens} [G0=${
            this.greensG0
          } G1=${this.greensG1}] | Tie: ${this.ties} | Reds: ${
            this.totalReds
          }`,
          "sequencia"
        );

        // Registrar a vitória
        this.ultimaVitoria = {
          resultado: res.resultado,
          player: res.player,
          banker: res.banker,
          dataHora: new Date(),
        };

        // Resetar alerta
        this.resetarAlerta();
      } else {
        // Incrementar o contador de REDs consecutivos
        this.redsConsecutivos++;
        this.totalReds++;
        this.redsG1++; // Incrementa contador de Reds no G1
        this.vitoriaConsecutiva = 0;

        await enviarTelegram(
          `❌ SEQUÊNCIA: ${res.resultado.toUpperCase()} [${res.player}-${
            res.banker
          }], ❌ Red na estratégia de sequência
📊 Sequência: Greens: ${this.totalGreens} [G0=${
            this.greensG0
          } G1=${this.greensG1}] | Tie: ${this.ties} | Reds: ${
            this.totalReds
          }`,
          "sequencia"
        );
        
        // Para sequência, enviar para o grupo RED após 2 reds consecutivos
        if (this.redsConsecutivos >= 2) {
          await enviarTelegram(
            `⚠️ ALERTA DE SEQUÊNCIA DE REDS - ESTRATÉGIA SEQUÊNCIA ⚠️
❌ ${res.resultado.toUpperCase()} [${res.player}-${res.banker}]
❌ Esperávamos ${this.alvoAtual.toUpperCase()}, mas veio ${res.resultado.toUpperCase()}
📊 Total: ${this.totalReds} reds vs ${this.totalGreens} greens
🔄 ${this.redsConsecutivos} REDs consecutivos - FIQUE ATENTO!`,
            "sequencia",
            true // indicador que é para o grupo RED
          );
        }

        // Registrar a derrota
        this.ultimaVitoria = {
          resultado: res.resultado,
          player: res.player,
          banker: res.banker,
          dataHora: new Date(),
        };

        // Resetar alerta
        this.resetarAlerta();
      }
    }
    // Análise normal do histórico para detecção de sequências
    else if (
      !this.alertaAtivo &&
      globalState.historico.length >= this.sequenciaConsiderada
    ) {
      // Verificamos os últimos N resultados, ignorando empates
      const resultadosSemEmpate = globalState.historico.filter(
        (item) => item.resultado !== "tie"
      );

      if (resultadosSemEmpate.length >= this.sequenciaConsiderada) {
        // Verifica se os resultados são todos iguais
        const primeirosResultados = resultadosSemEmpate.slice(
          0,
          this.sequenciaConsiderada
        );

        // Debug para verificar exatamente o que estamos checando
        const sequenciaStr = primeirosResultados
          .map((r) => (r.resultado === "player" ? "P" : "B"))
          .join("");
        console.log(`Verificando sequência: ${sequenciaStr}`);

        const primeiroResultado = primeirosResultados[0].resultado;
        const todosIguais = primeirosResultados.every(
          (item) => item.resultado === primeiroResultado
        );

        console.log(`Todos iguais a ${primeiroResultado}? ${todosIguais}`);

        if (todosIguais) {
          console.log("**** SEQUÊNCIA DE 4 DETECTADA! ****");
          this.alertaAtivo = true;
          // Define o alvo como o MESMO da sequência detectada
          this.alvoAtual = primeiroResultado;
          this.alvoProximaRodada = this.alvoAtual; // Para compatibilidade

          await enviarTelegram(
            `⚠️ ESTRATÉGIA DE SEQUÊNCIA: ${
              this.sequenciaConsiderada
            }x ${primeiroResultado.toUpperCase()} seguidos!
🎯 Entrada sugerida: ${this.alvoAtual.toUpperCase()} na próxima rodada!
📊 Stats: Greens: ${this.totalGreens} [G0=${
              this.greensG0
            } G1=${this.greensG1}] | Tie: ${this.ties} | Reds: ${
              this.totalReds
            }`,
            "sequencia"
          );

          console.log(
            `Alerta ativado para sequência! Alvo: ${this.alvoAtual}`
          );
        }
      }
    }
  }

  /**
   * Reseta o alerta da estratégia
   */
  resetarAlerta() {
    console.log("Resetando alerta de sequência");
    this.alertaAtivo = false;
    this.alvoAtual = null;
    this.alvoProximaRodada = null;
    this.rodadaG0 = null;
    // Não reseta redsConsecutivos pois queremos contar entre alertas diferentes
  }

  /**
   * Reinicia os contadores da estratégia (usado em mudanças de dia)
   */
  resetarContadores() {
    this.totalGreens = 0;
    this.totalReds = 0;
    this.greensG0 = 0;
    this.greensG1 = 0;
    this.redsG1 = 0;
    this.ties = 0; // Resetar contador de ties
    this.vitoriaConsecutiva = 0;
    this.redsConsecutivos = 0; // Resetar contador de REDs consecutivos
    // Não resetamos a maior sequência de vitórias
    // this.maiorVitoriaConsecutiva = 0;
  }

  /**
   * Retorna o status atual da estratégia
   * @returns {Object} Estado atual da estratégia
   */
  getStatus() {
    return {
      nome: this.nome,
      alertaAtivo: this.alertaAtivo,
      alvoAtual: this.alvoAtual,
      alvoProximaRodada: this.alvoProximaRodada,
      rodadaG0: this.rodadaG0,
      totalGreens: this.totalGreens,
      totalReds: this.totalReds,
      greensG0: this.greensG0,
      greensG1: this.greensG1,
      redsG1: this.redsG1,
      ties: this.ties, // Incluir ties no status
      vitoriaConsecutiva: this.vitoriaConsecutiva,
      maiorVitoriaConsecutiva: this.maiorVitoriaConsecutiva,
      redsConsecutivos: this.redsConsecutivos // Adicionar contador de REDs consecutivos
    };
  }

  /**
   * Envia mensagem de inicialização para o Telegram
   */
  async enviarMensagemInicial() {
    await enviarTelegram(
      "🎲 Bot do Bac Bo iniciado! Monitorando estratégia de SEQUÊNCIA (4 iguais)...",
      "sequencia"
    );
    console.log("Estratégia de Sequência inicializada!");
  }
}

module.exports = EstrategiaSequencia;