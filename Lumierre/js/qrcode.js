/* ==========================================================================
   LUMIERRE BOUTIQUE — Codificador de QR Code
   --------------------------------------------------------------------------
   Implementação própria do padrão ISO/IEC 18004, modo byte (UTF-8), versões
   1 a 40, com seleção automática de versão e da melhor máscara.

   Por que escrever em vez de usar uma biblioteca pronta: esta máquina não tem
   npm, e puxar um script de CDN criaria uma dependência externa numa página
   de pagamento. Assim o arquivo é auto-contido e funciona offline.

   Uso:
       const matriz = QR.gerar('texto qualquer');   // array 2D de booleanos
       QR.desenharNoCanvas(canvas, matriz, { escala: 6, margem: 4 });
   ========================================================================== */

const QR = (function () {
  'use strict';

  /* ---------------------------------------------------------------------
     Tabelas do padrão
     ---------------------------------------------------------------------
     Índice = número da versão (1 a 40). A posição 0 não existe (-1).
     --------------------------------------------------------------------- */

  // Quantidade de codewords de correção de erro POR BLOCO
  const ECC_POR_BLOCO = {
    L: [-1, 7, 10, 15, 20, 26, 18, 20, 24, 30, 18, 20, 24, 26, 30, 22, 24, 28, 30, 28, 28, 28, 28, 30, 30, 26, 28, 30, 30, 30, 30, 30, 30, 30, 30, 30, 30, 30, 30, 30, 30],
    M: [-1, 10, 16, 26, 18, 24, 16, 18, 22, 22, 26, 30, 22, 22, 24, 24, 28, 28, 26, 26, 26, 26, 28, 28, 28, 28, 28, 28, 28, 28, 28, 28, 28, 28, 28, 28, 28, 28, 28, 28, 28],
    Q: [-1, 13, 22, 18, 26, 18, 24, 18, 22, 20, 24, 28, 26, 24, 20, 30, 24, 28, 28, 26, 30, 28, 30, 30, 30, 30, 28, 30, 30, 30, 30, 30, 30, 30, 30, 30, 30, 30, 30, 30, 30],
    H: [-1, 17, 28, 22, 16, 22, 28, 26, 26, 24, 28, 24, 28, 22, 24, 24, 30, 28, 28, 26, 28, 30, 24, 30, 30, 30, 30, 30, 30, 30, 30, 30, 30, 30, 30, 30, 30, 30, 30, 30, 30],
  };

  // Quantidade de blocos de correção de erro
  const NUM_BLOCOS_ECC = {
    L: [-1, 1, 1, 1, 1, 1, 2, 2, 2, 2, 4, 4, 4, 4, 4, 6, 6, 6, 6, 7, 8, 8, 9, 9, 10, 12, 12, 12, 13, 14, 15, 16, 17, 18, 19, 19, 20, 21, 22, 24, 25],
    M: [-1, 1, 1, 1, 2, 2, 4, 4, 4, 5, 5, 5, 8, 9, 9, 10, 10, 11, 13, 14, 16, 17, 17, 18, 20, 21, 23, 25, 26, 28, 29, 31, 33, 35, 37, 38, 40, 43, 45, 47, 49],
    Q: [-1, 1, 1, 2, 2, 4, 4, 6, 6, 8, 8, 8, 10, 12, 16, 12, 17, 16, 18, 21, 20, 23, 23, 25, 27, 29, 34, 34, 35, 38, 40, 43, 45, 48, 51, 53, 56, 59, 62, 65, 68],
    H: [-1, 1, 1, 2, 4, 4, 4, 5, 5, 8, 8, 11, 11, 16, 16, 18, 16, 19, 21, 25, 25, 25, 34, 30, 32, 35, 37, 40, 42, 45, 48, 51, 54, 57, 60, 63, 66, 70, 74, 77, 81],
  };

  // Bits de formato de cada nível de correção (não seguem a ordem L<M<Q<H)
  const BITS_FORMATO_ECC = { L: 1, M: 0, Q: 3, H: 2 };


  /* ---------------------------------------------------------------------
     Cálculos de capacidade
     --------------------------------------------------------------------- */

  /** Total de módulos disponíveis para dados+ECC numa versão (em bits). */
  function modulosBrutos(versao) {
    let total = (16 * versao + 128) * versao + 64;
    if (versao >= 2) {
      const numAlinhamento = Math.floor(versao / 7) + 2;
      total -= (25 * numAlinhamento - 10) * numAlinhamento - 55;
      if (versao >= 7) total -= 36; // área da informação de versão
    }
    return total;
  }

  /** Quantas codewords de DADOS cabem numa versão, para um nível de ECC. */
  function codewordsDeDados(versao, ecc) {
    return Math.floor(modulosBrutos(versao) / 8)
      - ECC_POR_BLOCO[ecc][versao] * NUM_BLOCOS_ECC[ecc][versao];
  }

  /** No modo byte o contador de caracteres tem 8 bits até a v9 e 16 daí em diante. */
  function bitsDoContador(versao) {
    return versao <= 9 ? 8 : 16;
  }

  /** Posições dos padrões de alinhamento (linhas e colunas). */
  function posicoesAlinhamento(versao) {
    if (versao === 1) return [];
    const quantidade = Math.floor(versao / 7) + 2;
    const passo = versao === 32
      ? 26
      : Math.ceil((versao * 4 + 4) / (quantidade * 2 - 2)) * 2;
    const posicoes = [6];
    for (let pos = versao * 4 + 10; posicoes.length < quantidade; pos -= passo) {
      posicoes.splice(1, 0, pos);
    }
    return posicoes;
  }


  /* ---------------------------------------------------------------------
     Reed-Solomon sobre o corpo finito GF(256), polinômio 0x11D
     --------------------------------------------------------------------- */

  function rsMultiplicar(x, y) {
    let z = 0;
    for (let i = 7; i >= 0; i--) {
      z = (z << 1) ^ ((z >>> 7) * 0x11d);
      z ^= ((y >>> i) & 1) * x;
    }
    return z & 0xff;
  }

  /** Polinômio gerador de grau `grau`. */
  function rsDivisor(grau) {
    const resultado = new Array(grau).fill(0);
    resultado[grau - 1] = 1;

    let raiz = 1;
    for (let i = 0; i < grau; i++) {
      for (let j = 0; j < resultado.length; j++) {
        resultado[j] = rsMultiplicar(resultado[j], raiz);
        if (j + 1 < resultado.length) resultado[j] ^= resultado[j + 1];
      }
      raiz = rsMultiplicar(raiz, 0x02);
    }
    return resultado;
  }

  /** Resto da divisão — são os bytes de correção de erro. */
  function rsResto(dados, divisor) {
    const resultado = new Array(divisor.length).fill(0);
    for (const b of dados) {
      const fator = b ^ resultado.shift();
      resultado.push(0);
      for (let i = 0; i < divisor.length; i++) {
        resultado[i] ^= rsMultiplicar(divisor[i], fator);
      }
    }
    return resultado;
  }


  /* ---------------------------------------------------------------------
     Montagem do fluxo de bits
     --------------------------------------------------------------------- */

  function textoParaBytes(texto) {
    // encodeURIComponent + unescape é a forma clássica e confiável de obter
    // os bytes UTF-8; o payload Pix é ASCII, mas isso protege acentos.
    const bytes = [];
    const utf8 = unescape(encodeURIComponent(texto));
    for (let i = 0; i < utf8.length; i++) bytes.push(utf8.charCodeAt(i));
    return bytes;
  }

  function anexarBits(buffer, valor, quantidade) {
    for (let i = quantidade - 1; i >= 0; i--) {
      buffer.push((valor >>> i) & 1);
    }
  }

  /** Menor versão que comporta os dados. Lança erro se não couber em nenhuma. */
  function escolherVersao(numBytes, ecc) {
    for (let versao = 1; versao <= 40; versao++) {
      const capacidadeBits = codewordsDeDados(versao, ecc) * 8;
      const necessarioBits = 4 + bitsDoContador(versao) + numBytes * 8;
      if (necessarioBits <= capacidadeBits) return versao;
    }
    throw new Error('Conteúdo grande demais para um QR Code.');
  }

  /** Bits de dados com terminador e preenchimento até completar as codewords. */
  function montarCodewordsDeDados(bytes, versao, ecc) {
    const bits = [];
    anexarBits(bits, 0b0100, 4);                       // indicador de modo: byte
    anexarBits(bits, bytes.length, bitsDoContador(versao));
    for (const b of bytes) anexarBits(bits, b, 8);

    const capacidadeBits = codewordsDeDados(versao, ecc) * 8;

    // Terminador: até 4 zeros
    anexarBits(bits, 0, Math.min(4, capacidadeBits - bits.length));
    // Completa o byte corrente
    anexarBits(bits, 0, (8 - (bits.length % 8)) % 8);

    // Preenchimento alternado 0xEC / 0x11 definido pelo padrão
    for (let preenchimento = 0xec; bits.length < capacidadeBits; preenchimento ^= 0xec ^ 0x11) {
      anexarBits(bits, preenchimento, 8);
    }

    const codewords = [];
    for (let i = 0; i < bits.length; i += 8) {
      let byte = 0;
      for (let j = 0; j < 8; j++) byte = (byte << 1) | bits[i + j];
      codewords.push(byte);
    }
    return codewords;
  }

  /** Divide em blocos, calcula o ECC de cada um e intercala tudo. */
  function adicionarEccEIntercalar(dados, versao, ecc) {
    const numBlocos = NUM_BLOCOS_ECC[ecc][versao];
    const eccPorBloco = ECC_POR_BLOCO[ecc][versao];
    const totalCodewords = Math.floor(modulosBrutos(versao) / 8);
    const blocosCurtos = numBlocos - (totalCodewords % numBlocos);
    const tamanhoBlocoCurto = Math.floor(totalCodewords / numBlocos);

    const blocos = [];
    const divisor = rsDivisor(eccPorBloco);

    for (let i = 0, k = 0; i < numBlocos; i++) {
      const tamanhoDados =
        tamanhoBlocoCurto - eccPorBloco + (i < blocosCurtos ? 0 : 1);
      const bloco = dados.slice(k, k + tamanhoDados);
      k += tamanhoDados;

      const correcao = rsResto(bloco, divisor);
      // Blocos curtos ganham um byte fantasma para alinhar a intercalação;
      // ele é descartado na hora de montar o resultado final.
      if (i < blocosCurtos) bloco.push(0);
      blocos.push(bloco.concat(correcao));
    }

    const resultado = [];
    for (let i = 0; i < blocos[0].length; i++) {
      for (let j = 0; j < blocos.length; j++) {
        const ehBytefantasma =
          i === tamanhoBlocoCurto - eccPorBloco && j < blocosCurtos;
        if (!ehBytefantasma) resultado.push(blocos[j][i]);
      }
    }
    return resultado;
  }


  /* ---------------------------------------------------------------------
     Desenho da matriz
     --------------------------------------------------------------------- */

  function criarMatriz(versao, ecc, codewords) {
    const tamanho = versao * 4 + 17;
    const modulos = Array.from({ length: tamanho }, () => new Array(tamanho).fill(false));
    const ehFuncional = Array.from({ length: tamanho }, () => new Array(tamanho).fill(false));

    function setFuncional(x, y, escuro) {
      if (x < 0 || y < 0 || x >= tamanho || y >= tamanho) return;
      modulos[y][x] = escuro;
      ehFuncional[y][x] = true;
    }

    function bit(valor, posicao) {
      return ((valor >>> posicao) & 1) !== 0;
    }

    /* --- padrões localizadores (os três quadrados dos cantos) --- */
    function desenharLocalizador(cx, cy) {
      for (let dy = -4; dy <= 4; dy++) {
        for (let dx = -4; dx <= 4; dx++) {
          const distancia = Math.max(Math.abs(dx), Math.abs(dy));
          setFuncional(cx + dx, cy + dy, distancia !== 2 && distancia !== 4);
        }
      }
    }

    /* --- padrões de alinhamento (quadradinhos internos) --- */
    function desenharAlinhamento(cx, cy) {
      for (let dy = -2; dy <= 2; dy++) {
        for (let dx = -2; dx <= 2; dx++) {
          setFuncional(cx + dx, cy + dy, Math.max(Math.abs(dx), Math.abs(dy)) !== 1);
        }
      }
    }

    /* --- informação de formato (nível de ECC + máscara), BCH(15,5) --- */
    function desenharFormato(mascara) {
      const dados = (BITS_FORMATO_ECC[ecc] << 3) | mascara;
      let resto = dados;
      for (let i = 0; i < 10; i++) resto = (resto << 1) ^ ((resto >>> 9) * 0x537);
      const bits = ((dados << 10) | resto) ^ 0x5412;

      // Cópia 1: em volta do localizador superior esquerdo
      for (let i = 0; i <= 5; i++) setFuncional(8, i, bit(bits, i));
      setFuncional(8, 7, bit(bits, 6));
      setFuncional(8, 8, bit(bits, 7));
      setFuncional(7, 8, bit(bits, 8));
      for (let i = 9; i < 15; i++) setFuncional(14 - i, 8, bit(bits, i));

      // Cópia 2: espalhada pelos outros dois localizadores
      for (let i = 0; i < 8; i++) setFuncional(tamanho - 1 - i, 8, bit(bits, i));
      for (let i = 8; i < 15; i++) setFuncional(8, tamanho - 15 + i, bit(bits, i));

      setFuncional(8, tamanho - 8, true); // módulo escuro, sempre presente
    }

    /* --- informação de versão, só a partir da v7, BCH(18,6) --- */
    function desenharVersao() {
      if (versao < 7) return;
      let resto = versao;
      for (let i = 0; i < 12; i++) resto = (resto << 1) ^ ((resto >>> 11) * 0x1f25);
      const bits = (versao << 12) | resto;

      for (let i = 0; i < 18; i++) {
        const escuro = bit(bits, i);
        const a = tamanho - 11 + (i % 3);
        const b = Math.floor(i / 3);
        setFuncional(a, b, escuro);
        setFuncional(b, a, escuro);
      }
    }

    /* --- padrões fixos --- */
    for (let i = 0; i < tamanho; i++) {
      setFuncional(6, i, i % 2 === 0); // linha de tempo vertical
      setFuncional(i, 6, i % 2 === 0); // linha de tempo horizontal
    }

    desenharLocalizador(3, 3);
    desenharLocalizador(tamanho - 4, 3);
    desenharLocalizador(3, tamanho - 4);

    const alinhamentos = posicoesAlinhamento(versao);
    for (let i = 0; i < alinhamentos.length; i++) {
      for (let j = 0; j < alinhamentos.length; j++) {
        // os três cantos já têm localizador, pula
        const cantoSuperiorEsquerdo = i === 0 && j === 0;
        const cantoSuperiorDireito = i === 0 && j === alinhamentos.length - 1;
        const cantoInferiorEsquerdo = i === alinhamentos.length - 1 && j === 0;
        if (cantoSuperiorEsquerdo || cantoSuperiorDireito || cantoInferiorEsquerdo) continue;
        desenharAlinhamento(alinhamentos[j], alinhamentos[i]);
      }
    }

    desenharFormato(0); // placeholder, reescrito depois com a máscara escolhida
    desenharVersao();

    /* --- dados, em zigue-zague de baixo para cima --- */
    let indiceBit = 0;
    for (let direita = tamanho - 1; direita >= 1; direita -= 2) {
      if (direita === 6) direita = 5; // pula a coluna da linha de tempo
      for (let vertical = 0; vertical < tamanho; vertical++) {
        for (let j = 0; j < 2; j++) {
          const x = direita - j;
          const subindo = ((direita + 1) & 2) === 0;
          const y = subindo ? tamanho - 1 - vertical : vertical;
          if (!ehFuncional[y][x] && indiceBit < codewords.length * 8) {
            modulos[y][x] = bit(codewords[indiceBit >>> 3], 7 - (indiceBit & 7));
            indiceBit++;
          }
        }
      }
    }

    return { modulos, ehFuncional, tamanho, desenharFormato };
  }


  /* ---------------------------------------------------------------------
     Máscaras e pontuação de penalidade
     --------------------------------------------------------------------- */

  const CONDICOES_MASCARA = [
    (x, y) => (x + y) % 2 === 0,
    (x, y) => y % 2 === 0,
    (x) => x % 3 === 0,
    (x, y) => (x + y) % 3 === 0,
    (x, y) => (Math.floor(x / 3) + Math.floor(y / 2)) % 2 === 0,
    (x, y) => ((x * y) % 2) + ((x * y) % 3) === 0,
    (x, y) => (((x * y) % 2) + ((x * y) % 3)) % 2 === 0,
    (x, y) => (((x + y) % 2) + ((x * y) % 3)) % 2 === 0,
  ];

  function aplicarMascara(estado, mascara) {
    const { modulos, ehFuncional, tamanho } = estado;
    const condicao = CONDICOES_MASCARA[mascara];
    for (let y = 0; y < tamanho; y++) {
      for (let x = 0; x < tamanho; x++) {
        if (!ehFuncional[y][x] && condicao(x, y)) {
          modulos[y][x] = !modulos[y][x];
        }
      }
    }
  }

  /**
   * Pontuação de penalidade das 4 regras do padrão. Quanto MENOR, melhor —
   * a máscara vencedora é a que deixa o código mais fácil de escanear.
   */
  function penalidade(estado) {
    const { modulos, tamanho } = estado;
    let total = 0;

    function adicionarHistorico(comprimento, historico) {
      if (historico[0] === 0) comprimento += tamanho; // margem clara virtual
      historico.pop();
      historico.unshift(comprimento);
    }

    function contarPadroesLocalizador(historico) {
      const n = historico[1];
      const nucleo =
        n > 0 &&
        historico[2] === n &&
        historico[3] === n * 3 &&
        historico[4] === n &&
        historico[5] === n;
      return (
        (nucleo && historico[0] >= n * 4 && historico[6] >= n ? 1 : 0) +
        (nucleo && historico[6] >= n * 4 && historico[0] >= n ? 1 : 0)
      );
    }

    function encerrarEContar(corAtual, comprimento, historico) {
      if (corAtual) {
        adicionarHistorico(comprimento, historico);
        comprimento = 0;
      }
      comprimento += tamanho;
      adicionarHistorico(comprimento, historico);
      return contarPadroesLocalizador(historico);
    }

    // Regras 1 e 3, nas linhas
    for (let y = 0; y < tamanho; y++) {
      let cor = false, corrida = 0;
      const historico = [0, 0, 0, 0, 0, 0, 0];
      for (let x = 0; x < tamanho; x++) {
        if (modulos[y][x] === cor) {
          corrida++;
          if (corrida === 5) total += 3;
          else if (corrida > 5) total++;
        } else {
          adicionarHistorico(corrida, historico);
          if (!cor) total += contarPadroesLocalizador(historico) * 40;
          cor = modulos[y][x];
          corrida = 1;
        }
      }
      total += encerrarEContar(cor, corrida, historico) * 40;
    }

    // Regras 1 e 3, nas colunas
    for (let x = 0; x < tamanho; x++) {
      let cor = false, corrida = 0;
      const historico = [0, 0, 0, 0, 0, 0, 0];
      for (let y = 0; y < tamanho; y++) {
        if (modulos[y][x] === cor) {
          corrida++;
          if (corrida === 5) total += 3;
          else if (corrida > 5) total++;
        } else {
          adicionarHistorico(corrida, historico);
          if (!cor) total += contarPadroesLocalizador(historico) * 40;
          cor = modulos[y][x];
          corrida = 1;
        }
      }
      total += encerrarEContar(cor, corrida, historico) * 40;
    }

    // Regra 2: blocos 2x2 da mesma cor
    for (let y = 0; y < tamanho - 1; y++) {
      for (let x = 0; x < tamanho - 1; x++) {
        const cor = modulos[y][x];
        if (cor === modulos[y][x + 1] && cor === modulos[y + 1][x] && cor === modulos[y + 1][x + 1]) {
          total += 3;
        }
      }
    }

    // Regra 4: desequilíbrio entre módulos claros e escuros
    let escuros = 0;
    for (const linha of modulos) {
      for (const modulo of linha) if (modulo) escuros++;
    }
    const totalModulos = tamanho * tamanho;
    const desvio = Math.ceil(Math.abs(escuros * 20 - totalModulos * 10) / totalModulos) - 1;
    total += desvio * 10;

    return total;
  }


  /* ---------------------------------------------------------------------
     API pública
     --------------------------------------------------------------------- */

  /**
   * Gera a matriz de módulos de um QR Code.
   * @param {string} texto            conteúdo a codificar
   * @param {string} [nivelCorrecao]  'L' | 'M' | 'Q' | 'H' (padrão: 'M')
   * @returns {boolean[][]} matriz[linha][coluna]; true = módulo escuro
   */
  function gerar(texto, nivelCorrecao = 'M') {
    if (!ECC_POR_BLOCO[nivelCorrecao]) {
      throw new Error('Nível de correção inválido: ' + nivelCorrecao);
    }

    const bytes = textoParaBytes(texto);
    const versao = escolherVersao(bytes.length, nivelCorrecao);
    const dados = montarCodewordsDeDados(bytes, versao, nivelCorrecao);
    const codewords = adicionarEccEIntercalar(dados, versao, nivelCorrecao);
    const estado = criarMatriz(versao, nivelCorrecao, codewords);

    // Testa as 8 máscaras e fica com a de menor penalidade.
    let melhorMascara = 0;
    let menorPenalidade = Infinity;
    for (let mascara = 0; mascara < 8; mascara++) {
      aplicarMascara(estado, mascara);
      estado.desenharFormato(mascara);
      const pontos = penalidade(estado);
      if (pontos < menorPenalidade) {
        menorPenalidade = pontos;
        melhorMascara = mascara;
      }
      aplicarMascara(estado, mascara); // aplicar de novo desfaz (é um XOR)
    }

    aplicarMascara(estado, melhorMascara);
    estado.desenharFormato(melhorMascara);

    return estado.modulos;
  }

  /**
   * Desenha a matriz num <canvas>.
   * A margem clara ("quiet zone") de 4 módulos é exigida pelo padrão — sem
   * ela muitos leitores não reconhecem o código.
   */
  function desenharNoCanvas(canvas, matriz, opcoes = {}) {
    const escala = opcoes.escala || 6;
    const margem = opcoes.margem === undefined ? 4 : opcoes.margem;
    const corEscura = opcoes.corEscura || '#2E2A26';
    const corClara = opcoes.corClara || '#FFFFFF';

    const tamanho = matriz.length;
    const lado = (tamanho + margem * 2) * escala;

    // Nitidez em telas retina: o canvas é renderizado no dobro/triplo da
    // resolução e reduzido por CSS.
    const densidade = window.devicePixelRatio || 1;
    canvas.width = lado * densidade;
    canvas.height = lado * densidade;
    canvas.style.width = lado + 'px';
    canvas.style.height = lado + 'px';

    const ctx = canvas.getContext('2d');
    ctx.scale(densidade, densidade);

    ctx.fillStyle = corClara;
    ctx.fillRect(0, 0, lado, lado);

    ctx.fillStyle = corEscura;
    for (let y = 0; y < tamanho; y++) {
      for (let x = 0; x < tamanho; x++) {
        if (matriz[y][x]) {
          ctx.fillRect((x + margem) * escala, (y + margem) * escala, escala, escala);
        }
      }
    }
  }

  return { gerar, desenharNoCanvas };
})();
