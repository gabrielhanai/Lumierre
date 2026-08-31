/* ==========================================================================
   LUMIERRE BOUTIQUE — Página de detalhe do produto
   --------------------------------------------------------------------------
   Lê o modelo da URL:  produto.html?id=azul
   Se o id não existir (link velho, erro de digitação), mostra um recado
   amigável com caminho de volta em vez de uma página quebrada.
   ========================================================================== */

document.addEventListener('DOMContentLoaded', () => {
  const container = document.querySelector('[data-produto-detalhe]');
  if (!container) return;

  const id = new URLSearchParams(window.location.search).get('id');
  const produto = id ? getProduto(id) : null;

  if (!produto) {
    mostrarNaoEncontrado(container);
    return;
  }

  renderizarProduto(container, produto);
  atualizarMetadados(produto);
  renderizarRelacionados(produto);
});


/* --------------------------------------------------------------------------
   Produto não encontrado
   -------------------------------------------------------------------------- */
function mostrarNaoEncontrado(container) {
  container.innerHTML = `
    <div class="sacola__vazia">
      <p class="sobretitulo">Ops</p>
      <h1 style="font-size: clamp(1.75rem, 4.5vw, 2.5rem); margin-bottom: 1rem">
        Não encontramos esse modelo
      </h1>
      <p>O link pode estar desatualizado ou a peça já saiu de linha.</p>
      <a class="btn btn--primario" href="produtos.html">Ver a coleção</a>
    </div>
  `;

  const relacionados = document.querySelector('[data-secao-relacionados]');
  if (relacionados) relacionados.hidden = true;
}


/* --------------------------------------------------------------------------
   Renderização
   -------------------------------------------------------------------------- */
function renderizarProduto(container, produto) {
  const miniaturas = produto.fotos.map((foto, indice) => `
    <button class="galeria__miniatura${indice === 0 ? ' galeria__miniatura--ativa' : ''}"
            type="button"
            data-miniatura="${indice}"
            aria-label="Ver foto ${indice + 1} de ${produto.fotos.length}">
      <img src="${foto}" alt="" aria-hidden="true" loading="lazy" decoding="async">
    </button>
  `).join('');

  const detalhes = produto.detalhes.map((item) => `<li>${item}</li>`).join('');

  container.innerHTML = `
    <div class="produto">
      <div class="galeria">
        <div class="galeria__principal">
          <img class="galeria__foto"
               src="${produto.fotos[0]}"
               alt="${produto.nome} — vista principal"
               data-foto-principal
               decoding="async">
        </div>
        <div class="galeria__miniaturas">${miniaturas}</div>
      </div>

      <div class="produto__info">
        <p class="sobretitulo">Lumierre</p>
        <h1 class="produto__nome">${produto.nome}</h1>
        <p class="produto__subtitulo">${produto.subtitulo}</p>
        <p class="produto__preco">${formatarPreco(PRECO_UNITARIO)}</p>

        <p class="produto__descricao">${produto.descricao}</p>

        <ul class="produto__detalhes">${detalhes}</ul>

        <div class="produto__compra">
          <div class="quantidade">
            <button class="quantidade__btn" type="button"
                    data-qtd-menos aria-label="Diminuir quantidade">&minus;</button>
            <input class="quantidade__campo"
                   type="number" value="1" min="1" max="99" step="1"
                   inputmode="numeric"
                   data-campo-quantidade
                   aria-label="Quantidade">
            <button class="quantidade__btn" type="button"
                    data-qtd-mais aria-label="Aumentar quantidade">+</button>
          </div>

          <button class="btn btn--primario" data-add-carrinho="${produto.id}">
            Adicionar à sacola
          </button>
        </div>

        <a class="btn btn--secundario btn--bloco" href="carrinho.html"
           style="margin-bottom: 1.5rem">
          Ir para a sacola
        </a>

        <p class="produto__aviso">
          Pagamento via Pix. Combinamos a entrega pelo WhatsApp
          <a class="link-texto" data-link-whatsapp-produto target="_blank" rel="noopener" href="#">${CONTATO.whatsappExibicao}</a>
          logo após a confirmação.
        </p>
      </div>
    </div>
  `;

  ligarGaleria(produto);
  ligarSeletorQuantidade();

  const whats = container.querySelector('[data-link-whatsapp-produto]');
  if (whats) {
    whats.href = linkWhatsApp(`Olá! Tenho interesse no modelo ${produto.nome}.`);
  }
}


/* --------------------------------------------------------------------------
   Galeria: clicar na miniatura troca a foto principal
   -------------------------------------------------------------------------- */
function ligarGaleria(produto) {
  const principal = document.querySelector('[data-foto-principal]');
  const miniaturas = document.querySelectorAll('[data-miniatura]');
  if (!principal || !miniaturas.length) return;

  miniaturas.forEach((botao) => {
    botao.addEventListener('click', () => {
      const indice = Number(botao.dataset.miniatura);
      principal.src = produto.fotos[indice];
      principal.alt = `${produto.nome} — foto ${indice + 1}`;

      miniaturas.forEach((outra) => outra.classList.remove('galeria__miniatura--ativa'));
      botao.classList.add('galeria__miniatura--ativa');
    });
  });
}


/* --------------------------------------------------------------------------
   Seletor de quantidade
   -------------------------------------------------------------------------- */
function ligarSeletorQuantidade() {
  const campo = document.querySelector('[data-campo-quantidade]');
  const menos = document.querySelector('[data-qtd-menos]');
  const mais = document.querySelector('[data-qtd-mais]');
  if (!campo) return;

  /** Mantém o campo sempre num inteiro válido entre 1 e 99. */
  function ajustar(delta) {
    const atual = parseInt(campo.value, 10) || 1;
    campo.value = String(Math.min(99, Math.max(1, atual + delta)));
  }

  if (menos) menos.addEventListener('click', () => ajustar(-1));
  if (mais) mais.addEventListener('click', () => ajustar(1));

  // Digitação livre: só normaliza quando o campo perde o foco, para não
  // atrapalhar quem está apagando para digitar outro número.
  campo.addEventListener('blur', () => ajustar(0));
}


/* --------------------------------------------------------------------------
   Título da aba e metadados de compartilhamento
   -------------------------------------------------------------------------- */
function atualizarMetadados(produto) {
  document.title = `${produto.nome} — Lumierre Boutique`;

  const trilha = document.querySelector('[data-trilha-nome]');
  if (trilha) trilha.textContent = produto.nome;

  const descricao = document.querySelector('meta[name="description"]');
  if (descricao) descricao.setAttribute('content', produto.descricao.slice(0, 155));
}


/* --------------------------------------------------------------------------
   Outros modelos
   -------------------------------------------------------------------------- */
function renderizarRelacionados(produto) {
  const secao = document.querySelector('[data-secao-relacionados]');
  const grade = document.querySelector('[data-grade-relacionados]');
  if (!secao || !grade) return;

  // Mostra até 3 outros modelos, começando pelo seguinte na lista, para que
  // páginas diferentes não sugiram sempre os mesmos.
  const outros = PRODUTOS.filter((p) => p.id !== produto.id);
  const inicio = PRODUTOS.findIndex((p) => p.id === produto.id);
  const rotacionados = outros
    .slice(inicio)
    .concat(outros.slice(0, inicio))
    .slice(0, 3);

  if (!rotacionados.length) {
    secao.hidden = true;
    return;
  }

  grade.innerHTML = rotacionados.map(cardProdutoHTML).join('');
  secao.hidden = false;
}
