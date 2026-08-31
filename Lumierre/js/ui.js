/* ==========================================================================
   LUMIERRE BOUTIQUE — Cabeçalho, rodapé e comportamentos compartilhados
   --------------------------------------------------------------------------
   Cabeçalho e rodapé são montados por JavaScript para existirem em UM lugar
   só. Editando aqui, as quatro páginas mudam juntas — inclusive as FAQs.
   ========================================================================== */


/* --------------------------------------------------------------------------
   FAQs do rodapé  —  [PLACEHOLDER] troque os textos pelos reais
   -------------------------------------------------------------------------- */
const FAQS = [
  {
    pergunta: 'Em quanto tempo recebo meus óculos?',
    resposta:
      'Combinamos a entrega pelo WhatsApp assim que o pagamento ' +
      'é confirmado. Em Brasília costumamos entregar em mãos em até 2 dias úteis; ' +
      'para outras cidades, enviamos pelos Correios.',
  },
  {
    pergunta: 'Quais são as formas de pagamento?',
    resposta:
      'Trabalhamos exclusivamente com Pix. O QR Code é gerado ' +
      'na hora, já com o valor do seu pedido preenchido, e a confirmação é imediata.',
  },
  {
    pergunta: 'Posso trocar ou devolver?',
    resposta:
      'Você tem 7 dias corridos a partir do recebimento para ' +
      'desistir da compra, conforme o Código de Defesa do Consumidor. A peça deve ' +
      'estar sem uso e na embalagem original.',
  },
  {
    pergunta: 'Os óculos têm garantia?',
    resposta:
      'Texto placeholder. Todas as peças têm 90 dias de garantia contra defeitos ' +
      'de fabricação, cobrindo armação, dobradiças e lentes. Basta falar com a ' +
      'gente pelo WhatsApp.',
  },
  {
    pergunta: 'É possível experimentar as armações presencialmente?',
    resposta:
      'Sim, à combinar via nossos meios de comunicação official ' +
      'como Whatsapp e Instagram '
  },
];


/* --------------------------------------------------------------------------
   Links de contato
   -------------------------------------------------------------------------- */

/** Monta um link do WhatsApp com uma mensagem já escrita. */
function linkWhatsApp(mensagem = '') {
  const base = `https://wa.me/${CONTATO.whatsappNumero}`;
  return mensagem ? `${base}?text=${encodeURIComponent(mensagem)}` : base;
}

/** Link do perfil no Instagram. */
function linkInstagram() {
  return `https://instagram.com/${CONTATO.instagram}`;
}


/* --------------------------------------------------------------------------
   Cabeçalho
   -------------------------------------------------------------------------- */

const PAGINAS_NAV = [
  { href: 'index.html', rotulo: 'Início' },
  { href: 'produtos.html', rotulo: 'Coleção' },
  { href: 'index.html#sobre', rotulo: 'A marca' },
  { href: 'index.html#faq', rotulo: 'Dúvidas' },
];

/** Nome do arquivo da página atual, ex: "produtos.html". */
function paginaAtual() {
  const caminho = window.location.pathname.split('/').pop();
  return caminho === '' ? 'index.html' : caminho;
}

function montarCabecalho() {
  const alvo = document.querySelector('[data-cabecalho]');
  if (!alvo) return;

  const atual = paginaAtual();
  const itens = PAGINAS_NAV.map((pagina) => {
    const ehAtual = pagina.href === atual;
    return `<li>
      <a class="nav__link${ehAtual ? ' nav__link--ativo' : ''}"
         href="${pagina.href}"${ehAtual ? ' aria-current="page"' : ''}>
        ${pagina.rotulo}
      </a>
    </li>`;
  }).join('');

  alvo.innerHTML = `
    <a class="pular-para-conteudo" href="#conteudo">Pular para o conteúdo</a>
    <div class="cabecalho__interno">
      <a class="marca" href="index.html" aria-label="Lumierre Boutique, página inicial">
        <span class="marca__nome">LUMIERRE</span>
        <span class="marca__sub">BOUTIQUE</span>
      </a>

      <button class="cabecalho__menu-btn" type="button"
              aria-expanded="false" aria-controls="nav-principal"
              aria-label="Abrir menu de navegação">
        <span class="hamburguer" aria-hidden="true"></span>
      </button>

      <nav class="nav" id="nav-principal" aria-label="Navegação principal">
        <ul class="nav__lista">${itens}</ul>
      </nav>

      <a class="sacola-link" href="carrinho.html" aria-label="Ver sacola de compras">
        <svg class="sacola-link__icone" viewBox="0 0 24 24" fill="none"
             stroke="currentColor" stroke-width="1.4" aria-hidden="true">
          <path d="M6 7h12l-1 13H7L6 7z" stroke-linejoin="round"/>
          <path d="M9 7V5.5a3 3 0 0 1 6 0V7" stroke-linecap="round"/>
        </svg>
        <span class="sacola-link__contador" data-contador-sacola hidden>0</span>
      </a>
    </div>
  `;

  // Menu mobile
  const botao = alvo.querySelector('.cabecalho__menu-btn');
  const nav = alvo.querySelector('.nav');

  botao.addEventListener('click', () => {
    const aberto = nav.classList.toggle('nav--aberta');
    botao.setAttribute('aria-expanded', String(aberto));
    botao.setAttribute('aria-label', aberto ? 'Fechar menu de navegação' : 'Abrir menu de navegação');
  });

  // Fecha ao navegar ou ao apertar Esc
  nav.addEventListener('click', (evento) => {
    if (evento.target.closest('a')) {
      nav.classList.remove('nav--aberta');
      botao.setAttribute('aria-expanded', 'false');
    }
  });

  document.addEventListener('keydown', (evento) => {
    if (evento.key === 'Escape' && nav.classList.contains('nav--aberta')) {
      nav.classList.remove('nav--aberta');
      botao.setAttribute('aria-expanded', 'false');
      botao.focus();
    }
  });
}


/* --------------------------------------------------------------------------
   Rodapé
   -------------------------------------------------------------------------- */

function montarRodape() {
  const alvo = document.querySelector('[data-rodape]');
  if (!alvo) return;

  const faqsHTML = FAQS.map((faq) => `
    <details class="faq__item">
      <summary class="faq__pergunta">
        ${faq.pergunta}
        <span class="faq__sinal" aria-hidden="true"></span>
      </summary>
      <div class="faq__resposta"><p>${faq.resposta}</p></div>
    </details>
  `).join('');

  alvo.innerHTML = `
    <section class="faq" id="faq" aria-labelledby="faq-titulo">
      <div class="container">
        <h2 class="faq__titulo secao__titulo" id="faq-titulo">Dúvidas frequentes</h2>
        <div class="faq__lista">${faqsHTML}</div>
      </div>
    </section>

    <div class="rodape__principal">
      <div class="container rodape__grade">
        <div class="rodape__bloco">
          <a class="marca marca--rodape" href="index.html">
            <span class="marca__nome">LUMIERRE</span>
            <span class="marca__sub">BOUTIQUE</span>
          </a>
          <p class="rodape__texto">
            Óculos de sol autorais, em séries pequenas.<br>Brasília, DF.
          </p>
        </div>

        <div class="rodape__bloco">
          <h3 class="rodape__titulo">Navegar</h3>
          <ul class="rodape__lista">
            <li><a href="index.html">Início</a></li>
            <li><a href="produtos.html">Coleção</a></li>
            <li><a href="index.html#sobre">A marca</a></li>
            <li><a href="carrinho.html">Sacola</a></li>
          </ul>
        </div>

        <div class="rodape__bloco">
          <h3 class="rodape__titulo">Falar com a gente</h3>
          <ul class="rodape__lista">
            <li>
              <a href="${linkWhatsApp('Olá! Vim pelo site da Lumierre e gostaria de saber mais.')}"
                 target="_blank" rel="noopener">
                WhatsApp ${CONTATO.whatsappExibicao}
              </a>
            </li>
            <li>
              <a href="${linkInstagram()}" target="_blank" rel="noopener">
                Instagram @${CONTATO.instagram}
              </a>
            </li>
          </ul>
          <p class="rodape__texto rodape__texto--menor">
            Atendimento 24hrs
          </p>
        </div>
      </div>

      <div class="container rodape__base">
        <p>&copy; <span data-ano></span> Lumierre Boutique. Todos os direitos reservados.</p>
        <p class="rodape__pagamento">Pagamento exclusivamente via Pix.</p>
      </div>
    </div>
  `;

  const ano = alvo.querySelector('[data-ano]');
  if (ano) ano.textContent = new Date().getFullYear();
}


/* --------------------------------------------------------------------------
   Contador da sacola no cabeçalho
   -------------------------------------------------------------------------- */

function atualizarContadorSacola() {
  const contador = document.querySelector('[data-contador-sacola]');
  if (!contador) return;

  const total = totalDeItens();
  contador.textContent = String(total);
  contador.hidden = total === 0;
}


/* --------------------------------------------------------------------------
   Botões "Adicionar à sacola" (funcionam em qualquer página)
   -------------------------------------------------------------------------- */

function ligarBotoesAdicionar() {
  document.addEventListener('click', (evento) => {
    const botao = evento.target.closest('[data-add-carrinho]');
    if (!botao) return;

    evento.preventDefault();
    const id = botao.dataset.addCarrinho;

    // Se a página tiver um seletor de quantidade, respeita o valor escolhido
    const campoQtd = document.querySelector('[data-campo-quantidade]');
    const quantidade = campoQtd ? Math.max(1, parseInt(campoQtd.value, 10) || 1) : 1;

    adicionarNaSacola(id, quantidade);
    feedbackBotao(botao, 'Adicionado ✓');
  });
}

/** Troca o texto do botão por alguns instantes, como confirmação visual. */
function feedbackBotao(botao, mensagem) {
  if (botao.dataset.ocupado === '1') return;

  const textoOriginal = botao.textContent;
  botao.dataset.ocupado = '1';
  botao.textContent = mensagem;
  botao.classList.add('btn--confirmado');

  setTimeout(() => {
    botao.textContent = textoOriginal;
    botao.classList.remove('btn--confirmado');
    delete botao.dataset.ocupado;
  }, 1600);
}


/* --------------------------------------------------------------------------
   Revelação suave de seções conforme a rolagem
   -------------------------------------------------------------------------- */

function ligarRevelacao() {
  const alvos = document.querySelectorAll('[data-revelar]');
  if (!alvos.length) return;

  // Sem suporte a IntersectionObserver ou com movimento reduzido: mostra tudo.
  const movimentoReduzido = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  if (movimentoReduzido || !('IntersectionObserver' in window)) {
    alvos.forEach((alvo) => alvo.classList.add('revelado'));
    return;
  }

  const observador = new IntersectionObserver((entradas) => {
    entradas.forEach((entrada) => {
      if (entrada.isIntersecting) {
        entrada.target.classList.add('revelado');
        observador.unobserve(entrada.target);
      }
    });
  }, { threshold: 0.12, rootMargin: '0px 0px -40px 0px' });

  alvos.forEach((alvo) => observador.observe(alvo));
}


/* --------------------------------------------------------------------------
   Altura do cabeçalho
   --------------------------------------------------------------------------
   O cabeçalho é sticky, então ocupa espaço no fluxo da página. O hero precisa
   descontar essa altura para a primeira dobra caber exatamente na tela. Como
   a altura muda entre celular e desktop (e quando a fonte não carrega), ela é
   medida aqui e publicada como variável CSS.
   -------------------------------------------------------------------------- */

function ajustarAlturaCabecalho() {
  const cabecalho = document.querySelector('.cabecalho');
  if (!cabecalho) return;

  document.documentElement.style.setProperty(
    '--altura-cabecalho',
    cabecalho.offsetHeight + 'px'
  );
}


/* --------------------------------------------------------------------------
   Vídeo do hero
   --------------------------------------------------------------------------
   O autoplay só é permitido pelos navegadores quando o vídeo está MUDO e,
   no iOS, quando tem `playsinline` — os dois atributos já estão no HTML.
   Ainda assim o play pode ser recusado (modo de economia de bateria, aba em
   segundo plano, política do navegador), então tratamos a recusa: o `poster`
   continua visível e a hero não quebra.
   -------------------------------------------------------------------------- */

function ligarHeroVideo() {
  const video = document.querySelector('[data-hero-video]');
  if (!video) return;

  // Quem pediu menos movimento no sistema operacional vê só o poster.
  if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) {
    video.removeAttribute('autoplay');
    video.pause();
    return;
  }

  const tentarTocar = () => {
    const promessa = video.play();
    if (promessa && typeof promessa.catch === 'function') {
      promessa.catch(() => {
        /* Autoplay recusado: o poster segue visível, nada a fazer. */
      });
    }
  };

  tentarTocar();

  // Alguns navegadores pausam o vídeo ao voltar de outra aba.
  document.addEventListener('visibilitychange', () => {
    if (!document.hidden && video.paused) tentarTocar();
  });
}


/* --------------------------------------------------------------------------
   Inicialização
   -------------------------------------------------------------------------- */

document.addEventListener('DOMContentLoaded', () => {
  montarCabecalho();
  montarRodape();
  atualizarContadorSacola();
  ligarBotoesAdicionar();
  ligarRevelacao();
  ligarHeroVideo();
  ajustarAlturaCabecalho();
});

// A altura do cabeçalho muda ao girar o celular ou ao redimensionar a janela.
// Também remedimos quando as fontes terminam de carregar, porque a troca da
// fonte de fallback pela definitiva altera a altura da marca.
window.addEventListener('resize', ajustarAlturaCabecalho);
if (document.fonts && document.fonts.ready) {
  document.fonts.ready.then(ajustarAlturaCabecalho);
}

// Mantém o contador sincronizado, inclusive entre abas abertas
document.addEventListener('sacola:mudou', atualizarContadorSacola);
window.addEventListener('storage', (evento) => {
  if (evento.key === CHAVE_SACOLA) atualizarContadorSacola();
});
