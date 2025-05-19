// src/strategies/alternancia.js
const { enviarTelegram } = require('../utils/telegram');
const { globalState } = require('../../config/config');

/**
 * Classe que implementa a estratégia de Alternância
 */
class EstrategiaAlternancia {
  constructor() {
    // Configuração da estratégia
    this.nome = "Alternância";
    this.descricao = "Detecta padrões de alternância como PBPB e aposta na continuação";
    
    // Estado da estratégia
    this.alertaAtivo = false;
    this.padrao = []; // Padrão detectado
    this.proximoResultadoEsperado = null;
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
   * Processa um novo resultado para a estratégia de Alternância
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
        `🟢 ALTERNÂNCIA: TIE/EMPATE [${res.player}-${
          res.banker
        }], ✅ Tie (Conta como Green!) para estratégia de alternância! [${
          this.vitoriaConsecutiva
        } VITÓRIA${
          this.vitoriaConsecutiva > 1 ? "S" : ""
        } CONSECUTIVA${this.vitoriaConsecutiva > 1 ? "S" : ""}]
📊 Alternância: Greens: ${this.totalGreens} [G0=${
          this.greensG0
        } G1=${this.greensG1}] | Tie: ${this.ties} | Reds: ${
          this.totalReds
        }`,
        "alternancia"
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
      console.log("Ignorando empate para estratégia de alternância");
      return;
    }

    // Primeira rodada após detectar padrão (G0)
    if (
      this.alertaAtivo &&
      this.proximoResultadoEsperado &&
      this.rodadaG0 === null
    ) {
      console.log(
        `Alerta ativo para alternância, primeira tentativa (G0). Próximo esperado: ${this.proximoResultadoEsperado}`
      );

      if (res.resultado === this.proximoResultadoEsperado) {
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
          `🟢 ALTERNÂNCIA: ${res.resultado.toUpperCase()} [${res.player}-${
            res.banker
          }], ✅ Green para estratégia de alternância! [${
            this.vitoriaConsecutiva
          } VITÓRIA${
            this.vitoriaConsecutiva > 1 ? "S" : ""
          } CONSECUTIVA${this.vitoriaConsecutiva > 1 ? "S" : ""}]
📊 Alternância: Greens: ${this.totalGreens} [G0=${
            this.greensG0
          } G1=${this.greensG1}] | Tie: ${this.ties} | Reds: ${
            this.totalReds
          }`,
          "alternancia"
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
          `🔄 ALTERNÂNCIA: ${res.resultado.toUpperCase()} [${res.player}-${
            res.banker
          }], vamos para o G1 na estratégia de alternância...`,
          "alternancia"
        );
        this.rodadaG0 = res;
      }
    }
    // Segunda rodada após detectar padrão (G1)
    else if (
      this.alertaAtivo &&
      this.proximoResultadoEsperado &&
      this.rodadaG0
    ) {
      console.log("Processando G1 para estratégia de alternância");

      // No G1, apostamos no oposto do último resultado
      const proximoEsperadoG1 =
        this.rodadaG0.resultado === "player"
          ? "banker"
          : "player";

      if (res.resultado === proximoEsperadoG1) {
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
          `🟢 ALTERNÂNCIA: ${res.resultado.toUpperCase()} [${res.player}-${
            res.banker
          }], ✅ Green no G1 para estratégia de alternância! [${
            this.vitoriaConsecutiva
          } VITÓRIA${
            this.vitoriaConsecutiva > 1 ? "S" : ""
          } CONSECUTIVA${this.vitoriaConsecutiva > 1 ? "S" : ""}]
📊 Alternância: Greens: ${this.totalGreens} [G0=${
            this.greensG0
          } G1=${this.greensG1}] | Tie: ${this.ties} | Reds: ${
            this.totalReds
          }`,
          "alternancia"
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
          `❌ ALTERNÂNCIA: ${res.resultado.toUpperCase()} [${res.player}-${
            res.banker
          }], ❌ Red na estratégia de alternância
📊 Alternância: Greens: ${this.totalGreens} [G0=${
            this.greensG0
          } G1=${this.greensG1}] | Tie: ${this.ties} | Reds: ${
            this.totalReds
          }`,
          "alternancia"
        );
        
        // Para alternância, enviar para o grupo RED após 2 reds consecutivos
        if (this.redsConsecutivos >= 2) {
          await enviarTelegram(
            `⚠️ ALERTA DE SEQUÊNCIA DE REDS - ALTERNÂNCIA ⚠️
❌ ${res.resultado.toUpperCase()} [${res.player}-${res.banker}]
❌ Esperávamos ${proximoEsperadoG1.toUpperCase()}, mas veio ${res.resultado.toUpperCase()}
📊 Total: ${this.totalReds} reds vs ${this.totalGreens} greens
🔄 ${this.redsConsecutivos} REDs consecutivos - FIQUE ATENTO!`,
            "alternancia",
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
    // Análise normal do histórico para detecção de alternância
    else if (!this.alertaAtivo && globalState.historico.length >= 4) {
      // Filtra apenas resultados Player e Banker (sem empates)
      const resultadosFiltrados = globalState.historico
        .filter((item) => item.resultado !== "tie")
        .slice(0, 4);

      if (resultadosFiltrados.length >= 4) {
        // Verifica se há um padrão de alternância (PBPB ou BPBP)
        const ehAlternancia =
          resultadosFiltrados[0].resultado !== resultadosFiltrados[1].resultado &&
          resultadosFiltrados[1].resultado !== resultadosFiltrados[2].resultado &&
          resultadosFiltrados[2].resultado !== resultadosFiltrados[3].resultado &&
          resultadosFiltrados[0].resultado === resultadosFiltrados[2].resultado &&
          resultadosFiltrados[1].resultado === resultadosFiltrados[3].resultado;

        if (ehAlternancia) {
          this.alertaAtivo = true;
          this.padrao = [
            resultadosFiltrados[3].resultado,
            resultadosFiltrados[2].resultado,
            resultadosFiltrados[1].resultado,
            resultadosFiltrados[0].resultado,
          ];

          // O próximo esperado deve ser igual ao último detectado
          this.proximoResultadoEsperado =
            resultadosFiltrados[0].resultado === "player" ? "banker" : "player";

          await enviarTelegram(
            `⚠️ ESTRATÉGIA DE ALTERNÂNCIA: Padrão de alternância detectado!
🔄 Últimos resultados: ${resultadosFiltrados
              .map((r) => r.resultado.toUpperCase().charAt(0))
              .join("")}
🎯 Entrada sugerida: ${this.proximoResultadoEsperado.toUpperCase()} na próxima rodada!
📊 Stats: Greens: ${this.totalGreens} [G0=${
              this.greensG0
            } G1=${this.greensG1}] | Tie: ${this.ties} | Reds: ${
              this.totalReds
            }`,
            "alternancia"
          );

          console.log(
            `Alerta ativado para alternância! Próximo esperado: ${this.proximoResultadoEsperado}`
          );
        }
      }
    }
  }

  /**
   * Reseta o alerta da estratégia
   */
  resetarAlerta() {
    console.log("Resetando alerta de alternância");
    this.alertaAtivo = false;
    this.padrao = [];
    this.proximoResultadoEsperado = null;
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
      padrao: this.padrao,
      proximoResultadoEsperado: this.proximoResultadoEsperado,
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
      "🎲 Bot do Bac Bo iniciado! Monitorando estratégia de ALTERNÂNCIA...",
      "alternancia"
    );
    console.log("Estratégia de Alternância inicializada!");
  }
}

module.exports = EstrategiaAlternancia;