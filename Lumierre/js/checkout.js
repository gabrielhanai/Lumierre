/* ==========================================================================
   LUMIERRE BOUTIQUE — Sacola e checkout
   --------------------------------------------------------------------------
   Controla os três estados da página carrinho.html:
     A) sacola vazia
     B) itens + formulário com os dados do cliente
     C) pagamento via Pix (QR Code + Copia e Cola)
   ========================================================================== */

const CHAVE_PEDIDOS = 'lumierre_pedidos';

/* Guarda o pedido gerado, para os botões de copiar e do WhatsApp usarem. */
let pedidoAtual = null;


/* ==========================================================================
   Estados da página
   ========================================================================== */

function mostrarEstado(nome) {
  const estados = {
    vazio: document.querySelector('[data-estado-vazio]'),
    sacola: document.querySelector('[data-estado-sacola]'),
    pagamento: document.querySelector('[data-estado-pagamento]'),
  };

  Object.entries(estados).forEach(([chave, elemento]) => {
    if (elemento) elemento.hidden = chave !== nome;
  });

  // Acende a etapa correspondente no indicador do topo
  const etapaAtiva = { vazio: 'sacola', sacola: 'dados', pagamento: 'pagamento' }[nome];
  document.querySelectorAll('[data-etapa]').forEach((item) => {
    item.classList.toggle('etapas__item--ativa', item.dataset.etapa === etapaAtiva);
  });

  const indicador = document.querySelector('[data-etapas]');
  if (indicador) indicador.hidden = nome === 'vazio';
}


/* ==========================================================================
   Estado B — lista da sacola
   ========================================================================== */

function renderizarSacola() {
  const lista = document.querySelector('[data-lista-sacola]');
  if (!lista) return;

  const itens = sacolaDetalhada();

  // Se a sacola esvaziou enquanto o cliente estava na página, volta ao estado A
  if (!itens.length) {
    mostrarEstado('vazio');
    return;
  }

  lista.innerHTML = itens.map((linha) => `
    <article class="sacola__item">
      <img class="sacola__foto"
           src="${linha.produto.fotos[0]}"
           alt="${linha.produto.nome}"
           loading="lazy" decoding="async">

      <div>
        <h3 class="sacola__nome">
          <a href="produto.html?id=${linha.produto.id}">${linha.produto.nome}</a>
        </h3>
        <p class="sacola__meta">
          ${linha.produto.subtitulo} &middot; ${formatarPreco(PRECO_UNITARIO)} cada
        </p>

        <div class="sacola__controles">
          <div class="quantidade">
            <button class="quantidade__btn" type="button"
                    data-sacola-menos="${linha.produto.id}"
                    aria-label="Diminuir quantidade de ${linha.produto.nome}">&minus;</button>
            <input class="quantidade__campo"
                   type="number" min="1" max="99" step="1" inputmode="numeric"
                   value="${linha.quantidade}"
                   data-sacola-qtd="${linha.produto.id}"
                   aria-label="Quantidade de ${linha.produto.nome}">
            <button class="quantidade__btn" type="button"
                    data-sacola-mais="${linha.produto.id}"
                    aria-label="Aumentar quantidade de ${linha.produto.nome}">+</button>
          </div>

          <button class="sacola__remover" type="button"
                  data-sacola-remover="${linha.produto.id}">Remover</button>

          <span class="sacola__subtotal">${formatarPreco(linha.subtotal)}</span>
        </div>
      </div>
    </article>
  `).join('');

  atualizarResumo();
  mostrarEstado('sacola');
}

function atualizarResumo() {
  const quantidade = totalDeItens();
  const total = totalDaSacola();

  const campoQtd = document.querySelector('[data-resumo-qtd]');
  const campoSubtotal = document.querySelector('[data-resumo-subtotal]');
  const campoTotal = document.querySelector('[data-resumo-total]');

  if (campoQtd) campoQtd.textContent = `${quantidade} ${quantidade === 1 ? 'item' : 'itens'}`;
  if (campoSubtotal) campoSubtotal.textContent = formatarPreco(total);
  if (campoTotal) campoTotal.textContent = formatarPreco(total);
}

/** Cliques nos controles da sacola (delegação: a lista é recriada a cada mudança). */
function ligarControlesSacola() {
  const lista = document.querySelector('[data-lista-sacola]');
  if (!lista) return;

  lista.addEventListener('click', (evento) => {
    const menos = evento.target.closest('[data-sacola-menos]');
    const mais = evento.target.closest('[data-sacola-mais]');
    const remover = evento.target.closest('[data-sacola-remover]');

    if (menos) {
      const id = menos.dataset.sacolaMenos;
      const atual = lerSacola().find((i) => i.id === id);
      definirQuantidade(id, (atual ? atual.quantidade : 1) - 1);
    } else if (mais) {
      const id = mais.dataset.sacolaMais;
      const atual = lerSacola().find((i) => i.id === id);
      definirQuantidade(id, (atual ? atual.quantidade : 0) + 1);
    } else if (remover) {
      removerDaSacola(remover.dataset.sacolaRemover);
    }
  });

  lista.addEventListener('change', (evento) => {
    const campo = evento.target.closest('[data-sacola-qtd]');
    if (!campo) return;
    definirQuantidade(campo.dataset.sacolaQtd, parseInt(campo.value, 10) || 0);
  });
}


/* ==========================================================================
   Validação do formulário
   ========================================================================== */

/** Só os dígitos, sem máscara: "(61) 99627-2007" → "61996272007" */
function apenasDigitos(texto) {
  return (texto || '').replace(/\D/g, '');
}

/**
 * Normaliza um celular brasileiro para o formato aceito pelo WhatsApp:
 * 55 + DDD + número. Devolve null se não parecer um número válido.
 */
function normalizarWhatsApp(entrada) {
  let digitos = apenasDigitos(entrada);

  // Remove o código do país, se a pessoa digitou
  if (digitos.length > 11 && digitos.startsWith('55')) {
    digitos = digitos.slice(2);
  }

  // DDD (2) + celular (9) = 11 · DDD (2) + fixo (8) = 10
  if (digitos.length !== 10 && digitos.length !== 11) return null;

  // DDD brasileiro válido vai de 11 a 99
  const ddd = parseInt(digitos.slice(0, 2), 10);
  if (ddd < 11 || ddd > 99) return null;

  return '55' + digitos;
}

/** Formata para leitura: "61996272007" → "(61) 99627-2007" */
function formatarWhatsApp(digitosComPais) {
  const d = digitosComPais.replace(/^55/, '');
  const ddd = d.slice(0, 2);
  const resto = d.slice(2);
  const meio = resto.length === 9 ? resto.slice(0, 5) : resto.slice(0, 4);
  const fim = resto.length === 9 ? resto.slice(5) : resto.slice(4);
  return `(${ddd}) ${meio}-${fim}`;
}

function emailValido(email) {
  // Checagem prática: algo@algo.tld, sem espaços. Não tenta cobrir a RFC 5322
  // inteira — o objetivo é pegar erro de digitação, não validar juridicamente.
  return /^[^\s@]+@[^\s@]+\.[a-zA-Z]{2,}$/.test((email || '').trim());
}

function definirErro(campo, mensagem) {
  const alvo = document.querySelector(`[data-erro="${campo}"]`);
  const entrada = document.querySelector(`[name="${campo}"]`);

  if (alvo) alvo.textContent = mensagem || '';
  if (entrada) {
    if (mensagem) entrada.setAttribute('aria-invalid', 'true');
    else entrada.removeAttribute('aria-invalid');
  }
}

function limparErros() {
  ['nome', 'whatsapp', 'email', 'consentimento'].forEach((campo) => definirErro(campo, ''));
  const geral = document.querySelector('[data-erro-geral]');
  if (geral) geral.hidden = true;
}

/**
 * Valida o formulário inteiro.
 * @returns {object|null} dados limpos, ou null se houver erro
 */
function validarFormulario(form) {
  limparErros();

  const nome = form.nome.value.trim();
  const whatsapp = normalizarWhatsApp(form.whatsapp.value);
  const email = form.email.value.trim();
  const observacao = form.observacao.value.trim();
  const consentiu = form.consentimento.checked;

  let primeiroErro = null;

  if (nome.length < 3) {
    definirErro('nome', 'Digite seu nome completo.');
    primeiroErro = primeiroErro || form.nome;
  }

  if (!whatsapp) {
    definirErro('whatsapp', 'Digite um número com DDD, ex: (61) 99999-9999.');
    primeiroErro = primeiroErro || form.whatsapp;
  }

  if (!emailValido(email)) {
    definirErro('email', 'Digite um e-mail válido.');
    primeiroErro = primeiroErro || form.email;
  }

  if (!consentiu) {
    definirErro('consentimento', 'Precisamos da sua autorização para seguir.');
    primeiroErro = primeiroErro || form.consentimento;
  }

  if (primeiroErro) {
    primeiroErro.focus();
    return null;
  }

  return { nome, whatsapp, email, observacao };
}


/* ==========================================================================
   Envio para a planilha do Google
   ========================================================================== */

/**
 * Grava o pedido na planilha via Google Apps Script.
 *
 * Usamos `mode: 'no-cors'` com Content-Type text/plain de propósito: o Apps
 * Script não responde à requisição OPTIONS de preflight, e text/plain é uma
 * "requisição simples" que não dispara preflight nenhum. O preço disso é que
 * a resposta vem opaca — não dá para saber se gravou.
 *
 * Por isso o pedido também é salvo no localStorage e o WhatsApp continua
 * sendo o canal garantido: nenhuma venda se perde se a planilha falhar.
 */
async function enviarParaPlanilha(pedido) {
  if (!APPS_SCRIPT_URL) {
    console.info(
      'APPS_SCRIPT_URL está vazio em js/config.js — o pedido não foi enviado ' +
      'para a planilha. Veja apps-script/README.md para configurar.'
    );
    return false;
  }

  try {
    await fetch(APPS_SCRIPT_URL, {
      method: 'POST',
      mode: 'no-cors',
      headers: { 'Content-Type': 'text/plain;charset=utf-8' },
      body: JSON.stringify(pedido),
    });
    return true;
  } catch (erro) {
    console.warn('Falha ao enviar o pedido para a planilha:', erro);
    return false;
  }
}

/** Cópia local de segurança dos pedidos feitos neste navegador. */
function salvarPedidoLocalmente(pedido) {
  try {
    const anteriores = JSON.parse(localStorage.getItem(CHAVE_PEDIDOS) || '[]');
    anteriores.push(pedido);
    // Mantém só os 50 mais recentes, para não estourar a cota do localStorage
    localStorage.setItem(CHAVE_PEDIDOS, JSON.stringify(anteriores.slice(-50)));
  } catch (erro) {
    console.warn('Não foi possível salvar o pedido localmente:', erro);
  }
}


/* ==========================================================================
   Estado C — pagamento
   ========================================================================== */

function mensagemWhatsApp(pedido) {
  const linhas = [
    'Olá! Acabei de fazer um pedido no site da Lumierre.',
    '',
    `*Pedido:* ${pedido.txid}`,
    `*Itens:* ${pedido.itens}`,
    `*Total:* ${formatarPreco(pedido.total)}`,
    `*Nome:* ${pedido.nome}`,
    `*E-mail:* ${pedido.email}`,
  ];

  if (pedido.observacao) linhas.push(`*Observação:* ${pedido.observacao}`);

  linhas.push('', 'Segue o comprovante do Pix:');
  return linhas.join('\n');
}

function renderizarPagamento(pedido) {
  document.querySelector('[data-pix-valor]').textContent = formatarPreco(pedido.total);
  document.querySelector('[data-pix-nome]').textContent = PIX.nome;
  document.querySelector('[data-pix-txid]').textContent = pedido.txid;
  document.querySelector('[data-pix-codigo]').value = pedido.payload;

  const botaoWhats = document.querySelector('[data-btn-whatsapp]');
  if (botaoWhats) botaoWhats.href = linkWhatsApp(mensagemWhatsApp(pedido));

  desenharQR(pedido.payload);
  mostrarEstado('pagamento');
  window.scrollTo({ top: 0, behavior: 'smooth' });
}

/**
 * Desenha o QR Code. Se o codificador local falhar por qualquer motivo,
 * cai para uma imagem gerada por serviço externo. E se nem isso funcionar,
 * o Copia e Cola logo abaixo continua resolvendo o pagamento.
 */
function desenharQR(payload) {
  const caixa = document.querySelector('[data-pix-qr]');
  const canvas = document.querySelector('[data-pix-canvas]');
  const aviso = document.querySelector('[data-pix-erro]');

  try {
    const matriz = QR.gerar(payload, 'M');
    QR.desenharNoCanvas(canvas, matriz, {
      escala: 5,
      margem: 4,
      corEscura: '#2E2A26',
      corClara: '#FFFFFF',
    });
    if (aviso) aviso.hidden = true;
  } catch (erro) {
    console.warn('Codificador local de QR falhou, usando imagem externa:', erro);

    const imagem = document.createElement('img');
    imagem.alt = 'QR Code do Pix';
    imagem.width = 260;
    imagem.height = 260;
    imagem.src =
      'https://api.qrserver.com/v1/create-qr-code/?size=260x260&margin=8&data=' +
      encodeURIComponent(payload);

    imagem.onerror = () => {
      caixa.hidden = true;
      if (aviso) {
        aviso.hidden = false;
        aviso.textContent =
          'Não conseguimos exibir o QR Code aqui. Use o código "Copia e Cola" ' +
          'logo abaixo — ele funciona do mesmo jeito no app do seu banco.';
      }
    };

    caixa.innerHTML = '';
    caixa.appendChild(imagem);
  }
}


/* ==========================================================================
   Envio do formulário
   ========================================================================== */

async function aoEnviarFormulario(evento) {
  evento.preventDefault();
  const form = evento.currentTarget;
  const botao = form.querySelector('[data-btn-gerar]');
  const erroGeral = document.querySelector('[data-erro-geral]');

  const dados = validarFormulario(form);
  if (!dados) return;

  const itens = sacolaDetalhada();
  if (!itens.length) {
    mostrarEstado('vazio');
    return;
  }

  const total = totalDaSacola();
  const txid = gerarTxid();

  // Monta o Pix e confere o CRC ANTES de mostrar qualquer coisa ao cliente.
  // Um QR com checksum errado é recusado pelo banco, e é melhor descobrir
  // aqui do que na frente da pessoa.
  let payload;
  try {
    payload = gerarPayloadPix({
      chave: PIX.chave,
      nome: PIX.nome,
      cidade: PIX.cidade,
      valor: total,
      txid,
    });

    if (!validarPayloadPix(payload)) {
      throw new Error('Checksum do payload Pix não confere.');
    }
  } catch (erro) {
    console.error('Falha ao gerar o Pix:', erro);
    if (erroGeral) {
      erroGeral.hidden = false;
      erroGeral.textContent =
        'Não conseguimos gerar o Pix agora. Fale com a gente pelo WhatsApp ' +
        `${CONTATO.whatsappExibicao} que finalizamos seu pedido por lá.`;
    }
    return;
  }

  const pedido = {
    txid,
    data: new Date().toISOString(),
    nome: dados.nome,
    whatsapp: formatarWhatsApp(dados.whatsapp),
    whatsappDigitos: dados.whatsapp,
    email: dados.email,
    observacao: dados.observacao,
    itens: resumoDaSacolaTexto(),
    quantidade: totalDeItens(),
    total,
    payload,
    origem: window.location.hostname || 'local',
  };

  botao.disabled = true;
  botao.textContent = 'Gerando Pix...';

  salvarPedidoLocalmente(pedido);
  await enviarParaPlanilha(pedido);

  pedidoAtual = pedido;
  renderizarPagamento(pedido);

  // A sacola só é esvaziada depois que o Pix está na tela — se algo desse
  // errado antes disso, o cliente não perderia o que escolheu.
  limparSacola();

  botao.disabled = false;
  botao.textContent = 'Gerar Pix e finalizar';
}


/* ==========================================================================
   Botão de copiar o código Pix
   ========================================================================== */

function ligarBotaoCopiar() {
  const botao = document.querySelector('[data-btn-copiar]');
  const campo = document.querySelector('[data-pix-codigo]');
  if (!botao || !campo) return;

  botao.addEventListener('click', async () => {
    const texto = campo.value;
    let copiou = false;

    // A Clipboard API só existe em contexto seguro (https ou localhost)
    if (navigator.clipboard && window.isSecureContext) {
      try {
        await navigator.clipboard.writeText(texto);
        copiou = true;
      } catch (erro) {
        copiou = false;
      }
    }

    // Fallback para http e navegadores antigos
    if (!copiou) {
      campo.removeAttribute('readonly');
      campo.select();
      campo.setSelectionRange(0, texto.length);
      try {
        copiou = document.execCommand('copy');
      } catch (erro) {
        copiou = false;
      }
      campo.setAttribute('readonly', '');
    }

    if (copiou) {
      feedbackBotao(botao, 'Código copiado ✓');
    } else {
      // Último recurso: deixa o texto selecionado para a pessoa copiar à mão
      campo.select();
      feedbackBotao(botao, 'Selecionado — copie com Ctrl+C');
    }
  });
}


/* ==========================================================================
   Inicialização
   ========================================================================== */

document.addEventListener('DOMContentLoaded', () => {
  const aviso = document.querySelector('[data-aviso-entrega]');
  if (aviso) aviso.textContent = AVISO_ENTREGA;

  const form = document.querySelector('[data-form-checkout]');
  if (form) form.addEventListener('submit', aoEnviarFormulario);

  ligarControlesSacola();
  ligarBotaoCopiar();
  renderizarSacola();
});

// Se a sacola mudar (aqui ou em outra aba), redesenha — exceto quando o
// cliente já está na tela de pagamento, para não arrancar o QR da frente dele.
document.addEventListener('sacola:mudou', () => {
  const pagamento = document.querySelector('[data-estado-pagamento]');
  if (pagamento && !pagamento.hidden) return;
  renderizarSacola();
});
