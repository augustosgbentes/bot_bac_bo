// src/services/reporter.js
const { enviarTelegram } = require("../utils/telegram");
const { calcularTaxaDeSucesso } = require("../utils/helpers");
const { globalState, resetContadores } = require("../../config/config");

/**
 * Envia relatório estatístico com taxas de G0/G1 para cada estratégia
 * @param {Object} estrategias - Objeto contendo todas as estratégias ativas
 */
async function enviarRelatorioEstatistico(estrategias) {
  // Calcular taxas de sucesso para cada estratégia
  const taxaG0Sequencia = calcularTaxaDeSucesso(
    estrategias.sequencia.greensG0,
    estrategias.sequencia.greensG0 + (estrategias.sequencia.rodadaG0 ? 1 : 0)
  );

  const taxaG1Sequencia = calcularTaxaDeSucesso(
    estrategias.sequencia.greensG1,
    estrategias.sequencia.greensG1 + estrategias.sequencia.redsG1
  );

  const taxaG0AposEmpate = calcularTaxaDeSucesso(
    estrategias.aposempate.greensG0,
    estrategias.aposempate.greensG0 + (estrategias.aposempate.rodadaG0 ? 1 : 0)
  );

  const taxaG1AposEmpate = calcularTaxaDeSucesso(
    estrategias.aposempate.greensG1,
    estrategias.aposempate.greensG1 + estrategias.aposempate.redsG1
  );

  const taxaG0Alternancia = calcularTaxaDeSucesso(
    estrategias.alternancia.greensG0,
    estrategias.alternancia.greensG0 +
      (estrategias.alternancia.rodadaG0 ? 1 : 0)
  );

  const taxaG1Alternancia = calcularTaxaDeSucesso(
    estrategias.alternancia.greensG1,
    estrategias.alternancia.greensG1 + estrategias.alternancia.redsG1
  );

  const taxaG0Proporcao = calcularTaxaDeSucesso(
    estrategias.proporcaodinamica.greensG0,
    estrategias.proporcaodinamica.greensG0 +
      (estrategias.proporcaodinamica.rodadaG0 ? 1 : 0)
  );

  const taxaG1Proporcao = calcularTaxaDeSucesso(
    estrategias.proporcaodinamica.greensG1,
    estrategias.proporcaodinamica.greensG1 +
      estrategias.proporcaodinamica.redsG1
  );

  // Calcular taxa total de sucesso para cada estratégia
  const taxaTotalSequencia = calcularTaxaDeSucesso(
    estrategias.sequencia.totalGreens,
    estrategias.sequencia.totalGreens + estrategias.sequencia.totalReds
  );

  const taxaTotalAposEmpate = calcularTaxaDeSucesso(
    estrategias.aposempate.totalGreens,
    estrategias.aposempate.totalGreens + estrategias.aposempate.totalReds
  );

  const taxaTotalAlternancia = calcularTaxaDeSucesso(
    estrategias.alternancia.totalGreens,
    estrategias.alternancia.totalGreens + estrategias.alternancia.totalReds
  );

  const taxaTotalProporcao = calcularTaxaDeSucesso(
    estrategias.proporcaodinamica.totalGreens,
    estrategias.proporcaodinamica.totalGreens +
      estrategias.proporcaodinamica.totalReds
  );

  // Criar array para ranking
  const estrategiasRanking = [
    { nome: "Sequência", taxa: taxaTotalSequencia },
    { nome: "Após Empate", taxa: taxaTotalAposEmpate },
    { nome: "Alternância", taxa: taxaTotalAlternancia },
    { nome: "Proporção", taxa: taxaTotalProporcao },
  ];

  // Ordenar por taxa de sucesso (maior para menor)
  estrategiasRanking.sort((a, b) => b.taxa - a.taxa);

  // Enviar relatório detalhado
  await enviarTelegram(
    `📊 RELATÓRIO ESTATÍSTICO G0/G1 - RODADA #${globalState.contadorRodadas} 📊

🏆 RANKING DE ESTRATÉGIAS (taxa total de sucesso):
1. ${estrategiasRanking[0].nome}: ${estrategiasRanking[0].taxa}% de acerto
2. ${estrategiasRanking[1].nome}: ${estrategiasRanking[1].taxa}% de acerto
3. ${estrategiasRanking[2].nome}: ${estrategiasRanking[2].taxa}% de acerto
4. ${estrategiasRanking[3].nome}: ${estrategiasRanking[3].taxa}% de acerto

🎲 SEQUÊNCIA:
▶️ Total: ${estrategias.sequencia.totalGreens} greens / ${
      estrategias.sequencia.totalReds
    } reds (${taxaTotalSequencia}% acerto)
▶️ G0: ${estrategias.sequencia.greensG0} greens
▶️ G1: ${estrategias.sequencia.greensG1} greens
▶️ Tie: ${estrategias.sequencia.ties || 0} (contados como green)

🎲 APÓS EMPATE:
▶️ Total: ${estrategias.aposempate.totalGreens} greens / ${
      estrategias.aposempate.totalReds
    } reds (${taxaTotalAposEmpate}% acerto)
▶️ G0: ${estrategias.aposempate.greensG0} greens 
▶️ G1: ${estrategias.aposempate.greensG1} greens
▶️ Tie: ${estrategias.aposempate.ties || 0} (contados como green)

🎲 ALTERNÂNCIA:
▶️ Total: ${estrategias.alternancia.totalGreens} greens / ${
      estrategias.alternancia.totalReds
    } reds (${taxaTotalAlternancia}% acerto)
▶️ G0: ${estrategias.alternancia.greensG0} greens 
▶️ G1: ${estrategias.alternancia.greensG1} greens
▶️ Tie: ${estrategias.alternancia.ties || 0} (contados como green)

🎲 PROPORÇÃO DINÂMICA:
▶️ Total: ${estrategias.proporcaodinamica.totalGreens} greens / ${
      estrategias.proporcaodinamica.totalReds
    } reds (${taxaTotalProporcao}% acerto)
▶️ G0: ${estrategias.proporcaodinamica.greensG0} greens 
▶️ G1: ${estrategias.proporcaodinamica.greensG1} greens
▶️ Tie: ${estrategias.proporcaodinamica.ties || 0} (contados como green)

📊 Métricas gerais:
📌 Total de rodadas: ${globalState.contadorRodadas}
📌 Player: ${globalState.totalPlayer} (${Math.round(
      (globalState.totalPlayer / globalState.contadorRodadas) * 100
    )}%)
📌 Banker: ${globalState.totalBanker} (${Math.round(
      (globalState.totalBanker / globalState.contadorRodadas) * 100
    )}%)
📌 Tie: ${globalState.totalTie} (${Math.round(
      (globalState.totalTie / globalState.contadorRodadas) * 100
    )}%)
🎯 Maior pontuação Player: ${globalState.maiorPontuacaoPlayer}
🎯 Maior pontuação Banker: ${globalState.maiorPontuacaoBanker}
🔢 Maior sequência Player: ${globalState.maiorSequenciaPlayer}
🔢 Maior sequência Banker: ${globalState.maiorSequenciaBanker}
🔢 Maior sequência Tie: ${globalState.maiorSequenciaTie}`,
    "geral"
  );
}

/**
 * Envia resumo das estatísticas
 * @param {Object} estrategias - Objeto contendo todas as estratégias ativas
 */
async function enviarResumo(estrategias) {
  // Resumo específico para o grupo de Sequência
  await enviarTelegram(
    `📊 RESUMO PARCIAL - SEQUÊNCIA (últimas ${
      globalState.contadorRodadas
    } rodadas):
✅ Greens: ${estrategias.sequencia.totalGreens} [G0=${
      estrategias.sequencia.greensG0
    } G1=${estrategias.sequencia.greensG1}] | Tie: ${estrategias.sequencia.ties || 0} | Reds: ${
      estrategias.sequencia.totalReds
    }
🔄 Maior sequência de vitórias: ${estrategias.sequencia.maiorVitoriaConsecutiva}
${
  estrategias.sequencia.vitoriaConsecutiva > 0
    ? "🔥 Sequência atual: " +
      estrategias.sequencia.vitoriaConsecutiva +
      " vitória(s) consecutiva(s)"
    : ""
}
🔢 Maior sequência Player: ${globalState.maiorSequenciaPlayer}
🔢 Maior sequência Banker: ${globalState.maiorSequenciaBanker}`,
    "sequencia"
  );

  // Resumo específico para o grupo de Após Empate
  await enviarTelegram(
    `📊 RESUMO PARCIAL - APÓS EMPATE (últimas ${
      globalState.contadorRodadas
    } rodadas):
✅ Greens: ${estrategias.aposempate.totalGreens} [G0=${
      estrategias.aposempate.greensG0
    } G1=${estrategias.aposempate.greensG1}] | Tie: ${estrategias.aposempate.ties || 0} | Reds: ${
      estrategias.aposempate.totalReds
    }
🔄 Maior sequência de vitórias: ${
      estrategias.aposempate.maiorVitoriaConsecutiva
    }
${
  estrategias.aposempate.vitoriaConsecutiva > 0
    ? "🔥 Sequência atual: " +
      estrategias.aposempate.vitoriaConsecutiva +
      " vitória(s) consecutiva(s)"
    : ""
}
🎲 Total de Ties: ${globalState.totalTie} (${Math.round(
      (globalState.totalTie / globalState.contadorRodadas) * 100
    )}%)
🔢 Maior sequência Tie: ${globalState.maiorSequenciaTie}`,
    "aposEmpate"
  );

  // Resumo específico para o grupo de Alternância
  await enviarTelegram(
    `📊 RESUMO PARCIAL - ALTERNÂNCIA (últimas ${
      globalState.contadorRodadas
    } rodadas):
✅ Greens: ${estrategias.alternancia.totalGreens} [G0=${
      estrategias.alternancia.greensG0
    } G1=${estrategias.alternancia.greensG1}] | Tie: ${estrategias.alternancia.ties || 0} | Reds: ${
      estrategias.alternancia.totalReds
    }
🔄 Maior sequência de vitórias: ${
      estrategias.alternancia.maiorVitoriaConsecutiva
    }
${
  estrategias.alternancia.vitoriaConsecutiva > 0
    ? "🔥 Sequência atual: " +
      estrategias.alternancia.vitoriaConsecutiva +
      " vitória(s) consecutiva(s)"
    : ""
}
✅ PLAYER: ${globalState.totalPlayer} (${Math.round(
      (globalState.totalPlayer / globalState.contadorRodadas) * 100
    )}%)
✅ BANKER: ${globalState.totalBanker} (${Math.round(
      (globalState.totalBanker / globalState.contadorRodadas) * 100
    )}%)`,
    "alternancia"
  );

  // Resumo específico para o grupo de Proporção Dinâmica
  await enviarTelegram(
    `📊 RESUMO PARCIAL - PROPORÇÃO DINÂMICA (últimas ${
      globalState.contadorRodadas
    } rodadas):
✅ Greens: ${estrategias.proporcaodinamica.totalGreens} [G0=${
      estrategias.proporcaodinamica.greensG0
    } G1=${estrategias.proporcaodinamica.greensG1}] | Tie: ${estrategias.proporcaodinamica.ties || 0} | Reds: ${
      estrategias.proporcaodinamica.totalReds
    }
🔄 Maior sequência de vitórias: ${
      estrategias.proporcaodinamica.maiorVitoriaConsecutiva
    }
${
  estrategias.proporcaodinamica.vitoriaConsecutiva > 0
    ? "🔥 Sequência atual: " +
      estrategias.proporcaodinamica.vitoriaConsecutiva +
      " vitória(s) consecutiva(s)"
    : ""
}
✅ PLAYER: ${globalState.totalPlayer} (${Math.round(
      (globalState.totalPlayer / globalState.contadorRodadas) * 100
    )}%)
✅ BANKER: ${globalState.totalBanker} (${Math.round(
      (globalState.totalBanker / globalState.contadorRodadas) * 100
    )}%)`,
    "proporcao"
  );
}

/**
 * Envia relatório diário e reinicia contadores
 * @param {Object} estrategias - Objeto contendo todas as estratégias ativas
 */
async function enviarRelatorioDiarioEReiniciar(estrategias) {
  const hoje = new Date();
  const dataFormatada = hoje.toLocaleDateString("pt-BR", {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
  });

  // Relatório completo para o grupo principal
  await enviarTelegram(`📅 RELATÓRIO FINAL DO DIA - ${dataFormatada}

🎲 RESUMO DAS ÚLTIMAS 24 HORAS:
✅ PLAYER: ${globalState.totalPlayer} (${Math.round(
    (globalState.totalPlayer / globalState.contadorRodadas) * 100
  )}%)
✅ BANKER: ${globalState.totalBanker} (${Math.round(
    (globalState.totalBanker / globalState.contadorRodadas) * 100
  )}%)
✅ TIE: ${globalState.totalTie} (${Math.round(
    (globalState.totalTie / globalState.contadorRodadas) * 100
  )}%)

💯 TAXA DE APROVEITAMENTO DAS ESTRATÉGIAS:
🎯 Sequência: ${Math.round(
    (estrategias.sequencia.totalGreens /
      (estrategias.sequencia.totalGreens + estrategias.sequencia.totalReds ||
        1)) *
      100
  )}% (Ties: ${estrategias.sequencia.ties || 0})
🎯 Após Empate: ${Math.round(
    (estrategias.aposempate.totalGreens /
      (estrategias.aposempate.totalGreens + estrategias.aposempate.totalReds ||
        1)) *
      100
  )}% (Ties: ${estrategias.aposempate.ties || 0})
🎯 Alternância: ${Math.round(
    (estrategias.alternancia.totalGreens /
      (estrategias.alternancia.totalGreens +
        estrategias.alternancia.totalReds || 1)) *
      100
  )}% (Ties: ${estrategias.alternancia.ties || 0})
🎯 Proporção: ${Math.round(
    (estrategias.proporcaodinamica.totalGreens /
      (estrategias.proporcaodinamica.totalGreens +
        estrategias.proporcaodinamica.totalReds || 1)) *
      100
  )}% (Ties: ${estrategias.proporcaodinamica.ties || 0})

🎯 Maior pontuação Player: ${globalState.maiorPontuacaoPlayer}
🎯 Maior pontuação Banker: ${globalState.maiorPontuacaoBanker}
🔢 Maior sequência Player: ${globalState.maiorSequenciaPlayer}
🔢 Maior sequência Banker: ${globalState.maiorSequenciaBanker}
🔢 Maior sequência Tie: ${globalState.maiorSequenciaTie}

📈 Total de rodadas analisadas: ${globalState.contadorRodadas}

🔄 Contadores reiniciados para o novo dia.
📱 Bot continua monitorando 24/7 - Boas apostas!`);

  // Reinicia todos os contadores para o novo dia
  resetContadores();

  // Reinicia contadores específicos de cada estratégia
  estrategias.sequencia.resetarContadores();
  estrategias.aposempate.resetarContadores();
  estrategias.alternancia.resetarContadores();
  estrategias.proporcaodinamica.resetarContadores();

  console.log("Contadores reiniciados para o novo dia.");
}

/**
 * Envia relatório específico para o período de 50 rodadas
 * @param {Object} bloco - Objeto com os dados do bloco de 50 rodadas
 */
async function enviarRelatorioPorPeriodo(bloco) {
  // Enviar relatório para cada estratégia em seu canal específico
  
  // Relatório para estratégia de Sequência
  await enviarTelegram(
    `📊 RELATÓRIO DAS ÚLTIMAS 50 RODADAS (${bloco.inicio+1} - ${bloco.fim})
    
✅ Resultados neste período:
   Greens: ${bloco.sequencia.greensG0 + bloco.sequencia.greensG1} [G0=${bloco.sequencia.greensG0} G1=${bloco.sequencia.greensG1}] 
   Tie: ${bloco.sequencia.ties || 0} (contados como green)
   Reds: ${bloco.sequencia.reds}
   
💯 Taxa de acerto neste período: ${calcularTaxaDeSucesso(
      bloco.sequencia.greensG0 + bloco.sequencia.greensG1 + (bloco.sequencia.ties || 0),
      bloco.sequencia.greensG0 + bloco.sequencia.greensG1 + (bloco.sequencia.ties || 0) + bloco.sequencia.reds
    )}%`,
    "sequencia"
  );
  
  // Relatório para estratégia Após Empate
  await enviarTelegram(
    `📊 RELATÓRIO DAS ÚLTIMAS 50 RODADAS (${bloco.inicio+1} - ${bloco.fim})
    
✅ Resultados neste período:
   Greens: ${bloco.aposempate.greensG0 + bloco.aposempate.greensG1} [G0=${bloco.aposempate.greensG0} G1=${bloco.aposempate.greensG1}] 
   Tie: ${bloco.aposempate.ties || 0} (contados como green)
   Reds: ${bloco.aposempate.reds}
   
💯 Taxa de acerto neste período: ${calcularTaxaDeSucesso(
      bloco.aposempate.greensG0 + bloco.aposempate.greensG1 + (bloco.aposempate.ties || 0),
      bloco.aposempate.greensG0 + bloco.aposempate.greensG1 + (bloco.aposempate.ties || 0) + bloco.aposempate.reds
    )}%`,
    "aposEmpate"
  );
  
  // Relatório para estratégia de Alternância
  await enviarTelegram(
    `📊 RELATÓRIO DAS ÚLTIMAS 50 RODADAS (${bloco.inicio+1} - ${bloco.fim})
    
✅ Resultados neste período:
   Greens: ${bloco.alternancia.greensG0 + bloco.alternancia.greensG1} [G0=${bloco.alternancia.greensG0} G1=${bloco.alternancia.greensG1}] 
   Tie: ${bloco.alternancia.ties || 0} (contados como green)
   Reds: ${bloco.alternancia.reds}
   
💯 Taxa de acerto neste período: ${calcularTaxaDeSucesso(
      bloco.alternancia.greensG0 + bloco.alternancia.greensG1 + (bloco.alternancia.ties || 0),
      bloco.alternancia.greensG0 + bloco.alternancia.greensG1 + (bloco.alternancia.ties || 0) + bloco.alternancia.reds
    )}%`,
    "alternancia"
  );
  
  // Relatório para estratégia de Proporção Dinâmica
  await enviarTelegram(
    `📊 RELATÓRIO DAS ÚLTIMAS 50 RODADAS (${bloco.inicio+1} - ${bloco.fim})
    
✅ Resultados neste período:
   Greens: ${bloco.proporcaodinamica.greensG0 + bloco.proporcaodinamica.greensG1} [G0=${bloco.proporcaodinamica.greensG0} G1=${bloco.proporcaodinamica.greensG1}] 
   Tie: ${bloco.proporcaodinamica.ties || 0} (contados como green)
   Reds: ${bloco.proporcaodinamica.reds}
   
💯 Taxa de acerto neste período: ${calcularTaxaDeSucesso(
      bloco.proporcaodinamica.greensG0 + bloco.proporcaodinamica.greensG1 + (bloco.proporcaodinamica.ties || 0),
      bloco.proporcaodinamica.greensG0 + bloco.proporcaodinamica.greensG1 + (bloco.proporcaodinamica.ties || 0) + bloco.proporcaodinamica.reds
    )}%`,
    "proporcao"
  );
  
  // Também enviar um resumo geral para o canal principal
  await enviarTelegram(
    `📊 RELATÓRIO DAS ÚLTIMAS 50 RODADAS (${bloco.inicio+1} - ${bloco.fim})
    
🎲 SEQUÊNCIA: ${bloco.sequencia.greensG0 + bloco.sequencia.greensG1} greens / ${bloco.sequencia.reds} reds / ${bloco.sequencia.ties || 0} ties (${calcularTaxaDeSucesso(
      bloco.sequencia.greensG0 + bloco.sequencia.greensG1 + (bloco.sequencia.ties || 0),
      bloco.sequencia.greensG0 + bloco.sequencia.greensG1 + (bloco.sequencia.ties || 0) + bloco.sequencia.reds
    )}%)

🎲 APÓS EMPATE: ${bloco.aposempate.greensG0 + bloco.aposempate.greensG1} greens / ${bloco.aposempate.reds} reds / ${bloco.aposempate.ties || 0} ties (${calcularTaxaDeSucesso(
      bloco.aposempate.greensG0 + bloco.aposempate.greensG1 + (bloco.aposempate.ties || 0),
      bloco.aposempate.greensG0 + bloco.aposempate.greensG1 + (bloco.aposempate.ties || 0) + bloco.aposempate.reds
    )}%)

🎲 ALTERNÂNCIA: ${bloco.alternancia.greensG0 + bloco.alternancia.greensG1} greens / ${bloco.alternancia.reds} reds / ${bloco.alternancia.ties || 0} ties (${calcularTaxaDeSucesso(
      bloco.alternancia.greensG0 + bloco.alternancia.greensG1 + (bloco.alternancia.ties || 0),
      bloco.alternancia.greensG0 + bloco.alternancia.greensG1 + (bloco.alternancia.ties || 0) + bloco.alternancia.reds
    )}%)

🎲 PROPORÇÃO: ${bloco.proporcaodinamica.greensG0 + bloco.proporcaodinamica.greensG1} greens / ${bloco.proporcaodinamica.reds} reds / ${bloco.proporcaodinamica.ties || 0} ties (${calcularTaxaDeSucesso(
      bloco.proporcaodinamica.greensG0 + bloco.proporcaodinamica.greensG1 + (bloco.proporcaodinamica.ties || 0),
      bloco.proporcaodinamica.greensG0 + bloco.proporcaodinamica.greensG1 + (bloco.proporcaodinamica.ties || 0) + bloco.proporcaodinamica.reds
    )}%)`,
    "geral"
  );
}

/**
 * Envia relatório com o histórico dos últimos 4 blocos de 50 rodadas (a cada 200 rodadas)
 */
async function enviarRelatorioBlocosDe50Rodadas() {
  if (!globalState.historicoRodadas || !globalState.historicoRodadas.blocos) {
    console.log("Não há blocos para gerar o relatório histórico.");
    return;
  }
  
  // Pegar os últimos 4 blocos (ou menos, se não houver 4)
  const blocos = globalState.historicoRodadas.blocos.slice(-4);
  
  if (blocos.length === 0) {
    console.log("Não há blocos suficientes para gerar relatório.");
    return;
  }
  
  // Formatar mensagem para cada estratégia
  const formatarMensagemEstrategia = (nomeEstrategia, estrategiaKey) => {
    let mensagem = `📊 RELATÓRIO DOS ÚLTIMOS ${blocos.length} BLOCOS DE 50 RODADAS - ${nomeEstrategia.toUpperCase()}\n\n`;
    
    blocos.forEach((bloco, index) => {
      const dadosEstrategia = bloco[estrategiaKey] || { greensG0: 0, greensG1: 0, reds: 0, ties: 0 };
      const totalGreens = dadosEstrategia.greensG0 + dadosEstrategia.greensG1;
      const totalTies = dadosEstrategia.ties || 0;
      const taxaAcerto = calcularTaxaDeSucesso(
        totalGreens + totalTies,
        totalGreens + totalTies + dadosEstrategia.reds
      );
      
      mensagem += `🔹 Bloco ${index+1} (Rodadas ${bloco.inicio+1}-${bloco.fim}):\n`;
      mensagem += `   Greens: ${totalGreens} [G0=${dadosEstrategia.greensG0} G1=${dadosEstrategia.greensG1}]\n`;
      mensagem += `   Tie: ${totalTies} (contados como green)\n`;
      mensagem += `   Reds: ${dadosEstrategia.reds}\n`;
      mensagem += `   Taxa: ${taxaAcerto}%\n\n`;
    });
    
    // Adicionar resumo total
    const totalGreensG0 = blocos.reduce((sum, bloco) => sum + ((bloco[estrategiaKey] || {}).greensG0 || 0), 0);
    const totalGreensG1 = blocos.reduce((sum, bloco) => sum + ((bloco[estrategiaKey] || {}).greensG1 || 0), 0);
    const totalTies = blocos.reduce((sum, bloco) => sum + ((bloco[estrategiaKey] || {}).ties || 0), 0);
    const totalReds = blocos.reduce((sum, bloco) => sum + ((bloco[estrategiaKey] || {}).reds || 0), 0);
    const taxaTotal = calcularTaxaDeSucesso(
      totalGreensG0 + totalGreensG1 + totalTies,
      totalGreensG0 + totalGreensG1 + totalTies + totalReds
    );
    
    mensagem += `📈 TOTAIS NAS ÚLTIMAS ${blocos.length * 50} RODADAS:\n`;
    mensagem += `   Greens: ${totalGreensG0 + totalGreensG1} [G0=${totalGreensG0} G1=${totalGreensG1}]\n`;
    mensagem += `   Tie: ${totalTies} (contados como green)\n`;
    mensagem += `   Reds: ${totalReds}\n`;
    mensagem += `   Taxa total: ${taxaTotal}%`;
    
    return mensagem;
  };
  
  // Enviar relatório para cada estratégia
  await enviarTelegram(formatarMensagemEstrategia("Sequência", "sequencia"), "sequencia");
  await enviarTelegram(formatarMensagemEstrategia("Após Empate", "aposempate"), "aposEmpate");
  await enviarTelegram(formatarMensagemEstrategia("Alternância", "alternancia"), "alternancia");
  await enviarTelegram(formatarMensagemEstrategia("Proporção Dinâmica", "proporcaodinamica"), "proporcao");
  
  // Enviar relatório geral resumido
  let mensagemGeral = `📊 RELATÓRIO DOS ÚLTIMOS ${blocos.length} BLOCOS DE 50 RODADAS\n\n`;
  
  const estrategias = [
    { nome: "SEQUÊNCIA", key: "sequencia" },
    { nome: "APÓS EMPATE", key: "aposempate" },
    { nome: "ALTERNÂNCIA", key: "alternancia" },
    { nome: "PROPORÇÃO", key: "proporcaodinamica" }
  ];
  
  estrategias.forEach(estrategia => {
    const totalGreensG0 = blocos.reduce((sum, bloco) => sum + ((bloco[estrategia.key] || {}).greensG0 || 0), 0);
    const totalGreensG1 = blocos.reduce((sum, bloco) => sum + ((bloco[estrategia.key] || {}).greensG1 || 0), 0);
    const totalTies = blocos.reduce((sum, bloco) => sum + ((bloco[estrategia.key] || {}).ties || 0), 0);
    const totalReds = blocos.reduce((sum, bloco) => sum + ((bloco[estrategia.key] || {}).reds || 0), 0);
    const taxaTotal = calcularTaxaDeSucesso(
      totalGreensG0 + totalGreensG1 + totalTies,
      totalGreensG0 + totalGreensG1 + totalTies + totalReds
    );
    
    mensagemGeral += `🎲 ${estrategia.nome}: ${totalGreensG0 + totalGreensG1} greens / ${totalReds} reds / ${totalTies} ties (${taxaTotal}%)\n`;
  });
  
  await enviarTelegram(mensagemGeral, "geral");
}

module.exports = {
  enviarRelatorioEstatistico,
  enviarResumo,
  enviarRelatorioDiarioEReiniciar,
  enviarRelatorioPorPeriodo,
  enviarRelatorioBlocosDe50Rodadas
};