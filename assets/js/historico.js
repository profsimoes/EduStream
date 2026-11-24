/**
 * Arquivo: /assets/js/historico.js
 * Equipe 3 - EduStream
 * Objetivo: Buscar na tabela 'historico_visualizacao' tudo o que o usuário
 * logado já assistiu (concluídos e em andamento), exibindo data de acesso,
 * tempo assistido e opção para rever no player.html.
 */

// 1. Pegamos os dados do usuário logado salvos no navegador pelo login
const usuarioLogado = JSON.parse(localStorage.getItem('edustream_usuario'));

// 2. Selecionamos os elementos HTML onde vamos mostrar os dados e avisos
const listaHistorico = document.getElementById('lista-historico');
const msgHistorico = document.getElementById('mensagem-historico');
const filtroStatus = document.getElementById('filtro-status');

// Variável para guardar os registros carregados e permitir filtrar na tela
let registrosCompletos = [];

// Função auxiliar: converte segundos em minutos e segundos (Ex: 90 -> "01m 30s")
function formatarDuracao(segundosTotais) {
  const minutos = Math.floor((segundosTotais || 0) / 60);
  const segundos = (segundosTotais || 0) % 60;
  return `${String(minutos).padStart(2, '0')}m ${String(segundos).padStart(2, '0')}s`;
}

// Função auxiliar: formata a data do banco (ISO) para o padrão brasileiro (DD/MM/AAAA HH:MM)
function formatarDataHora(dataIso) {
  if (!dataIso) return 'Data desconhecida';
  const data = new Date(dataIso);
  return data.toLocaleString('pt-BR', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit'
  });
}

// Função principal: busca todo o histórico do usuário no Supabase
async function buscarHistoricoUsuario() {
  // Segurança: garante que existe um usuário válido antes de consultar
  if (!usuarioLogado || !usuarioLogado.id_usuario) {
    return;
  }

  // Faz a consulta na tabela 'historico_visualizacao' trazendo os dados do 'conteudo' e 'categoria'
  const { data, error } = await supabaseClient
    .from('historico_visualizacao')
    .select(`
      id_historico,
      data_hora_acesso,
      segundos_assistidos,
      concluido,
      conteudo (
        id_conteudo,
        titulo,
        descricao,
        tipo,
        duracao_segundos,
        categoria ( nome )
      )
    `)
    .eq('id_usuario', usuarioLogado.id_usuario)
    .order('data_hora_acesso', { ascending: false });

  // Se houver erro na comunicação com o Supabase
  if (error) {
    console.error('Erro ao carregar histórico:', error);
    if (msgHistorico) {
      msgHistorico.textContent = 'Erro ao carregar o seu histórico de visualizações.';
    }
    return;
  }

  // Guarda os dados na variável global e desenha na tela
  registrosCompletos = data || [];
  renderizarCards(registrosCompletos);
}

// Função que cria os cards HTML na tela com base na lista recebida
function renderizarCards(lista) {
  listaHistorico.innerHTML = '';

  // Se a lista estiver vazia, mostra um aviso amigável
  if (lista.length === 0) {
    if (msgHistorico) {
      msgHistorico.textContent = 'Nenhum registro encontrado no seu histórico.';
    }
    return;
  }

  // Limpa mensagens anteriores caso existam itens
  if (msgHistorico) {
    msgHistorico.textContent = '';
  }

  // Para cada item assistido, monta um card usando as classes padrão do style.css
  lista.forEach((registro) => {
    const aula = registro.conteudo;

    // Pula caso o conteúdo tenha sido removido do banco
    if (!aula) return;

    const nomeCategoria = aula.categoria ? aula.categoria.nome : 'Geral';
    const statusTexto = registro.concluido ? 'Concluído' : 'Em andamento';
    const tempoAssistido = formatarDuracao(registro.segundos_assistidos);
    const tempoTotal = aula.duracao_segundos ? ` / ${formatarDuracao(aula.duracao_segundos)}` : '';
    const dataAcesso = formatarDataHora(registro.data_hora_acesso);

    // Cria o card (<article class="card">)
    const card = document.createElement('article');
    card.className = 'card';

    card.innerHTML = `
      <span class="badge">${nomeCategoria} • ${statusTexto}</span>
      <h3>${aula.titulo}</h3>
      <p>${aula.descricao || 'Sem descrição.'}</p>
      <p><strong>Último acesso:</strong> ${dataAcesso}</p>
      <p><strong>Tempo assistido:</strong> ${tempoAssistido}${tempoTotal}</p>
      <div class="form-box">
        <a href="/pages/player.html?id=${aula.id_conteudo}" class="btn">
          ${registro.concluido ? 'Assistir Novamente' : 'Continuar de Onde Parou'}
        </a>
        <button class="btn btn-secondary" onclick="removerDoHistorico(${registro.id_historico})">
          Remover
        </button>
      </div>
    `;

    listaHistorico.appendChild(card);
  });
}

// Função opcional para o aluno remover um registro específico do próprio histórico
async function removerDoHistorico(idHistorico) {
  const { error } = await supabaseClient
    .from('historico_visualizacao')
    .delete()
    .eq('id_historico', idHistorico)
    .eq('id_usuario', usuarioLogado.id_usuario);

  if (error) {
    console.error('Erro ao remover item:', error);
    if (msgHistorico) {
      msgHistorico.textContent = 'Não foi possível remover o item do histórico.';
    }
    return;
  }

  // Atualiza a lista na tela após remover do banco
  registrosCompletos = registrosCompletos.filter(item => item.id_historico !== idHistorico);
  aplicarFiltro();
}

// Filtra entre "Todos", "Concluídos" e "Em andamento" sem precisar consultar o banco de novo
function aplicarFiltro() {
  if (!filtroStatus) {
    renderizarCards(registrosCompletos);
    return;
  }

  const valor = filtroStatus.value;

  if (valor === 'concluidos') {
    const filtrados = registrosCompletos.filter(item => item.concluido === true);
    renderizarCards(filtrados);
  } else if (valor === 'andamento') {
    const filtrados = registrosCompletos.filter(item => item.concluido === false);
    renderizarCards(filtrados);
  } else {
    renderizarCards(registrosCompletos);
  }
}

// Escuta mudanças no select de filtro (se existir na página)
if (filtroStatus) {
  filtroStatus.addEventListener('change', aplicarFiltro);
}

// Inicia o carregamento assim que a página abrir
document.addEventListener('DOMContentLoaded', buscarHistoricoUsuario);
