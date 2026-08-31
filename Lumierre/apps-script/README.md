# Ligar o site à sua planilha do Google

Isso faz cada pedido do site virar uma linha numa planilha sua. É gratuito,
não precisa de cartão e leva uns 5 minutos. Faça uma vez só.

---

## 1. Criar a planilha

1. Abra <https://sheets.google.com> e crie uma planilha em branco.
2. Dê um nome a ela — por exemplo **Pedidos Lumierre**.

Não precisa criar colunas nem abas: o script monta tudo sozinho no primeiro
pedido que chegar.

---

## 2. Colar o script

1. Na planilha, vá em **Extensões → Apps Script**.
2. Vai abrir um editor com um arquivo `Código.gs` contendo uma função vazia.
   **Apague tudo o que estiver lá.**
3. Abra o arquivo `Code.gs` desta pasta, copie o conteúdo inteiro e cole no
   editor.
4. Clique no ícone de disquete (**Salvar projeto**).

---

## 3. Testar antes de publicar

Vale conferir que a gravação funciona antes de mexer no site:

1. No editor, na barra de cima, escolha a função **`testarGravacao`**.
2. Clique em **Executar**.
3. Na primeira vez o Google pede autorização:
   - **Revisar permissões** → escolha sua conta Google
   - Vai aparecer um aviso de "app não verificado". É esperado — o app é
     **seu**, feito por você, e o Google marca assim qualquer script pessoal
     não publicado na loja dele.
   - Clique em **Avançado → Acessar (nome do projeto)** e depois em
     **Permitir**.
4. Volte para a planilha. Deve ter aparecido uma aba **Pedidos** com o
   cabeçalho e uma linha de teste.

Deu certo? Pode apagar a linha de teste e seguir.

---

## 4. Publicar como app da web

1. No editor, clique em **Implantar → Nova implantação**.
2. No ícone de engrenagem ao lado de "Selecione o tipo", escolha
   **App da Web**.
3. Preencha assim:

   | Campo | O que escolher |
   |---|---|
   | Descrição | `Recebedor de pedidos` (ou o que quiser) |
   | Executar como | **Eu** (seu e-mail) |
   | Quem pode acessar | **Qualquer pessoa** |

   > **"Qualquer pessoa" assusta, mas é o certo aqui.** O site precisa
   > conseguir enviar o pedido sem que o cliente faça login numa conta Google.
   > Isso permite que qualquer um **grave** uma linha; ninguém consegue
   > **ler** sua planilha por essa URL. O risco real é alguém que descubra a
   > URL inserir linhas de lixo — se isso um dia acontecer, é só criar uma
   > nova implantação, o que gera uma URL nova, e atualizar o `config.js`.

4. Clique em **Implantar**.
5. Copie a **URL do app da web**. Ela se parece com:

   ```
   https://script.google.com/macros/s/AKfycb...../exec
   ```

---

## 5. Colar a URL no site

Abra `js/config.js` (na raiz do projeto) e cole a URL entre as aspas:

```js
const APPS_SCRIPT_URL = 'https://script.google.com/macros/s/AKfycb...../exec';
```

Pronto. O próximo pedido feito no site já cai na planilha.

---

## 6. Conferir que funcionou

1. Abra a URL do app da web direto no navegador. Deve aparecer:
   `{"ok":true,"mensagem":"Recebedor de pedidos da Lumierre Boutique está no ar."}`
2. Faça um pedido de teste no site, do começo ao fim.
3. Confira se a linha apareceu na planilha.

---

## Perguntas que costumam aparecer

**Mudei o script. Preciso publicar de novo?**
Sim. **Implantar → Gerenciar implantações →** ícone de lápis **→ Versão: Nova
versão → Implantar**. Fazendo assim a URL **não muda** e você não precisa
mexer no `config.js`. Só "Nova implantação" é que gera URL nova.

**O pedido não apareceu na planilha. E agora?**
O site não consegue saber se a gravação deu certo (é uma limitação do Apps
Script explicada em `js/checkout.js`), então ele nunca vai avisar de erro.
Para investigar, abra o editor do Apps Script e veja **Execuções** no menu da
esquerda — os erros ficam registrados ali. As causas mais comuns são a URL
errada no `config.js`, ter esquecido de publicar depois de alterar o script,
ou "Quem pode acessar" não estar em **Qualquer pessoa**.

**Nenhum pedido se perde se a planilha falhar?**
Não. Todo pedido também fica salvo no navegador do cliente e o botão
"Enviar comprovante no WhatsApp" leva o pedido completo escrito na mensagem —
esse é o canal garantido.

**Quero receber um e-mail a cada pedido.**
Dá para adicionar dentro do `doPost`, logo depois do `appendRow`:

```js
MailApp.sendEmail(
  'seu-email@gmail.com',
  'Novo pedido: ' + pedido.txid,
  pedido.nome + ' — ' + pedido.itens + ' — R$ ' + pedido.total
);
```

Lembre de publicar de novo depois de alterar (veja a primeira pergunta).
