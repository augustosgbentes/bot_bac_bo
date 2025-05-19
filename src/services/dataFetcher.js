// src/services/dataFetcher.js
const { getBrowserInstance } = require('../utils/browser');
const { monitorConfig, globalState } = require('../../config/config');
const { verificarMudancaDeDia } = require('../utils/helpers');

/**
 * Busca e processa os resultados do Bac Bo do site tipminer.com
 * @param {Function} enviarRelatorioDiarioEReiniciar - Callback para relatório diário
 * @param {Function} processarResultado - Callback para processar resultados
 * @returns {Promise<Object|null>} O último resultado processado ou null em caso de erro
 */
async function getBacBoResultado(enviarRelatorioDiarioEReiniciar, processarResultado) {
  try {
    console.log("Buscando resultados do Bac Bo no tipminer...");

    // Obter instância do navegador
    const { browser, page } = await getBrowserInstance();
    
    if (!browser || !page) {
      console.error("Navegador não disponível. Tentando novamente na próxima execução.");
      return null;
    }

    // Verificar mudança de dia a cada execução
    const { ultimoDiaVerificado, houveMudanca } = verificarMudancaDeDia(
      enviarRelatorioDiarioEReiniciar, 
      globalState.ultimoDiaVerificado
    );
    
    if (houveMudanca) {
      globalState.ultimoDiaVerificado = ultimoDiaVerificado;
    }

    try {
      // Navegar para o site com tentativas máximas de recuperação
      let tentativas = 0;
      const MAX_TENTATIVAS = 3;
      let navegacaoSucesso = false;

      while (!navegacaoSucesso && tentativas < MAX_TENTATIVAS) {
        try {
          tentativas++;
          console.log(
            `Tentativa ${tentativas}/${MAX_TENTATIVAS} - Navegando para tipminer.com/br/historico/blaze/bac-bo-ao-vivo...`
          );

          const resposta = await page.goto(monitorConfig.urlBacBo, {
            waitUntil: "networkidle2",
            timeout: 45000, // reduzindo para 45 segundos
          });

          // Verificando se a resposta foi bem-sucedida (código 200)
          if (resposta && resposta.status() === 200) {
            navegacaoSucesso = true;
            console.log("Página carregada com sucesso.");
          } else {
            console.log(
              `Resposta não ideal: ${resposta ? resposta.status() : "null"}`
            );
            // Pequena espera antes da próxima tentativa
            await new Promise((r) => setTimeout(r, 3000));
          }
        } catch (navErr) {
          console.error(`Erro na tentativa ${tentativas}: ${navErr.message}`);
          // Espera entre tentativas
          await new Promise((r) => setTimeout(r, 3000));
        }
      }

      if (!navegacaoSucesso) {
        console.error(
          "Todas as tentativas de navegação falharam. Forçando reinício do navegador."
        );
        return null;
      }
    } catch (navigationError) {
      console.error(`Erro ao navegar: ${navigationError.message}`);
      console.log("Tentando continuar mesmo com erro de navegação...");
      // Tentar recuperar de erros de navegação
      await new Promise((r) => setTimeout(r, 5000)); // Espera 5 segundos antes de continuar
    }

    // Esperar um tempo adicional para garantir que a página carregue completamente
    await new Promise((resolve) => setTimeout(resolve, 2000));

    console.log("Verificando se os elementos de resultados existem na página...");

    // Verifica se os elementos de resultado existem antes de tentar extraí-los
    let tentativasSeletor = 0;
    const MAX_TENTATIVAS_SELETOR = 3;
    let seletorEncontrado = false;

    while (!seletorEncontrado && tentativasSeletor < MAX_TENTATIVAS_SELETOR) {
      tentativasSeletor++;
      try {
        const seletorExiste = await page.evaluate(() => {
          return !!document.querySelector(".grid__row.flex");
        });

        if (seletorExiste) {
          seletorEncontrado = true;
          console.log(`Seletor encontrado na tentativa ${tentativasSeletor}.`);
        } else {
          console.log(
            `Tentativa ${tentativasSeletor}/${MAX_TENTATIVAS_SELETOR} - Seletor não encontrado. Esperando...`
          );
          // Espera adicional e rola a página para garantir carregamento
          await page.evaluate(() => window.scrollBy(0, 100));
          await new Promise((r) => setTimeout(r, 2000));
        }
      } catch (selectorErr) {
        console.error(
          `Erro ao verificar seletor (tentativa ${tentativasSeletor}): ${selectorErr.message}`
        );
        await new Promise((r) => setTimeout(r, 2000));
      }
    }

    if (!seletorEncontrado) {
      console.error(
        "Seletor '.grid__row.flex' não encontrado na página após múltiplas tentativas."
      );
      return null; // Sair da função para tentar novamente na próxima execução
    }

    console.log("Seletor encontrado, extraindo resultados...");

    // Extraindo os resultados do Bac Bo da nova estrutura HTML
    const resultados = await page
      .evaluate(() => {
        try {
          const items = [];

          // Seleciona todos os botões de célula na grid row
          const celulas = document.querySelectorAll(
            ".grid__row.flex button.cell"
          );

          if (!celulas || celulas.length === 0) {
            console.error("Células de resultado não encontradas na página");
            return [];
          }

          // Processamos cada célula de resultado
          Array.from(celulas).forEach((celula, index) => {
            try {
              // Determina o tipo de resultado (player/banker/tie)
              let resultado = null;
              if (celula.classList.contains("cell--type-player")) {
                resultado = "player";
              } else if (celula.classList.contains("cell--type-banker")) {
                resultado = "banker";
              } else if (celula.classList.contains("cell--type-tie")) {
                resultado = "tie";
              } else {
                return; // Ignora se não for um tipo conhecido
              }

              // Obtém a pontuação do resultado
              const resultadoText = celula
                .querySelector(".cell__result")
                ?.textContent.trim();
              const pontuacao = parseInt(resultadoText || "0", 10);

              // Define pontuações do player e banker com base no resultado
              let playerScore = 0;
              let bankerScore = 0;

              if (resultado === "player") {
                playerScore = pontuacao;
                bankerScore = pontuacao - 2; // Estimativa, já que o player sempre ganha com pontuação maior
              } else if (resultado === "banker") {
                bankerScore = pontuacao;
                playerScore = pontuacao - 2; // Estimativa, já que o banker sempre ganha com pontuação maior
              } else if (resultado === "tie") {
                // Em caso de empate, as pontuações são iguais
                playerScore = pontuacao;
                bankerScore = pontuacao;
              }

              // Calcula a diferença entre as pontuações
              const diferenca = Math.abs(playerScore - bankerScore);

              // Adiciona ao array de resultados
              items.push({
                player: playerScore,
                banker: bankerScore,
                resultado: resultado,
                diferenca: diferenca,
                indice: index,
                resultadoString: resultado.substring(0, 1).toUpperCase(),
              });
            } catch (celError) {
              console.error(
                "Erro ao processar célula de resultado:",
                celError.message
              );
            }
          });

          // Retorna a lista de resultados em ordem (mais recente primeiro)
          return items;
        } catch (evalError) {
          console.error("Erro durante execução no browser:", evalError.message);
          return [];
        }
      })
      .catch((error) => {
        console.error("Erro ao executar evaluate:", error.message);
        return [];
      });

    console.log(`Extraídos ${resultados.length} resultados.`);

    // Se não existirem resultados, sai da função
    if (!resultados || resultados.length === 0) {
      console.log("Nenhum resultado foi encontrado.");
      return null;
    }

    // Vamos construir o histórico de resultados (mais recente primeiro)
    const ultimoResultado = resultados[0];

    // Verifica se o último resultado é diferente do último processado
    if (
      !globalState.ultimoResultadoProcessado ||
      ultimoResultado.resultado !== globalState.ultimoResultadoProcessado.resultado ||
      ultimoResultado.player !== globalState.ultimoResultadoProcessado.player ||
      ultimoResultado.banker !== globalState.ultimoResultadoProcessado.banker
    ) {
      console.log("Novo resultado detectado! Processando...");

      // Atualiza o último resultado processado
      globalState.ultimoResultadoProcessado = ultimoResultado;

      // Adiciona o resultado ao histórico
      globalState.historico.unshift(ultimoResultado);

      // Limita o tamanho do histórico a 50 resultados
      if (globalState.historico.length > 50) {
        globalState.historico = globalState.historico.slice(0, 50);
      }

      // Processa o novo resultado para as estratégias
      if (typeof processarResultado === 'function') {
        await processarResultado(ultimoResultado);
      }
      
      return ultimoResultado;
    } else {
      console.log("Nenhum resultado novo desde a última verificação.");
      return null;
    }
  } catch (err) {
    console.error("Erro ao capturar resultado:", err.message);
    console.error("Stack trace:", err.stack);

    // Se ocorrer um erro grave com o navegador, fechamos e reiniciamos na próxima execução
    if (
      err.message.includes("Protocol error") ||
      err.message.includes("Target closed") ||
      err.message.includes("Session closed") ||
      err.message.includes("Browser was not found") ||
      err.message.includes("WebSocket") ||
      err.message.includes("failed to connect") ||
      err.message.includes("connection closed") ||
      err.message.includes("Cannot read properties of null") ||
      err.message.includes("detached") ||
      err.message.includes("Attempted to use detached Frame")
    ) {
      console.error("Erro de conexão com o navegador, reiniciando na próxima execução...");
      return null;
    }
    return null;
  }
}

module.exports = {
  getBacBoResultado
};