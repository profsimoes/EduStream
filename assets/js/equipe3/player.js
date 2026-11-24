// Aguarda o carregamento completo do DOM para iniciar a lógica do player
document.addEventListener('DOMContentLoaded', async () => {
  const elementoVideo = document.getElementById('video-player');
  const elementoTitulo = document.getElementById('titulo-conteudo');
  const elementoDescricao = document.getElementById('descricao-conteudo');
  const elementoMensagem = document.getElementById('mensagem-status');

  // Obtém o ID do conteúdo presente na URL (ex: player.html?id=1)
  const idConteudo = lerParametro('id');
  
  // Pega o ID do usuário logado (armazenado temporariamente no localStorage para simular o login)
  const idUsuario = localStorage.getItem('id_usuario_logado');

  let idHistorico = null;
  let ultimoTempoSalvo = 0;

  // Função auxiliar para exibir mensagens de aviso ou erro na tela
  function exibirMensagem(texto, tipo = 'erro') {
    if (elementoMensagem) {
      elementoMensagem.textContent = texto;
      elementoMensagem.className = `mensagem-status ${tipo}`;
      elementoMensagem.style.display = 'block';
    }
  }

  // Valida a presença dos parâmetros necessários
  if (!idConteudo) {
    exibirMensagem('Conteúdo não especificado.');
    return;
  }

  if (!idUsuario) {
    exibirMensagem('Usuário não autenticado. Por favor, faça login.');
    return;
  }

  // 1. Carrega as informações do conteúdo no banco de dados
  try {
    const { data: conteudo, error: erroConteudo } = await db
      .from('conteudo')
      .select('*')
      .eq('id_conteudo', idConteudo)
      .single();

    if (erroConteudo || !conteudo) {
      exibirMensagem('Erro ao carregar o conteúdo.');
      console.error(erroConteudo);
      return;
    }

    // Preenche as informações da tela
    if (elementoTitulo) elementoTitulo.textContent = conteudo.titulo;
    if (elementoDescricao) elementoDescricao.textContent = conteudo.descricao;
    if (elementoVideo) elementoVideo.src = conteudo.link_conteudo;

    // 2. Verifica se já existe um registro no histórico para este usuário e conteúdo
    const { data: historicoExistente, error: erroHistorico } = await db
      .from('historico_visualizacao')
      .select('*')
      .eq('id_usuario', idUsuario)
      .eq('id_conteudo', idConteudo)
      .maybeSingle();

    if (erroHistorico) {
      console.error('Erro ao verificar histórico:', erroHistorico);
    }

    if (historicoExistente) {
      // Se já existe, guarda o ID do histórico e posiciona o vídeo onde parou
      idHistorico = historicoExistente.id_historico;
      ultimoTempoSalvo = historicoExistente.segundos_assistidos || 0;
      if (elementoVideo) {
        elementoVideo.currentTime = ultimoTempoSalvo;
      }
    } else {
      // Se não existe, cria um novo registro de histórico
      const { data: novoHistorico, error: erroCriar } = await db
        .from('historico_visualizacao')
        .insert([
          {
            id_usuario: parseInt(idUsuario),
            id_conteudo: parseInt(idConteudo),
            data_hora_acesso: new Date().toISOString(),
            segundos_assistidos: 0,
            concluido: false
          }
        ])
        .select()
        .single();

      if (erroCriar) {
        exibirMensagem('Erro ao iniciar histórico de visualização.');
        console.error(erroCriar);
      } else if (novoHistorico) {
        idHistorico = novoHistorico.id_historico;
      }
    }

    // 3. Função responsável por atualizar o progresso no Supabase
    async function salvarProgresso() {
      if (!idHistorico || !elementoVideo) return;

      const segundosAssistidos = Math.floor(elementoVideo.currentTime);
      const duracaoTotal = Math.floor(elementoVideo.duration) || conteudo.duracao_segundos;

      // Utiliza a função utilitária global para checar regra de conclusão (>= 90%)
      const concluido = estaConcluido(segundosAssistidos, duracaoTotal);

      const { error: erroAtualizar } = await db
        .from('historico_visualizacao')
        .update({
          segundos_assistidos: segundosAssistidos,
          concluido: concluido,
          data_hora_acesso: new Date().toISOString()
        })
        .eq('id_historico', idHistorico);

      if (erroAtualizar) {
        console.error('Erro ao salvar progresso:', erroAtualizar);
      } else {
        ultimoTempoSalvo = segundosAssistidos;
      }
    }

    // 4. Grava o progresso a cada 10 segundos de reprodução
    if (elementoVideo) {
      elementoVideo.addEventListener('timeupdate', () => {
        const tempoAtual = Math.floor(elementoVideo.currentTime);
        
        // Verifica se se passaram 10 segundos desde a última gravação
        if (tempoAtual - ultimoTempoSalvo >= 10) {
          salvarProgresso();
        }
      });

      // Salva o progresso final quando o vídeo termina
      elementoVideo.addEventListener('ended', () => {
        salvarProgresso();
      });

      // Salva o progresso quando o usuário pausa o vídeo
      elementoVideo.addEventListener('pause', () => {
        salvarProgresso();
      });
    }

  } catch (erroGeral) {
    exibirMensagem('Ocorreu um erro inesperado no player.');
    console.error(erroGeral);
  }
});
