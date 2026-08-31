/* ==========================================================================
   LUMIERRE BOUTIQUE — Configuração central
   --------------------------------------------------------------------------
   TUDO que você pode precisar trocar no dia a dia está NESTE arquivo.
   Não é preciso mexer em nenhum outro .js para mudar preço, contato ou Pix.
   ========================================================================== */


/* --------------------------------------------------------------------------
   1. PIX  —  usado para gerar o QR Code e o "Copia e Cola"
   --------------------------------------------------------------------------
   ATENÇÃO ao formato: o padrão do Banco Central (BR Code) só aceita letras
   ASCII MAIÚSCULAS nos campos "nome" e "cidade". Acento quebra o QR.
     • nome   → máximo 25 caracteres  (é o que aparece no app de quem paga)
     • cidade → máximo 15 caracteres  (só o município, sem o UF)
   -------------------------------------------------------------------------- */
const PIX = {
  chave:  'gabrielhanai1@gmail.com',
  nome:   'GABRIEL ALMEIDA HANAI',   // 21/25 caracteres
  cidade: 'BRASILIA',                //  8/15 caracteres
};


/* --------------------------------------------------------------------------
   2. Contato
   --------------------------------------------------------------------------
   whatsappNumero: só dígitos, com 55 (Brasil) + DDD. Sem +, espaço ou traço.
   -------------------------------------------------------------------------- */
const CONTATO = {
  whatsappNumero:   '5561996272007',
  whatsappExibicao: '(61) 99627-2007',
  instagram:        'lumierreboutique',
};


/* --------------------------------------------------------------------------
   3. Preço
   --------------------------------------------------------------------------
   Todos os modelos custam o mesmo. Trocar aqui muda o site inteiro.
   -------------------------------------------------------------------------- */
const PRECO_UNITARIO = 50.00;


/* --------------------------------------------------------------------------
   4. Google Sheets  —  onde os pedidos são gravados
   --------------------------------------------------------------------------
   Siga o passo a passo em  apps-script/README.md , copie a URL do app da web
   publicado e cole entre as aspas abaixo.

   Enquanto estiver vazio ('') o site funciona normalmente — só não grava na
   planilha. O pedido continua salvo no navegador e vai pelo WhatsApp.
   -------------------------------------------------------------------------- */
const APPS_SCRIPT_URL = 'https://script.google.com/macros/s/AKfycbziQ5URLZm4sYjgpY7A1vKA09RDgOPKFFdKhisyeYRSxp9s9Da97sf8HeQgZqV74UDN/exec';


/* --------------------------------------------------------------------------
   5. Frete / entrega  —  texto livre mostrado no checkout
   -------------------------------------------------------------------------- */
const AVISO_ENTREGA =
  'Combinamos a entrega pelo WhatsApp logo após a confirmação do pagamento.';
