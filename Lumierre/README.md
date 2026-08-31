# Lumierre Boutique

Site vitrine com checkout via Pix. HTML, CSS e JavaScript puros — sem build,
sem npm, sem framework. É só abrir os arquivos e editar.

---

## Rodar na sua máquina

Abrir o `index.html` com dois cliques **não funciona** — o navegador bloqueia
o carregamento dos scripts em `file://`. Precisa de um servidor local. Com o
Python (já instalado nesta máquina), rode na pasta do projeto:

```bash
python -m http.server 8000
```

Depois abra <http://localhost:8000>.

---

## O que já está pronto

| Página | Arquivo |
|---|---|
| Início, com o vídeo em loop | `index.html` |
| Coleção (os 5 modelos) | `produtos.html` |
| Detalhe do modelo | `produto.html?id=azul` |
| Sacola e pagamento | `carrinho.html` |

Cabeçalho e rodapé (incluindo as FAQs) são montados por JavaScript a partir de
`js/ui.js`, então existem **num lugar só** — editando lá, as quatro páginas
mudam juntas.

---

## O que você provavelmente vai querer mudar

Quase tudo do dia a dia está em **`js/config.js`**: chave Pix, WhatsApp,
Instagram, preço e a URL da planilha.

| O quê | Onde |
|---|---|
| Chave Pix, nome e cidade do recebedor | `js/config.js` → `PIX` |
| WhatsApp e Instagram | `js/config.js` → `CONTATO` |
| Preço (hoje R$ 50,00, vale para todos) | `js/config.js` → `PRECO_UNITARIO` |
| URL da planilha do Google | `js/config.js` → `APPS_SCRIPT_URL` |
| Nomes, descrições e fotos dos modelos | `js/products.js` → `PRODUTOS` |
| Perguntas e respostas do rodapé | `js/ui.js` → `FAQS` |
| Cores da marca | `css/base.css` → bloco `:root` |

Todo texto provisório está marcado com `[PLACEHOLDER]` nos arquivos — dá para
achar todos com uma busca por essa palavra.

---

## Pendências antes de publicar

### 1. Ligar a planilha do Google (5 minutos)

Sem isso o site funciona, mas **não grava os pedidos em lugar nenhum** além do
navegador do próprio cliente. O passo a passo está em
[`apps-script/README.md`](apps-script/README.md).

### 2. Comprimir o vídeo e as fotos

Este é o ponto que mais vai custar venda, e vale resolver antes de divulgar:

| Arquivo | Hoje | Alvo |
|---|---|---|
| `lumierre2_202608301848.mp4` | **8,9 MB** | ~2 MB |
| Cada `.jpg` (são 10) | ~1 MB | ~150 KB |

No 4G, 8,9 MB de vídeo levam vários segundos só para a primeira tela aparecer —
e a maior parte do seu público vem de link do Instagram e do WhatsApp, ou seja,
quase todo mundo no celular. O `poster` já evita a tela em branco, mas o peso
continua lá.

Dá para resolver sem instalar nada em <https://squoosh.app> (imagens) e
<https://www.freeconvert.com/video-compressor> (vídeo). Se preferir linha de
comando e tiver o ffmpeg:

```bash
ffmpeg -i assets/lumierre2_202608301848.mp4 -vcodec libx264 -crf 28 -preset slow -an -movflags +faststart assets/hero.mp4
```

O `-an` remove o áudio (o vídeo toca mudo de qualquer jeito) e o
`-movflags +faststart` faz ele começar a tocar antes de baixar inteiro. Depois
é só apontar o `<source>` do `index.html` para o arquivo novo.

### 3. Testar o Pix de verdade

Abra a sacola, gere um Pix e **escaneie com o app do seu banco**. A tela de
revisão mostra o recebedor e o valor **antes** de você confirmar, então dá para
validar sem pagar nada. Confira se aparece `GABRIEL ALMEIDA HANAI`.

---

## Publicar na internet

Qualquer uma destas hospedagens serve, todas de graça, e nenhuma exige build:

- **Netlify Drop** — <https://app.netlify.com/drop>. Arraste a pasta do
  projeto na página. Leva uns 30 segundos e é o caminho mais rápido.
- **Vercel** — <https://vercel.com>. Conecte o repositório e publique.
- **GitHub Pages** — suba o repositório e ative Pages nas configurações.

Depois de publicar, vale registrar um domínio (algo como `lumierre.com.br`) e
apontar para a hospedagem — o link fica muito melhor na bio do Instagram do que
uma URL genérica.

---

## Como funciona o pagamento

O Pix é gerado **inteiramente no navegador do cliente**, sem API, sem conta em
gateway e sem custo por transação. O código em `js/pix.js` monta o BR Code
(padrão EMV do Banco Central) e `js/qrcode.js` desenha o QR.

**O site não confirma o pagamento sozinho.** Isso exigiria um gateway com
webhook e um servidor. O fluxo desenhado é:

1. Cliente escolhe os modelos e preenche nome, WhatsApp e e-mail.
2. O site gera o QR Code com o valor já preenchido e um código de pedido
   (ex.: `LMRYXMZQ5E`).
3. Os dados vão para a sua planilha.
4. Cliente paga e clica em **Enviar comprovante no WhatsApp** — a mensagem já
   vai escrita com o pedido, o valor e o código.
5. Você confere o Pix na conta e combina a entrega.

O código do pedido serve para casar "esse Pix que caiu" com "essa linha da
planilha".

---

## Estrutura

```
index.html · produtos.html · produto.html · carrinho.html
css/
  base.css          reset, cores da marca, tipografia
  layout.css        cabeçalho, rodapé, grades, hero
  components.css    botões, cards, formulários, QR
js/
  config.js         >>> comece por aqui <<<
  products.js       catálogo dos 5 modelos
  cart.js           sacola (localStorage)
  pix.js            BR Code do Pix + CRC16
  qrcode.js         codificador de QR (implementação própria)
  ui.js             cabeçalho, rodapé, FAQs, menu
  pagina-produto.js página de detalhe
  checkout.js       sacola e pagamento
apps-script/
  Code.gs           script da planilha
  README.md         como publicar
assets/             fotos e vídeo
```

---

## Detalhes que valem saber

**A chave Pix fica visível no código-fonte da página.** É o esperado — chave
Pix existe para ser divulgada, é como as pessoas te pagam.

**A sacola fica no navegador do cliente** (`localStorage`). Se ele trocar de
aparelho ou limpar os dados, a sacola some. Como não há login, isso é esperado.

**Nenhum pedido se perde se a planilha falhar.** Todo pedido também é gravado
no navegador do cliente, e o botão do WhatsApp leva o pedido inteiro escrito na
mensagem.

**Sobre as cores:** a paleta da marca é `#F4EFEB`, `#6B6058` e `#FFFFFF`. O
taupe sobre o areia dá só ~3.4:1 de contraste, abaixo do mínimo de legibilidade
para texto corrido — em celular, no sol, cansa de ler. Por isso o taupe é usado
em títulos, bordas e texto secundário, e o texto longo usa `--tinta`
(`#2E2A26`), que é o mesmo tom levado ao escuro. Visualmente é a mesma paleta.
