// src/utils/browser.js
const puppeteer = require('puppeteer');
const { browserConfig } = require('../../config/config');

let browser = null;
let page = null;
let ultimaReinicializacaoNavegador = Date.now();

/**
 * Inicializa ou recupera o navegador
 * @returns {Promise<Object>} Um objeto contendo o browser e a page
 */
async function getBrowserInstance() {
  const tempoAtual = Date.now();
  
  // Verificar se é hora de reiniciar o navegador
  if (tempoAtual - ultimaReinicializacaoNavegador > browserConfig.intervalDeReinicializacao) {
    console.log(
      `Reinicializando navegador após ${Math.round(
        (tempoAtual - ultimaReinicializacaoNavegador) / 60000
      )} minutos de execução`
    );

    // Fechar navegador existente se estiver aberto
    await closeBrowser();

    // Atualizar timestamp de reinicialização
    ultimaReinicializacaoNavegador = tempoAtual;
  }

  // Inicializar o navegador apenas uma vez
  if (!browser) {
    console.log("Iniciando navegador...");

    const options = browserConfig.puppeteerOptions;

    // Verifica se o caminho foi especificado nas variáveis de ambiente
    if (process.env.CHROME_PATH) {
      console.log(
        `Usando caminho do Chrome especificado nas variáveis de ambiente: ${process.env.CHROME_PATH}`
      );
      options.executablePath = process.env.CHROME_PATH;
    }

    try {
      browser = await puppeteer.launch(options);
      console.log("Navegador iniciado com sucesso!");

      console.log("Abrindo nova página...");
      page = await browser.newPage();

      // Configurando o User-Agent para parecer um navegador normal
      await page.setUserAgent(
        "Mozilla/5.0 (X11; Linux x86_64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/96.0.4664.110 Safari/537.36"
      );

      // Otimizações adicionais para ambiente VPS
      await page.setRequestInterception(true);
      page.on("request", (request) => {
        // Bloquear recursos desnecessários para economizar largura de banda e CPU
        const blockedResourceTypes = ["image", "media", "font", "stylesheet"];
        if (
          blockedResourceTypes.includes(request.resourceType()) &&
          !request.url().includes("tipminer.com") // só bloqueia recursos de terceiros
        ) {
          request.abort();
        } else {
          request.continue();
        }
      });
    } catch (error) {
      console.error(`Erro ao iniciar o navegador: ${error.message}`);
      console.error("Tentando alternativas para executar o Chrome...");

      // Tente localizar o Chrome usando comando do sistema
      const { execSync } = require("child_process");
      try {
        // Tenta vários possíveis caminhos do Chrome/Chromium no Linux
        let chromePath = "";
        try {
          chromePath = execSync("which google-chrome").toString().trim();
        } catch (e) {
          try {
            chromePath = execSync("which chromium-browser").toString().trim();
          } catch (e) {
            try {
              chromePath = execSync("which chromium").toString().trim();
            } catch (e) {
              throw new Error(
                "Nenhum executável do Chrome/Chromium encontrado."
              );
            }
          }
        }

        console.log(
          `Chrome/Chromium encontrado no sistema em: ${chromePath}`
        );
        options.executablePath = chromePath;
        browser = await puppeteer.launch(options);
        console.log("Navegador iniciado após usar localização alternativa!");
      } catch (fallbackError) {
        console.error(
          `Erro após tentativa alternativa: ${fallbackError.message}`
        );
        throw new Error(
          "Não foi possível iniciar o navegador após tentativas alternativas."
        );
      }
    }
  }

  // Verificar se page está definido
  if (!page) {
    console.error("A página não foi inicializada. Tentando reabrir...");
    try {
      page = await browser.newPage();
      await page.setUserAgent(
        "Mozilla/5.0 (X11; Linux x86_64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/96.0.4664.110 Safari/537.36"
      );
    } catch (error) {
      console.error(`Erro ao criar nova página: ${error.message}`);
      // Força reinicialização do browser na próxima chamada
      browser = null;
      return { browser: null, page: null };
    }
  }

  return { browser, page };
}

/**
 * Fecha o navegador e a página atual
 */
async function closeBrowser() {
  if (browser) {
    try {
      if (page)
        await page
          .close()
          .catch((e) => console.error("Erro ao fechar página:", e));
      await browser
        .close()
        .catch((e) => console.error("Erro ao fechar navegador:", e));
    } catch (closeErr) {
      console.error("Erro ao fechar navegador:", closeErr.message);
    }
    page = null;
    browser = null;
  }
}

// Gerenciamento do encerramento
process.on("SIGINT", async () => {
  console.log("Encerrando bot graciosamente...");
  await closeBrowser();
  process.exit(0);
});

process.on("SIGTERM", async () => {
  console.log("Recebido sinal de término...");
  await closeBrowser();
  process.exit(0);
});

module.exports = {
  getBrowserInstance,
  closeBrowser
};