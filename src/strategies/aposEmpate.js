// src/strategies/aposEmpate.js
const { enviarTelegram } = require('../utils/telegram');
const { globalState } = require('../../config/config');

/**
 * Classe que implementa a estratégia Após Empate
 */
class EstrategiaAposEmpate {
  constructor() {
    // Configuração da estratégia
    this.nome = "Após Empate";
    this.descricao = "Aposta no mesmo resultado que ocorreu antes do empate";
    
    // Estado da estratégia
    this.alertaAtivo = false;
    this.ultimoResultadoAntesTie = null;
    this.alvoAposEmpate = null;
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
   * Processa um novo resultado para a estratégia Após Empate
   * @param {Object} res - Objeto contendo o resultado a ser processado
   * @returns {Promise<void>}
   */
  async processarResultado(res) {
    // Se o resultado atual é um empate
    if (res.resultado === "tie") {
      // Caso 1: Se a estratégia já está ativa e recebemos outro empate, consideramos como Green
      if (this.alertaAtivo) {
        console.log(
          "Novo empate detectado com estratégia ativa. Contabilizando como Green, mas registrando como Tie!"
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
          `🟢 APÓS EMPATE: NOVO EMPATE [${res.player}-${
            res.banker
          }], ✅ Tie (Conta como Green!) [${
            this.vitoriaConsecutiva
          } VITÓRIA${
            this.vitoriaConsecutiva > 1 ? "S" : ""
          } CONSECUTIVA${this.vitoriaConsecutiva > 1 ? "S" : ""}]
📊 Após Empate: Greens: ${this.totalGreens} [G0=${
            this.greensG0
          } G1=${this.greensG1}] | Tie: ${this.ties} | Reds: ${
            this.totalReds
          }`,
          "aposEmpate"
        );

        // Registrar a vitória
        this.ultimaVitoria = {
          resultado: res.resultado,
          player: res.player,
          banker: res.banker,
          dataHora: new Date(),
        };

        // Mantemos a estratégia ativa com o mesmo alvo
        // Não resetamos o alerta para continuar monitorando após empates consecutivos
        return;
      }

      // Caso 2: Primeiro empate detectado, ativamos a estratégia
      console.log("Empate detectado, ativando estratégia de Após Empate");
      this.alertaAtivo = true;

      // Procurar no histórico o último resultado não-empate para ser o alvo
      let ultimoNaoEmpate = null;

      // Olha o histórico para encontrar o último resultado não-empate
      for (let i = 1; i < globalState.historico.length; i++) {
        if (globalState.historico[i]?.resultado !== "tie") {
          ultimoNaoEmpate = globalState.historico[i];
          break;
        }
      }

      if (ultimoNaoEmpate) {
        this.alvoAposEmpate = ultimoNaoEmpate.resultado;

        await enviarTelegram(
          `⚠️ ESTRATÉGIA APÓS EMPATE: Empate [${res.player}-${
            res.banker
          }] detectado!
🎯 Entrada sugerida: ${this.alvoAposEmpate.toUpperCase()} na próxima rodada (mesmo vencedor da rodada anterior ao empate)
📊 Stats: Greens: ${this.totalGreens} [G0=${
            this.greensG0
          } G1=${this.greensG1}] | Tie: ${this.ties} | Reds: ${
            this.totalReds
          }`,
          "aposEmpate"
        );

        console.log(
          `Alerta ativado após empate! Alvo: ${this.alvoAposEmpate}`
        );
      } else {
        // Se não encontrar um resultado não-empate no histórico, desativa o alerta
        this.alertaAtivo = false;
        console.log(
          "Não foi possível encontrar um vencedor anterior ao empate no histórico"
        );
      }
    }
    // Primeira rodada após detectar empate (G0)
    else if (
      this.alertaAtivo &&
      this.rodadaG0 === null
    ) {
      console.log(
        `Primeira rodada após empate (G0). Alvo: ${this.alvoAposEmpate}, Resultado: ${res.resultado}`
      );

      if (res.resultado === this.alvoAposEmpate) {
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
          `🟢 APÓS EMPATE: ${res.resultado.toUpperCase()} [${res.player}-${
            res.banker
          }], ✅ Green! Apostamos no mesmo vencedor antes do empate e acertamos! [${
            this.vitoriaConsecutiva
          } VITÓRIA${
            this.vitoriaConsecutiva > 1 ? "S" : ""
          } CONSECUTIVA${this.vitoriaConsecutiva > 1 ? "S" : ""}]
📊 Após Empate: Greens: ${this.totalGreens} [G0=${
            this.greensG0
          } G1=${this.greensG1}] | Tie: ${this.ties} | Reds: ${
            this.totalReds
          }`,
          "aposEmpate"
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
          `🔄 APÓS EMPATE: ${res.resultado.toUpperCase()} [${res.player}-${
            res.banker
          }], vamos para o G1. Esperávamos ${this.alvoAposEmpate.toUpperCase()}, mas veio ${res.resultado.toUpperCase()}`,
          "aposEmpate"
        );
        this.rodadaG0 = res;
      }
    }
    // Segunda rodada após detectar empate (G1)
    else if (this.alertaAtivo && this.rodadaG0) {
      console.log(
        `Segunda rodada após empate (G1). Alvo: ${this.alvoAposEmpate}, Resultado: ${res.resultado}`
      );

      if (res.resultado === this.alvoAposEmpate) {
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
          `🟢 APÓS EMPATE: ${res.resultado.toUpperCase()} [${res.player}-${
            res.banker
          }], ✅ Green no G1! Apostamos no mesmo vencedor antes do empate e acertamos! [${
            this.vitoriaConsecutiva
          } VITÓRIA${
            this.vitoriaConsecutiva > 1 ? "S" : ""
          } CONSECUTIVA${this.vitoriaConsecutiva > 1 ? "S" : ""}]
📊 Após Empate: Greens: ${this.totalGreens} [G0=${
            this.greensG0
          } G1=${this.greensG1}] | Tie: ${this.ties} | Reds: ${
            this.totalReds
          }`,
          "aposEmpate"
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
          `❌ APÓS EMPATE: ${res.resultado.toUpperCase()} [${res.player}-${
            res.banker
          }], ❌ Red! Esperávamos ${this.alvoAposEmpate.toUpperCase()}, mas veio ${res.resultado.toUpperCase()}
📊 Após Empate: Greens: ${this.totalGreens} [G0=${
            this.greensG0
          } G1=${this.greensG1}] | Tie: ${this.ties} | Reds: ${
            this.totalReds
          }`,
          "aposEmpate"
        );
        
        // Para aposEmpate, enviar para o grupo RED após 1 red
        if (this.redsConsecutivos >= 1) {
          await enviarTelegram(
            `⚠️ ALERTA DE RED - APÓS EMPATE ⚠️
❌ ${res.resultado.toUpperCase()} [${res.player}-${res.banker}]
❌ Esperávamos ${this.alvoAposEmpate.toUpperCase()}, mas veio ${res.resultado.toUpperCase()}
📊 Total: ${this.totalReds} reds vs ${this.totalGreens} greens
🔄 ${this.redsConsecutivos} RED(s) consecutivo(s)`,
            "aposEmpate",
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
  }

  /**
   * Reseta o alerta da estratégia
   */
  resetarAlerta() {
    console.log("Resetando alerta após empate");
    this.alertaAtivo = false;
    this.alvoAposEmpate = null;
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
      alvoAposEmpate: this.alvoAposEmpate,
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
      "🎲 Bot do Bac Bo iniciado! Monitorando estratégia APÓS EMPATE...",
      "aposEmpate"
    );
    console.log("Estratégia Após Empate inicializada!");
  }
}

module.exports = EstrategiaAposEmpate;