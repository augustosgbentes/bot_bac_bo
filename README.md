# Bot de Estratégias Bac Bo

Bot para monitorar e gerar alertas para estratégias do jogo Bac Bo. O bot analisa padrões e envia alertas pelo Telegram quando detecta oportunidades de aposta.

## Estrutura do Projeto

```
/bacbo-bot/
├── package.json          # Configuração de dependências 
├── .env                  # Configurações (tokens Telegram, etc)
├── config/
│   └── config.js         # Configurações centralizadas
├── src/
│   ├── utils/            # Utilitários
│   │   ├── telegram.js   # Utilidades para envio de mensagens
│   │   ├── browser.js    # Gerenciamento do navegador
│   │   └── helpers.js    # Funções auxiliares
│   ├── strategies/       # Estratégias
│   │   ├── sequencia.js  # Estratégia de Sequência
│   │   ├── aposEmpate.js # Estratégia Após Empate
│   │   ├── alternancia.js # Estratégia de Alternância
│   │   └── proporcaoDinamica.js # Estratégia de Proporção
│   ├── services/
│   │   ├── dataFetcher.js # Serviço para buscar dados
│   │   └── reporter.js    # Serviço para relatórios
│   ├── app.js            # Classe principal da aplicação
│   └── server.js         # Servidor web Express
└── runners/              # Scripts para execução
    ├── runAll.js         # Executa todas as estratégias
    ├── runSequencia.js   # Executa apenas Sequência
    ├── runAposEmpate.js  # Executa apenas Após Empate
    ├── runAlternancia.js # Executa apenas Alternância
    └── runProporcao.js   # Executa apenas Proporção
```

## Estratégias Implementadas

1. **Sequência**: Detecta sequência de 4 resultados iguais e aposta na continuação
2. **Após Empate**: Aposta no mesmo resultado que ocorreu antes do empate
3. **Alternância**: Detecta padrões de alternância (ex: PBPB) e aposta na continuação
4. **Proporção Dinâmica**: Detecta desbalanceamento na proporção de resultados e aposta na reversão à média

## Instalação

1. Clone o repositório
2. Instale as dependências:
   ```
   npm install
   ```
3. Copie o arquivo `.env.example` para `.env` e configure os tokens do Telegram:
   ```
   cp .env.example .env
   ```
4. Edite o arquivo `.env` com seus tokens e chat IDs do Telegram

## Como Utilizar

### Executar todas as estratégias
```
npm start
```

### Executar estratégias específicas
```
npm run sequencia     # Executa apenas a estratégia de Sequência
npm run apos-empate   # Executa apenas a estratégia Após Empate
npm run alternancia   # Executa apenas a estratégia de Alternância
npm run proporcao     # Executa apenas a estratégia de Proporção
```

## Relatórios

O bot envia automaticamente diferentes tipos de relatórios:
- Relatório estatístico a cada 50 rodadas
- Resumo por estratégia a cada 100 rodadas
- Relatório detalhado a cada 200 rodadas
- Relatório diário completo e reinício de contadores a cada mudança de dia

## Requisitos

- Node.js 16 ou superior
- Tokens de Bot Telegram (pelo menos um token principal)
- Acesso à Internet para monitorar os resultados do Bac Bo

## Dependências

- axios: Para requisições HTTP
- dotenv: Para carregamento de variáveis de ambiente
- express: Para servidor web
- puppeteer: Para web scraping dos resultados do Bac Bo

## Resolução de Problemas

Se o bot não conseguir iniciar o navegador Puppeteer, verifique:
1. Se o Chrome está instalado no sistema
2. Se o caminho do Chrome está configurado corretamente no `.env`
3. Se existem permissões suficientes para executar o Chrome

## Notas

O bot foi projetado para alta modularidade, permitindo a adição de novas estratégias ou a execução independente das estratégias existentes.