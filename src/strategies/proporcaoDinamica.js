// src/strategies/proporcaoDinamica.js
const { enviarTelegram } = require('../utils/telegram');
const { globalState } = require('../../config/config');

/**
 * Classe que implementa a estratégia de Proporção Dinâmica
 */
class EstrategiaProporcaoDinamica {
  constructor() {
    // Configuração da estratégia
    this.nome = "Proporção Dinâmica";
    this.descricao = "Detecta desbalanceamento na proporção de resultados e aposta na reversão à média";
    
    // Estado da estratégia
    this.alertaAtivo = false;
    this.windowSize = 20; // Tamanho da janela para análise (últimos 20 resultados)
    this.limiteDesbalanceamento = 65; // Percentual que indica desbalanceamento (65% significa 65:35)
    this.alvoProximaRodada = null;
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
   * Processa um novo resultado para a estratégia de Proporção Dinâmica
   * @param {Object} res - Objeto contendo o resultado a ser processado
   * @returns {Promise<void>}
   */
  async processarResultado(res) {
    // Se for empate e o alerta estiver ativo
    if (res.resultado === "tie" && this.alertaAtivo) {
      console.log("Empate detectado com alerta ativo. Contabilizando como Green, mas registrando como Tie!");
      
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
        `🟢 PROPORÇÃO: TIE/EMPATE [${res.player}-${
          res.banker
        }], ✅ Tie (Conta como Green!) para estratégia de Proporção Dinâmica! [${
          this.vitoriaConsecutiva
        } VITÓRIA${
          this.vitoriaConsecutiva > 1 ? "S" : ""
        } CONSECUTIVA${this.vitoriaConsecutiva > 1 ? "S" : ""}]
📊 Proporção: Greens: ${this.totalGreens} [G0=${
          this.greensG0
        } G1=${this.greensG1}] | Tie: ${this.ties} | Reds: ${
          this.totalReds
        }`,
        "proporcao"
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
    // Ignorar empates para esta estratégia (caso não tenha alerta ativo)
    else if (res.resultado === "tie") {
      console.log("Ignorando empate para estratégia de Proporção Dinâmica");
      return;
    }

    // Primeira rodada após detectar desbalanceamento (G0)
    if (
      this.alertaAtivo &&
      this.alvoProximaRodada &&
      this.rodadaG0 === null
    ) {
      console.log(
        `Alerta ativo para Proporção Dinâmica, primeira tentativa (G0). Alvo: ${this.alvoProximaRodada}`
      );

      if (res.resultado === this.alvoProximaRodada) {
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
          `🟢 PROPORÇÃO: ${res.resultado.toUpperCase()} [${res.player}-${
            res.banker
          }], ✅ Green para estratégia de Proporção Dinâmica! [${
            this.vitoriaConsecutiva
          } VITÓRIA${
            this.vitoriaConsecutiva > 1 ? "S" : ""
          } CONSECUTIVA${
            this.vitoriaConsecutiva > 1 ? "S" : ""
          }]
📊 Proporção: Greens: ${this.totalGreens} [G0=${
            this.greensG0
          } G1=${this.greensG1}] | Tie: ${this.ties} | Reds: ${
            this.totalReds
          }`,
          "proporcao"
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
          `🔄 PROPORÇÃO: ${res.resultado.toUpperCase()} [${res.player}-${
            res.banker
          }], vamos para o G1 na estratégia de Proporção Dinâmica...`,
          "proporcao"
        );
        this.rodadaG0 = res;
      }
    }
    // Segunda rodada após detectar desbalanceamento (G1)
    else if (
      this.alertaAtivo &&
      this.alvoProximaRodada &&
      this.rodadaG0
    ) {
      console.log("Processando G1 para estratégia de Proporção Dinâmica");

      if (res.resultado === this.alvoProximaRodada) {
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
          `🟢 PROPORÇÃO: ${res.resultado.toUpperCase()} [${res.player}-${
            res.banker
          }], ✅ Green no G1 para estratégia de Proporção Dinâmica! [${
            this.vitoriaConsecutiva
          } VITÓRIA${
            this.vitoriaConsecutiva > 1 ? "S" : ""
          } CONSECUTIVA${
            this.vitoriaConsecutiva > 1 ? "S" : ""
          }]
📊 Proporção: Greens: ${this.totalGreens} [G0=${
            this.greensG0
          } G1=${this.greensG1}] | Tie: ${this.ties} | Reds: ${
            this.totalReds
          }`,
          "proporcao"
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
          `❌ PROPORÇÃO: ${res.resultado.toUpperCase()} [${res.player}-${
            res.banker
          }], ❌ Red na estratégia de Proporção Dinâmica
📊 Proporção: Greens: ${this.totalGreens} [G0=${
            this.greensG0
          } G1=${this.greensG1}] | Tie: ${this.ties} | Reds: ${
            this.totalReds
          }`,
          "proporcao"
        );
        
        // Para proporção, enviar para o grupo RED após 2 reds consecutivos
        if (this.redsConsecutivos >= 2) {
          await enviarTelegram(
            `⚠️ ALERTA DE SEQUÊNCIA DE REDS - PROPORÇÃO DINÂMICA ⚠️
❌ ${res.resultado.toUpperCase()} [${res.player}-${res.banker}]
❌ Esperávamos ${this.alvoProximaRodada.toUpperCase()}, mas veio ${res.resultado.toUpperCase()}
📊 Total: ${this.totalReds} reds vs ${this.totalGreens} greens
🔄 ${this.redsConsecutivos} REDs consecutivos - FIQUE ATENTO!`,
            "proporcao",
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
    // Análise normal do histórico para detecção de desbalanceamento na proporção
    else if (
      !this.alertaAtivo &&
      globalState.historico.length >= this.windowSize
    ) {
      // Verificamos os últimos N resultados, ignorando empates
      const resultadosSemEmpate = globalState.historico
        .filter((item) => item.resultado !== "tie")
        .slice(0, this.windowSize);

      // Se temos resultados suficientes após filtrar empates
      if (resultadosSemEmpate.length >= 10) {
        // Pelo menos 10 resultados para análise
        const totalResultados = resultadosSemEmpate.length;
        const totalPlayer = resultadosSemEmpate.filter(
          (item) => item.resultado === "player"
        ).length;
        const totalBanker = resultadosSemEmpate.filter(
          (item) => item.resultado === "banker"
        ).length;

        // Calculamos as porcentagens
        const percentualPlayer = (totalPlayer / totalResultados) * 100;
        const percentualBanker = (totalBanker / totalResultados) * 100;

        console.log(
          `Proporção atual: Player ${percentualPlayer.toFixed(
            1
          )}% vs Banker ${percentualBanker.toFixed(1)}%`
        );

        // Verificamos se há desbalanceamento significativo
        if (
          percentualPlayer >= this.limiteDesbalanceamento ||
          percentualBanker >= this.limiteDesbalanceamento
        ) {
          // Se há desbalanceamento, apostamos no resultado menos frequente
          this.alertaAtivo = true;

          // O alvo é o resultado menos frequente
          this.alvoProximaRodada =
            percentualPlayer > percentualBanker ? "banker" : "player";

          // Formatamos a mensagem de alerta
          const maiorPercentual = Math.max(
            percentualPlayer,
            percentualBanker
          ).toFixed(1);
          const menorPercentual = Math.min(
            percentualPlayer,
            percentualBanker
          ).toFixed(1);
          const maiorResultado =
            percentualPlayer > percentualBanker ? "PLAYER" : "BANKER";
          const menorResultado =
            percentualPlayer > percentualBanker ? "BANKER" : "PLAYER";

          await enviarTelegram(
            `⚠️ ESTRATÉGIA DE PROPORÇÃO DINÂMICA: Desbalanceamento detectado!
📊 Últimos ${totalResultados} resultados: ${maiorResultado} ${maiorPercentual}% vs ${menorResultado} ${menorPercentual}%
🎯 Entrada sugerida: ${this.alvoProximaRodada.toUpperCase()} na próxima rodada!
📊 Stats: Greens: ${this.totalGreens} [G0=${
              this.greensG0
            } G1=${this.greensG1}] | Tie: ${this.ties} | Reds: ${
              this.totalReds
            }`,
            "proporcao"
          );

          console.log(
            `Alerta ativado para Proporção Dinâmica! Alvo: ${this.alvoProximaRodada}`
          );
        }
      }
    }
  }

  /**
   * Reseta o alerta da estratégia
   */
  resetarAlerta() {
    console.log("Resetando alerta de Proporção Dinâmica");
    this.alertaAtivo = false;
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
      "🎲 Bot do Bac Bo iniciado! Monitorando estratégia de PROPORÇÃO DINÂMICA...",
      "proporcao"
    );
    console.log("Estratégia de Proporção Dinâmica inicializada!");
  }
}

module.exports = EstrategiaProporcaoDinamica;