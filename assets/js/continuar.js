/**
 * Arquivo: /assets/js/continuar.js
 * Objetivo: Buscar no Supabase os conteúdos iniciados pelo usuário logado,
 * mostrar onde ele parou e permitir continuar assistindo no player.html.
 */

// 1. Recupera os dados do usuário logado (salvos pelo login no localStorage)
const usuarioAtual = JSON.parse(localStorage.getItem('edustream_usuario'));

// 2. Seleciona os elementos da tela onde os cards e avisos serão exibidos
const containerLista = document.getElementById('lista-continuar');
const boxMensagem = document.getElementById('mensagem-continuar');

// Função auxiliar para transformar segundos em formato legível (Ex: 125s -> "02m 05s")
function formatarTempo(totalSegundos) {
  const minutos = Math.floor(totalSegundos / 60);
  const segundos = totalSegundos % 60;
  return `${String(minutos).padStart(2, '0')}m ${String(segundos).padStart(2, '0')}s`;
}

// Função principal para carregar o histórico do aluno
async function carregarContinuarAssistindo() {
  // Segurança extra: se não houver usuário, interrompe a execução
  if (!usuarioAtual || !usuarioAtual.id_usuario) {
    return;
  }

  // Consulta a tabela 'historico_visualizacao' fazendo JOIN com 'conteudo' e 'categoria'
  // Filtramos apenas pelos registros do usuário logado e ordenamos pelo acesso mais recente
  const { data: historicos, error } = await supabaseClient
    .from('historico_visualizacao')
    .select(`
      id_historico,
      segundos_assistidos,
      concluido,
      data_hora_acesso,
      conteudo (
        id_conteudo,
        titulo,
        descricao,
        tipo,
        duracao_segundos,
        categoria ( nome )
      )
    `)
    .eq('id_usuario', usuarioAtual.id_usuario)
    .order('data_hora_acesso', { ascending: false });

  // Tratamento de erro na consulta
  if (error) {
    console.error('Erro ao buscar histórico:', error);
    if (boxMensagem) {
      boxMensagem.textContent = 'Não foi possível carregar seu histórico de aulas.';
    }
    return;
  }

  // Limpa o container antes de preencher
  containerLista.innerHTML = '';

  // Se o aluno ainda não assistiu nada
  if (!historicos || historicos.length === 0) {
    if (boxMensagem) {
      boxMensagem.textContent = 'Você ainda não iniciou nenhum conteúdo. Explore o catálogo!';
    }
    return;
  }

  // Percorre cada item do histórico e cria um card usando as classes padrão (.card, .badge, .btn)
  historicos.forEach((item) => {
    const aula = item.conteudo;

    // Garante que o conteúdo ainda existe no banco
    if (!aula) return;

    // Calcula a porcentagem assistida se a duração total estiver cadastrada
    let textoProgresso = `Parou em: ${formatarTempo(item.segundos_assistidos)}`;
    if (aula.duracao_segundos && aula.duracao_segundos > 0) {
      const porcentagem = Math.min(100, Math.round((item.segundos_assistidos / aula.duracao_segundos) * 100));
      textoProgresso += ` (${porcentagem}%)`;
    }

    // Define o texto do status e do botão de acordo com a coluna 'concluido'
    const statusBadge = item.concluido ? 'Concluído' : 'Em andamento';
    const textoBotao = item.concluido ? 'Assistir Novamente' : 'Continuar Assistindo';
    const nomeCategoria = aula.categoria ? aula.categoria.nome : 'Geral';

    // Cria o elemento <article class="card">
    const card = document.createElement('article');
    card.className = 'card';

    card.innerHTML = `
      <span class="badge">${nomeCategoria} - ${statusBadge}</span>
      <h3>${aula.titulo}</h3>
      <p>${aula.descricao || 'Sem descrição disponível.'}</p>
      <p><strong>${textoProgresso}</strong></p>
      <a href="/pages/player.html?id=${aula.id_conteudo}" class="btn">
        ${textoBotao}
      </a>
    `;

    // Adiciona o card dentro da grade (.grid) na página
    containerLista.appendChild(card);
  });
}

// Executa a função assim que o HTML terminar de carregar
document.addEventListener('DOMContentLoaded', carregarContinuarAssistindo);
