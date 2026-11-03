// Elementos da página
const mensagemRanking = document.getElementById("mensagem-ranking");
const listaRanking = document.getElementById("lista-ranking");

// Busca as avaliações e monta o ranking
async function carregarRanking() {
  mensagemRanking.textContent = "Carregando ranking...";
  listaRanking.innerHTML = "";

  try {
    // Busca todas as avaliações cadastradas
    const { data: avaliacoes, error: erroAvaliacoes } = await db
      .from("avaliacao")
      .select("id_conteudo, nota");

    if (erroAvaliacoes) {
      throw erroAvaliacoes;
    }

    // Verifica se existem avaliações
    if (!avaliacoes || avaliacoes.length === 0) {
      mensagemRanking.textContent = "Ainda não existem avaliações.";
      return;
    }

    // Agrupa as notas por conteúdo
    const ranking = {};

    avaliacoes.forEach((avaliacao) => {
      const id = avaliacao.id_conteudo;

      if (!ranking[id]) {
        ranking[id] = {
          id_conteudo: id,
          total_notas: 0,
          quantidade: 0
        };
      }

      ranking[id].total_notas += Number(avaliacao.nota);
      ranking[id].quantidade++;
    });

    // Calcula a média das avaliações
    const conteudosRanking = Object.values(ranking).map((item) => {
      return {
        id_conteudo: item.id_conteudo,
        media: item.total_notas / item.quantidade,
        quantidade: item.quantidade
      };
    });

    // Ordena da maior média para a menor
    conteudosRanking.sort((a, b) => b.media - a.media);

    // Busca os dados dos conteúdos
    const idsConteudos = conteudosRanking.map(
      (item) => item.id_conteudo
    );

    const { data: conteudos, error: erroConteudos } = await db
      .from("conteudo")
      .select("id_conteudo, titulo, descricao, tipo, duracao_segundos")
      .in("id_conteudo", idsConteudos);

    if (erroConteudos) {
      throw erroConteudos;
    }

    // Relaciona cada conteúdo com sua média
    const rankingCompleto = conteudosRanking.map((item) => {
      const conteudo = conteudos.find(
        (c) => c.id_conteudo === item.id_conteudo
      );

      return {
        ...item,
        conteudo
      };
    }).filter((item) => item.conteudo);

    // Exibe o resultado
    exibirRanking(rankingCompleto);

  } catch (erro) {
    console.error("Erro ao carregar ranking:", erro);

    mensagemRanking.textContent =
      "Não foi possível carregar o ranking. Tente novamente.";
  }
}

// Mostra os conteúdos na página
function exibirRanking(ranking) {
  listaRanking.innerHTML = "";

  if (ranking.length === 0) {
    mensagemRanking.textContent =
      "Nenhum conteúdo encontrado.";
    return;
  }

  mensagemRanking.textContent =
    `${ranking.length} conteúdo(s) encontrados no ranking.`;

  ranking.forEach((item, indice) => {
    const cartao = document.createElement("article");
    cartao.classList.add("cartao-ranking");

    const posicao = document.createElement("span");
    posicao.classList.add("posicao-ranking");
    posicao.textContent = `${indice + 1}º`;

    const informacoes = document.createElement("div");
    informacoes.classList.add("informacoes-ranking");

    const titulo = document.createElement("h3");
    titulo.textContent = item.conteudo.titulo;

    const descricao = document.createElement("p");
    descricao.textContent =
      item.conteudo.descricao || "Sem descrição disponível.";

    const tipo = document.createElement("span");
    tipo.textContent = `Tipo: ${item.conteudo.tipo}`;

    const nota = document.createElement("strong");
    nota.classList.add("nota-ranking");
    nota.textContent = `⭐ ${item.media.toFixed(1)} / 5`;

    const quantidade = document.createElement("span");
    quantidade.textContent =
      `${item.quantidade} avaliação(ões)`;

    informacoes.appendChild(titulo);
    informacoes.appendChild(descricao);
    informacoes.appendChild(tipo);
    informacoes.appendChild(quantidade);

    cartao.appendChild(posicao);
    cartao.appendChild(informacoes);
    cartao.appendChild(nota);

    listaRanking.appendChild(cartao);
  });
}

// Inicia o carregamento do ranking
carregarRanking();
