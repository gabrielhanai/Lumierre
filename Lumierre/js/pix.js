/* ==========================================================================
   LUMIERRE BOUTIQUE — Gerador de Pix "Copia e Cola" (BR Code)
   --------------------------------------------------------------------------
   Monta o payload EMV MPM especificado pelo Banco Central (Manual do BR Code).
   Roda 100% no navegador: não existe API, servidor, conta em PSP nem custo.

   O payload é uma sequência de campos no formato TLV (Tag-Length-Value):

       ┌────┬────────┬─────────────────┐
       │ ID │ TAMANHO│ CONTEÚDO        │
       │ 2  │   2    │ n caracteres    │
       └────┴────────┴─────────────────┘

   Campos usados aqui:
     00  Payload Format Indicator ......... sempre "01"
     26  Merchant Account Information ..... contém a chave Pix
           └ 00  GUI ...................... sempre "BR.GOV.BCB.PIX"
           └ 01  chave Pix
     52  Merchant Category Code ........... "0000" (não categorizado)
     53  Transaction Currency ............. "986" (BRL, ISO 4217)
     54  Transaction Amount ............... ex: "50.00" (ponto, 2 casas)
     58  Country Code ..................... "BR"
     59  Merchant Name .................... máx 25, ASCII maiúsculo
     60  Merchant City .................... máx 15, ASCII maiúsculo
     62  Additional Data Field Template
           └ 05  Reference Label (txid) ... identificador do pedido
     63  CRC16 ............................ sempre o ÚLTIMO campo
   ========================================================================== */


/**
 * Monta um campo TLV. O tamanho é sempre 2 dígitos com zero à esquerda.
 * @example emv('00', '01') → "000201"
 */
function emv(id, valor) {
  const tamanho = String(valor.length).padStart(2, '0');
  return id + tamanho + valor;
}


/**
 * Normaliza texto para o BR Code: remove acentos, força maiúsculas, descarta
 * qualquer caractere fora do ASCII imprimível e corta no tamanho máximo.
 *
 * "Brasília" → "BRASILIA"     "Ação & Cia." → "ACAO  CIA."
 */
// Marcas de acento combinantes (U+0300–U+036F). Construído via RegExp para o
// arquivo-fonte permanecer 100% ASCII — caractere invisível no código é frágil
// e depende da codificação com que o arquivo for salvo.
const MARCAS_DE_ACENTO = new RegExp('[\\u0300-\\u036f]', 'g');

function sanitizarTextoPix(texto, tamanhoMaximo) {
  return texto
    .normalize('NFD')                    // separa a letra do acento
    .replace(MARCAS_DE_ACENTO, '')       // remove os acentos soltos
    .toUpperCase()
    .replace(/[^A-Z0-9 $%*+\-./:]/g, ' ')
    .replace(/\s+/g, ' ')
    .trim()
    .slice(0, tamanhoMaximo);
}


/**
 * CRC16/CCITT-FALSE — o checksum exigido pelo BR Code.
 *   polinômio 0x1021 · valor inicial 0xFFFF · sem reflexão · sem XOR final
 * O resultado é devolvido em 4 dígitos hexadecimais MAIÚSCULOS.
 *
 * Detalhe crítico: o cálculo é feito sobre o payload inteiro JÁ INCLUINDO
 * o literal "6304" no final (o id e o tamanho do próprio campo do CRC).
 */
function crc16(texto) {
  let crc = 0xffff;

  for (let i = 0; i < texto.length; i++) {
    crc ^= texto.charCodeAt(i) << 8;
    for (let bit = 0; bit < 8; bit++) {
      crc = (crc & 0x8000) ? ((crc << 1) ^ 0x1021) : (crc << 1);
      crc &= 0xffff; // JS usa 32 bits; precisamos truncar a cada passo
    }
  }

  return crc.toString(16).toUpperCase().padStart(4, '0');
}


/**
 * Gera um identificador de transação (txid) para o pedido.
 * Formato: LMR + 6 caracteres alfanuméricos → "LMR7K3F9X2"
 *
 * O txid aparece no extrato do Pix e também é gravado na planilha, então
 * serve para casar "esse pagamento que caiu" com "esse pedido do site".
 * O BR Code aceita A-Z, 0-9 e no máximo 25 caracteres neste campo.
 */
function gerarTxid() {
  const alfabeto = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789'; // sem I/O/0/1 (confusão visual)
  let sufixo = '';
  for (let i = 0; i < 7; i++) {
    sufixo += alfabeto[Math.floor(Math.random() * alfabeto.length)];
  }
  return 'LMR' + sufixo;
}


/**
 * Monta o payload Pix completo, pronto para virar QR Code ou ser copiado.
 *
 * @param {object} opcoes
 * @param {string} opcoes.chave   chave Pix do recebedor
 * @param {string} opcoes.nome    nome do recebedor
 * @param {string} opcoes.cidade  município do recebedor
 * @param {number} opcoes.valor   valor em reais (ex: 100 para R$ 100,00)
 * @param {string} [opcoes.txid]  identificador do pedido
 * @returns {string} payload BR Code
 */
function gerarPayloadPix({ chave, nome, cidade, valor, txid }) {
  const nomeLimpo   = sanitizarTextoPix(nome, 25);
  const cidadeLimpa = sanitizarTextoPix(cidade, 15);
  const txidLimpo   = sanitizarTextoPix(txid || '***', 25).replace(/ /g, '');

  // Valor sempre com ponto decimal e 2 casas — vírgula invalida o código.
  const valorFormatado = valor.toFixed(2);

  // A chave vai crua: e-mails e chaves aleatórias usam minúsculas e pontos,
  // e sanitizar aqui destruiria a chave.
  const contaComerciante =
    emv('00', 'BR.GOV.BCB.PIX') +
    emv('01', chave.trim());

  const dadosAdicionais = emv('05', txidLimpo || '***');

  const payloadSemCrc =
    emv('00', '01')                     + // Payload Format Indicator
    emv('26', contaComerciante)         + // Merchant Account Information
    emv('52', '0000')                   + // Merchant Category Code
    emv('53', '986')                    + // Moeda: BRL
    emv('54', valorFormatado)           + // Valor
    emv('58', 'BR')                     + // País
    emv('59', nomeLimpo)                + // Nome do recebedor
    emv('60', cidadeLimpa)              + // Cidade do recebedor
    emv('62', dadosAdicionais)          + // Dados adicionais (txid)
    '6304';                               // id + tamanho do CRC, sem o valor

  return payloadSemCrc + crc16(payloadSemCrc);
}


/**
 * Confere se um payload BR Code está íntegro, recalculando o CRC.
 * Usado nos testes e como trava de segurança antes de mostrar o QR ao cliente.
 */
function validarPayloadPix(payload) {
  if (typeof payload !== 'string' || payload.length < 8) return false;
  const corpo = payload.slice(0, -4);
  const crcInformado = payload.slice(-4).toUpperCase();
  return corpo.endsWith('6304') && crc16(corpo) === crcInformado;
}
