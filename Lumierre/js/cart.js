/* ==========================================================================
   LUMIERRE BOUTIQUE — Sacola de compras
   --------------------------------------------------------------------------
   Guardada no localStorage do navegador do cliente. Nada é enviado para
   lugar nenhum até ele finalizar o pedido no checkout.

   Formato salvo:  [ { id: 'azul', quantidade: 2 }, ... ]
   ========================================================================== */

const CHAVE_SACOLA = 'lumierre_sacola';

/** Lê a sacola do localStorage, tolerando dados corrompidos ou ausentes. */
function lerSacola() {
  try {
    const bruto = localStorage.getItem(CHAVE_SACOLA);
    if (!bruto) return [];
    const dados = JSON.parse(bruto);
    if (!Array.isArray(dados)) return [];
    // Descarta itens de produtos que não existem mais no catálogo
    return dados.filter((item) => item && getProduto(item.id) && item.quantidade > 0);
  } catch (erro) {
    // localStorage pode estar bloqueado (janela anônima, cookies desativados)
    console.warn('Não foi possível ler a sacola:', erro);
    return [];
  }
}

/** Grava a sacola e avisa o resto da página que ela mudou. */
function salvarSacola(sacola) {
  try {
    localStorage.setItem(CHAVE_SACOLA, JSON.stringify(sacola));
  } catch (erro) {
    console.warn('Não foi possível salvar a sacola:', erro);
  }
  document.dispatchEvent(new CustomEvent('sacola:mudou'));
}

/** Adiciona um produto (ou soma à quantidade, se já estiver na sacola). */
function adicionarNaSacola(id, quantidade = 1) {
  if (!getProduto(id)) return;
  const sacola = lerSacola();
  const existente = sacola.find((item) => item.id === id);

  if (existente) {
    existente.quantidade = Math.min(existente.quantidade + quantidade, 99);
  } else {
    sacola.push({ id, quantidade: Math.min(quantidade, 99) });
  }
  salvarSacola(sacola);
}

/** Define a quantidade exata de um item. Zero ou menos remove o item. */
function definirQuantidade(id, quantidade) {
  let sacola = lerSacola();
  if (quantidade <= 0) {
    sacola = sacola.filter((item) => item.id !== id);
  } else {
    const item = sacola.find((i) => i.id === id);
    if (item) item.quantidade = Math.min(quantidade, 99);
  }
  salvarSacola(sacola);
}

/** Remove um item da sacola. */
function removerDaSacola(id) {
  salvarSacola(lerSacola().filter((item) => item.id !== id));
}

/** Esvazia a sacola (usado após o pedido ser finalizado). */
function limparSacola() {
  salvarSacola([]);
}

/** Soma das quantidades — é o número que aparece no ícone do header. */
function totalDeItens() {
  return lerSacola().reduce((soma, item) => soma + item.quantidade, 0);
}

/** Valor total do pedido em reais. */
function totalDaSacola() {
  return totalDeItens() * PRECO_UNITARIO;
}

/**
 * Sacola "enriquecida" com os dados do catálogo, pronta para exibir.
 * @returns {Array<{produto, quantidade, subtotal}>}
 */
function sacolaDetalhada() {
  return lerSacola().map((item) => ({
    produto: getProduto(item.id),
    quantidade: item.quantidade,
    subtotal: item.quantidade * PRECO_UNITARIO,
  }));
}

/** Resumo em texto puro, usado na mensagem do WhatsApp e na planilha. */
function resumoDaSacolaTexto() {
  return sacolaDetalhada()
    .map((linha) => `${linha.quantidade}x ${linha.produto.nome}`)
    .join(', ');
}
