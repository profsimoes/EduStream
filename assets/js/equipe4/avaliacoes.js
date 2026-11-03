// Elementos da página
const mensagemAvaliacoes = document.getElementById("mensagem-avaliacoes");
const listaConteudos = document.getElementById("lista-conteudos-avaliar");

// Recupera o ID do aluno salvo no navegador
const idUsuario = localStorage.getItem("id_usuario");

// Carrega os conteúdos concluídos pelo aluno
async function carregarConteudosParaAvaliar() {
  mensagemAvaliacoes.textContent = "Carregando conteúdos...";

  if (!idUsuario) {
    mensagemAvaliacoes.textContent =
      "Você precisa entrar na sua conta para avaliar conteúdos.";
    return;
  }

  try {
    // Busca o histórico de visualizações do aluno
    const { data: historico, error: erroHistorico } = await db
      .from("historico_visualizacao")
      .select("id_conteudo, segundos_assistidos")
      .eq("id_usuario", idUsuario);

    if (erroHistorico) {
      throw erroHistorico;
    }

    if (!historico || historico.length === 0) {
      mensagemAvaliacoes.textContent =
        "Você ainda não possui conteúdos assistidos.";
      return;
    }

    // Busca os conteúdos relacionados ao histórico
    const idsConteudos = [
      ...new Set(historico.map(item => item.id_conteudo))
    ];

    const { data: conteudos, error: erroConteudos } = await db
      .from("conteudo")
      .select("id_conteudo, titulo, descricao, duracao_segundos")
      .in("id_conteudo", idsConteudos);

    if (erroConteudos) {
      throw erroConteudos;
    }

    // Verifica quais conteúdos foram concluídos
    const conteudosConcluidos = conteudos.filter(conteudo => {
      const registros = historico.filter(
        item => item.id_conteudo === conteudo.id_conteudo
      );

      // Considera o maior tempo assistido registrado
      const maiorTempo = Math.max(
        ...registros.map(item => Number(item.segundos_assistidos) || 0)
      );

      return estaConcluido(maiorTempo, conteudo.duracao_segundos);
    });

    if (conteudosConcluidos.length === 0) {
      mensagemAvaliacoes.textContent =
        "Você ainda não concluiu nenhum conteúdo.";
      return;
    }

    // Busca as avaliações já realizadas pelo aluno
    const { data: avaliacoes, error: erroAvaliacoes } = await db
      .from("avaliacao")
      .select("id_conteudo")
      .eq("id_usuario", idUsuario);

    if (erroAvaliacoes) {
      throw erroAvaliacoes;
    }

    // Remove conteúdos que já foram avaliados
    const conteudosDisponiveis = conteudosConcluidos.filter(conteudo => {
      return !avaliacoes.some(
        avaliacao => avaliacao.id_conteudo === conteudo.id_conteudo
      );
    });

    if (conteudosDisponiveis.length === 0) {
      mensagemAvaliacoes.textContent =
        "Você já avaliou todos os conteúdos concluídos. Obrigado!";
      return;
    }

    mensagemAvaliacoes.textContent =
      `${conteudosDisponiveis.length} conteúdo(s) disponível(is) para avaliação.`;

    exibirConteudos(conteudosDisponiveis);

  } catch (erro) {
    console.error("Erro ao carregar conteúdos:", erro);

    mensagemAvaliacoes.textContent =
      "Não foi possível carregar os conteúdos. Tente novamente.";
  }
}

// Cria os cartões dos conteúdos
function exibirConteudos(conteudos) {
  listaConteudos.innerHTML = "";

  conteudos.forEach(conteudo => {
    const cartao = document.createElement("article");
    cartao.classList.add("cartao-avaliacao");

    const titulo = document.createElement("h3");
    titulo.textContent = conteudo.titulo;

    const descricao = document.createElement("p");
    descricao.textContent =
      conteudo.descricao || "Sem descrição disponível.";

    const formulario = document.createElement("form");
    formulario.classList.add("formulario-avaliacao");

    // Campo de nota
    const labelNota = document.createElement("label");
    labelNota.textContent = "Sua nota:";

    const estrelas = document.createElement("div");
    estrelas.classList.add("selecao-estrelas");

    let notaSelecionada = 0;

    for (let i = 1; i <= 5; i++) {
      const estrela = document.createElement("button");

      estrela.type = "button";
      estrela.textContent = "★";
      estrela.classList.add("estrela");
      estrela.setAttribute("aria-label", `${i} estrelas`);
      estrela.setAttribute("aria-pressed", "false");

      estrela.addEventListener("click", () => {
        notaSelecionada = i;

        // Atualiza a aparência das estrelas
        const botoes = estrelas.querySelectorAll(".estrela");

        botoes.forEach((botao, indice) => {
          const selecionada = indice < i;

          botao.classList.toggle("selecionada", selecionada);
          botao.setAttribute("aria-pressed", selecionada);
        });
      });

      estrelas.appendChild(estrela);
    }

    // Campo de comentário
    const labelComentario = document.createElement("label");
    labelComentario.textContent = "Comentário (opcional):";

    const comentario = document.createElement("textarea");
    comentario.placeholder = "Escreva sua opinião sobre o conteúdo...";
    comentario.rows = 3;
    comentario.maxLength = 1000;

    // Botão de envio
    const botaoEnviar = document.createElement("button");
    botaoEnviar.type = "submit";
    botaoEnviar.textContent = "Enviar avaliação";
    botaoEnviar.classList.add("botao-avaliar");

    // Monta o formulário
    formulario.appendChild(labelNota);
    formulario.appendChild(estrelas);
    formulario.appendChild(labelComentario);
    formulario.appendChild(comentario);
    formulario.appendChild(botaoEnviar);

    formulario.addEventListener("submit", async (evento) => {
      evento.preventDefault();

      if (notaSelecionada === 0) {
        alert("Selecione uma nota de 1 a 5 estrelas.");
        return;
      }

      await salvarAvaliacao(
        conteudo.id_conteudo,
        notaSelecionada,
        comentario.value,
        cartao,
        botaoEnviar
      );
    });

    cartao.appendChild(titulo);
    cartao.appendChild(descricao);
    cartao.appendChild(formulario);

    listaConteudos.appendChild(cartao);
  });
}

// Salva a avaliação no Supabase
async function salvarAvaliacao(
  idConteudo,
  nota,
  comentario,
  cartao,
  botao
) {
  botao.disabled = true;
  botao.textContent = "Enviando...";

  try {
    // Confere novamente se já existe uma avaliação
    const { data: existente, error: erroConsulta } = await db
      .from("avaliacao")
      .select("id_avaliacao")
      .eq("id_usuario", idUsuario)
      .eq("id_conteudo", idConteudo);

    if (erroConsulta) {
      throw erroConsulta;
    }

    if (existente.length > 0) {
      alert("Você já avaliou este conteúdo.");
      cartao.remove();
      return;
    }

    // Registra a avaliação
    const { error: erroInsercao } = await db
      .from("avaliacao")
      .insert({
        id_usuario: idUsuario,
        id_conteudo: idConteudo,
        nota: nota,
        comentario: comentario.trim() || null,
        data_avaliacao: new Date().toISOString()
      });

    if (erroInsercao) {
      throw erroInsercao;
    }

    alert("Avaliação enviada com sucesso!");

    // Remove o conteúdo da lista após avaliar
    cartao.remove();

    if (listaConteudos.children.length === 0) {
      mensagemAvaliacoes.textContent =
        "Você já avaliou todos os conteúdos disponíveis. Obrigado!";
    }

  } catch (erro) {
    console.error("Erro ao salvar avaliação:", erro);

    alert("Não foi possível salvar sua avaliação. Tente novamente.");

    botao.disabled = false;
    botao.textContent = "Enviar avaliação";
  }
}

// Inicia a página
carregarConteudosParaAvaliar();
