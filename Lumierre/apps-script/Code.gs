/**
 * ===========================================================================
 * LUMIERRE BOUTIQUE — Recebedor de pedidos no Google Sheets
 * ===========================================================================
 * Cole este arquivo inteiro no editor de Apps Script da sua planilha e
 * publique como "App da Web". O passo a passo completo está no README.md
 * desta mesma pasta.
 *
 * Cada pedido feito no site vira uma linha nova na aba "Pedidos".
 */

/** Nome da aba onde os pedidos são gravados. É criada sozinha se não existir. */
var NOME_DA_ABA = 'Pedidos';

/** Cabeçalho da planilha, na ordem em que as colunas aparecem. */
var CABECALHO = [
  'Data/Hora',
  'Código do pedido',
  'Nome',
  'WhatsApp',
  'E-mail',
  'Itens',
  'Quantidade',
  'Total (R$)',
  'Observação',
  'Origem',
];


/**
 * Recebe o pedido enviado pelo site.
 *
 * O site envia com Content-Type text/plain de propósito (evita o preflight
 * CORS, que o Apps Script não sabe responder), então o JSON chega cru em
 * e.postData.contents e precisa ser convertido aqui.
 */
function doPost(e) {
  try {
    if (!e || !e.postData || !e.postData.contents) {
      return responder({ ok: false, erro: 'Requisição sem corpo.' });
    }

    var pedido = JSON.parse(e.postData.contents);
    var aba = obterAba();

    aba.appendRow([
      formatarDataHora(pedido.data),
      pedido.txid || '',
      pedido.nome || '',
      // O apóstrofo à frente força o Sheets a tratar como texto, senão ele
      // interpreta "(61) 99627-2007" como fórmula ou come o zero à esquerda.
      "'" + (pedido.whatsapp || ''),
      pedido.email || '',
      pedido.itens || '',
      Number(pedido.quantidade) || 0,
      Number(pedido.total) || 0,
      pedido.observacao || '',
      pedido.origem || '',
    ]);

    return responder({ ok: true });
  } catch (erro) {
    // Registra no log de execuções do Apps Script para você poder investigar
    console.error('Falha ao gravar o pedido: ' + erro);
    return responder({ ok: false, erro: String(erro) });
  }
}


/**
 * Responde a acessos via GET. Serve só para você abrir a URL no navegador e
 * confirmar que a publicação funcionou.
 */
function doGet() {
  return responder({
    ok: true,
    mensagem: 'Recebedor de pedidos da Lumierre Boutique está no ar.',
  });
}


/* ==========================================================================
   Auxiliares
   ========================================================================== */

/** Pega a aba de pedidos, criando-a com o cabeçalho se ainda não existir. */
function obterAba() {
  var planilha = SpreadsheetApp.getActiveSpreadsheet();
  var aba = planilha.getSheetByName(NOME_DA_ABA);

  if (!aba) {
    aba = planilha.insertSheet(NOME_DA_ABA);
  }

  // Planilha vazia: escreve o cabeçalho e o deixa congelado e em negrito
  if (aba.getLastRow() === 0) {
    aba.appendRow(CABECALHO);
    aba.getRange(1, 1, 1, CABECALHO.length).setFontWeight('bold');
    aba.setFrozenRows(1);
    aba.setColumnWidth(1, 150); // Data/Hora
    aba.setColumnWidth(6, 260); // Itens
    aba.setColumnWidth(9, 260); // Observação
  }

  return aba;
}


/** Converte a data ISO enviada pelo site para o fuso e o formato de Brasília. */
function formatarDataHora(iso) {
  try {
    var data = iso ? new Date(iso) : new Date();
    return Utilities.formatDate(data, 'America/Sao_Paulo', 'dd/MM/yyyy HH:mm:ss');
  } catch (erro) {
    return String(iso || '');
  }
}


/** Monta a resposta JSON. */
function responder(objeto) {
  return ContentService
    .createTextOutput(JSON.stringify(objeto))
    .setMimeType(ContentService.MimeType.JSON);
}


/* ==========================================================================
   Teste manual
   --------------------------------------------------------------------------
   Selecione a função `testarGravacao` no editor e clique em Executar para
   inserir uma linha de teste, sem precisar passar pelo site.
   ========================================================================== */
function testarGravacao() {
  doPost({
    postData: {
      contents: JSON.stringify({
        data: new Date().toISOString(),
        txid: 'LMRTESTE',
        nome: 'Pedido de teste',
        whatsapp: '(61) 99999-9999',
        email: 'teste@exemplo.com',
        itens: '1x Lumierre Azure',
        quantidade: 1,
        total: 50,
        observacao: 'Linha criada pela função de teste — pode apagar.',
        origem: 'teste-manual',
      }),
    },
  });
}
