/* ==========================================================================
   LUMIERRE BOUTIQUE — Catálogo
   --------------------------------------------------------------------------
   As descrições abaixo são PLACEHOLDERS. Troque pelos textos reais quando
   quiser — nada mais no site precisa ser alterado junto.

   Para adicionar um modelo novo: copie um bloco, troque o `id` (precisa ser
   único, sem espaço e sem acento) e aponte `fotos` para os arquivos em
   assets/. O preço vem de PRECO_UNITARIO, em js/config.js.
   ========================================================================== */

const PRODUTOS = [
  {
    id: 'azul',
    nome: 'Lumierre Royal',
    subtitulo: 'Lente azul-gelo · armação preta',
    // [PLACEHOLDER] — trocar pelo texto real
    descricao:
      'Descrição placeholder. Armação em acetato de alta densidade com acabamento ' +
      'polido à mão e lentes em tom azul-gelo. Formato arredondado atemporal, ' +
      'pensado para quem prefere ser notado pelo detalhe e não pelo excesso.',
    detalhes: [
      'Armação em acetato polido',      // [PLACEHOLDER]
      'Lentes com proteção UV400',      // [PLACEHOLDER]
      'Hastes com dobradiça reforçada', // [PLACEHOLDER]     // [PLACEHOLDER]
    ],
    fotos: ['assets/azul1.jpg', 'assets/azul2.jpg'],
    cor: '#8FB3C7',
  },
  {
    id: 'preto',
    nome: 'Lumierre Onyx',
    subtitulo: 'Lente preta · armação preta',
    descricao:
      'Descrição placeholder. O modelo mais discreto da casa: preto sobre preto, ' +
      'sem nenhum contraste. Combina com absolutamente tudo e é a escolha certa ' +
      'quando você não quer pensar no assunto.',
    detalhes: [
      'Armação em acetato polido',
      'Lentes com proteção UV400',
      'Hastes com dobradiça reforçada',
    ],
    fotos: ['assets/preto1.jpg', 'assets/preto2.jpg'],
    cor: '#2E2A26',
  },
  {
    id: 'amarelo',
    nome: 'Lumierre Ambâr',
    subtitulo: 'Lente âmbar · armação preta',
    descricao:
      'Descrição placeholder. Lentes em âmbar quente que puxam a luz para dentro ' +
      'e deixam qualquer fim de tarde com cara de filme. O modelo que mais sai ' +
      'nas festas de verão.',
    detalhes: [
      'Armação em acetato polido',
      'Lentes com proteção UV400',
      'Hastes com dobradiça reforçada',
    ],
    fotos: ['assets/amarelo1.jpg', 'assets/amarelo2.jpg'],
    cor: '#D8A94B',
  },
  {
    id: 'vermelho',
    nome: 'Lumierre Arizona',
    subtitulo: 'Lente vermelha · armação preta',
    descricao:
      'Descrição placeholder. Para quem chega e não precisa avisar. Lentes em ' +
      'vermelho translúcido sobre armação preta — o único modelo da linha que ' +
      'não tenta passar despercebido.',
    detalhes: [
      'Armação em acetato polido',
      'Lentes com proteção UV400',
      'Hastes com dobradiça reforçada',
    ],
    fotos: ['assets/vermelho1.jpg', 'assets/vermelho2.jpg'],
    cor: '#A63A34',
  },
  {
    id: 'jaguar',
    nome: 'Lumierre Jaguar',
    subtitulo: 'Armação animal print · lente fumê',
    descricao:
      'Descrição placeholder. Acetato com padrão tartaruga malhado, peça a peça ' +
      'diferente da anterior — não existem duas armações idênticas. O modelo ' +
      'mais autoral da coleção.',
    detalhes: [
      'Armação em acetato padrão tartaruga',
      'Lentes com proteção UV400',
      'Hastes com dobradiça reforçada',
    ],
    fotos: ['assets/jaguar1.jpg', 'assets/jaguar2.jpg'],
    cor: '#8A6034',
  },
];


/* ==========================================================================
   Helpers de catálogo
   ========================================================================== */

/** Busca um produto pelo id. Devolve `undefined` se não existir. */
function getProduto(id) {
  return PRODUTOS.find((p) => p.id === id);
}

/** Formata um número como moeda brasileira: 50 → "R$ 50,00" */
function formatarPreco(valor) {
  return valor.toLocaleString('pt-BR', {
    style: 'currency',
    currency: 'BRL',
  });
}

/**
 * Monta o HTML de um card de produto para a vitrine.
 * A segunda foto aparece no hover (desktop) como troca suave de imagem.
 */
function cardProdutoHTML(produto) {
  return `
    <article class="card-produto">
      <a class="card-produto__link" href="produto.html?id=${produto.id}">
        <div class="card-produto__midia">
          <img class="card-produto__foto card-produto__foto--frente"
               src="${produto.fotos[0]}"
               alt="${produto.nome} — vista frontal"
               loading="lazy" decoding="async">
          <img class="card-produto__foto card-produto__foto--verso"
               src="${produto.fotos[1]}"
               alt=""
               aria-hidden="true"
               loading="lazy" decoding="async">
        </div>
        <div class="card-produto__info">
          <h3 class="card-produto__nome">${produto.nome}</h3>
          <p class="card-produto__subtitulo">${produto.subtitulo}</p>
          <p class="card-produto__preco">${formatarPreco(PRECO_UNITARIO)}</p>
        </div>
      </a>
      <button class="btn btn--secundario card-produto__btn"
              data-add-carrinho="${produto.id}">
        Adicionar à sacola
      </button>
    </article>
  `;
}

/**
 * Renderiza uma lista de produtos dentro de um container.
 * @param {string} seletor  seletor CSS do container
 * @param {Array}  lista    produtos a renderizar (padrão: todos)
 */
function renderizarGrade(seletor, lista = PRODUTOS) {
  const container = document.querySelector(seletor);
  if (!container) return;
  container.innerHTML = lista.map(cardProdutoHTML).join('');
}
