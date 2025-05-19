// src/utils/helpers.js

/**
 * Calcula a taxa de sucesso em porcentagem
 * @param {number} numerador - Contagem de sucessos
 * @param {number} denominador - Total de tentativas
 * @returns {number} Taxa em porcentagem
 */
function calcularTaxaDeSucesso(numerador, denominador) {
  if (!numerador || !denominador) return 0;
  return Math.round((numerador / denominador) * 100);
}

/**
 * Verifica se houve mudança de dia e executa ação correspondente
 * @param {Function} callback - Função a ser executada em caso de mudança de dia
 * @param {Date} ultimoDiaVerificado - Referência do último dia verificado
 * @returns {Object} Objeto contendo o ultimoDiaVerificado atualizado e se houve mudança
 */
function verificarMudancaDeDia(callback, ultimoDiaVerificado) {
  const dataAtual = new Date();
  const diaAtual = dataAtual.getDate();

  // Se o dia mudou
  if (diaAtual !== ultimoDiaVerificado) {
    console.log(
      `Dia mudou de ${ultimoDiaVerificado} para ${diaAtual}. Enviando relatório diário e reiniciando contadores.`
    );

    if (typeof callback === 'function') {
      callback();
    }

    return { 
      ultimoDiaVerificado: diaAtual,
      houveMudanca: true 
    };
  }

  return { 
    ultimoDiaVerificado,
    houveMudanca: false 
  };
}

module.exports = {
  calcularTaxaDeSucesso,
  verificarMudancaDeDia
};