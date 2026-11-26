/* ==========================================================
   usuarios.js  -  EQUIPE 1  -  EduStream
   Gerenciamento dos usuários JÁ cadastrados.

   Funcionalidades:
   1. Listar usuários        4. Editar usuários
   2. Pesquisar usuários     5. Excluir usuários
   3. Ver informações        6. Tipos de usuário (permissões)
   7. Controle de acesso (somente administrador)

   IMPORTANTE: o cliente do Supabase (variável "db") já é criado em
   /assets/js/supabase-client.js. Aqui só USAMOS o "db".
   Este arquivo deve ser carregado DEPOIS do supabase-client.js
   e no FINAL do <body>, depois dos elementos da página.
   ========================================================== */

// ----------------------------------------------------------
// 1. VARIÁVEIS GLOBAIS
// ----------------------------------------------------------

// Guarda todos os usuários carregados do banco (usada na pesquisa)
let listaUsuarios = [];

// Guarda o "primeiro acesso" de cada usuário: { id_usuario: data }
let primeiroAcesso = {};

// Guarda o id do usuário que está sendo editado (null = ninguém)
let idEmEdicao = null;

// Usuário que está logado (salvo pelo login.js no localStorage)
let usuarioLogado = null;

// Atalhos para os elementos da página
const elMensagem = document.getElementById('mensagem');
const elArea = document.getElementById('area-gerenciamento');
const elLista = document.getElementById('lista-usuarios');
const elPesquisa = document.getElementById('campo-pesquisa');
const elFormEdicao = document.getElementById('form-edicao');
const elEditNome = document.getElementById('edit-nome');
const elEditEmail = document.getElementById('edit-email');
const elEditTipo = document.getElementById('edit-tipo');

// ----------------------------------------------------------
// 2. FUNÇÕES AUXILIARES
// ----------------------------------------------------------

// Mostra uma mensagem para o usuário (sucesso ou erro)
function mostrarMensagem(texto) {
  elMensagem.textContent = texto; // textContent evita código malicioso
  elMensagem.hidden = false;
}

// Esconde a mensagem
function limparMensagem() {
  elMensagem.hidden = true;
  elMensagem.textContent = '';
}

// Transforma uma data do banco em texto brasileiro (dd/mm/aaaa hh:mm)
function formatarData(data) {
  if (!data) return 'Sem registro';
  return new Date(data).toLocaleString('pt-BR');
}

// Traduz o valor do banco para um texto bonito
function nomeDoTipo(tipo) {
  if (tipo === 'admin') return 'Administrador';
  if (tipo === 'professor') return 'Professor';
  return 'Aluno';
}

// ----------------------------------------------------------
// 3. CONTROLE DE ACESSO (funcionalidade 7)
// ----------------------------------------------------------
// O layout.js já garante que existe um usuário logado.
// Aqui verificamos se ele é ADMINISTRADOR.
// (Esta checagem é só visual. A proteção de verdade precisa
//  ser feita no banco, com RLS do Supabase.)
function verificarPermissao() {
  try {
    usuarioLogado = JSON.parse(localStorage.getItem('edustream_usuario'));
  } catch (erro) {
    usuarioLogado = null; // JSON inválido
  }

  // Só quem tem tipo_perfil = 'admin' pode gerenciar usuários
  if (!usuarioLogado || usuarioLogado.tipo_perfil !== 'admin') {
    elArea.hidden = true; // esconde toda a área de gerenciamento
    mostrarMensagem('Acesso negado: apenas administradores podem gerenciar usuários.');
    return false;
  }
  return true;
}

// ----------------------------------------------------------
// 4. LISTAR USUÁRIOS (funcionalidades 1 e 3)
// ----------------------------------------------------------
// Devolve true se carregou certo e false se deu erro
async function carregarUsuarios() {
  limparMensagem();

  // Busca os usuários. Repare que NÃO pedimos a coluna "senha":
  // nunca devemos trazer senhas para a tela.
  const { data, error } = await db
    .from('usuario')
    .select('id_usuario, nome, email, id_perfil, tipo_perfil')
    .order('nome', { ascending: true });

  if (error) {
    mostrarMensagem('Erro ao carregar usuários: ' + error.message);
    return false;
  }

  listaUsuarios = data;
  await carregarPrimeirosAcessos();
  mostrarUsuarios(listaUsuarios);
  return true;
}

// A tabela "usuario" não tem coluna de data de cadastro.
// Por isso usamos o log_acesso: a data do 1º acesso de cada usuário.
// O Supabase devolve no máximo 1000 linhas por consulta, então
// buscamos em "páginas" de 1000 até acabar os registros.
async function carregarPrimeirosAcessos() {
  primeiroAcesso = {};

  const tamanhoPagina = 1000;
  let inicio = 0;

  while (true) {
    const { data, error } = await db
      .from('log_acesso')
      .select('id_usuario, data_hora')
      .order('data_hora', { ascending: true }) // do mais antigo ao mais novo
      .range(inicio, inicio + tamanhoPagina - 1);

    if (error || !data) return; // sem log, a data fica "Sem registro"

    // Como está em ordem, o primeiro registro de cada usuário é o mais antigo
    data.forEach(function (log) {
      if (!primeiroAcesso[log.id_usuario]) {
        primeiroAcesso[log.id_usuario] = log.data_hora;
      }
    });

    // Se veio menos que uma página cheia, não há mais registros
    if (data.length < tamanhoPagina) return;
    inicio += tamanhoPagina;
  }
}

// Cria uma linha "Rótulo: valor" dentro de um card
function criarLinha(rotulo, valor) {
  const p = document.createElement('p');
  p.textContent = rotulo + ': ' + valor;
  return p;
}

// Desenha os cards na tela
function mostrarUsuarios(usuarios) {
  elLista.textContent = ''; // limpa a lista antiga

  if (usuarios.length === 0) {
    const vazio = document.createElement('p');
    vazio.textContent = 'Nenhum usuário encontrado.';
    elLista.appendChild(vazio);
    return;
  }

  usuarios.forEach(function (usuario) {
    // Card do usuário
    const card = document.createElement('div');
    card.className = 'card';

    // Nome
    const titulo = document.createElement('h3');
    titulo.textContent = usuario.nome;
    card.appendChild(titulo);

    // Badge com o tipo (permissão)
    const badge = document.createElement('span');
    badge.className = 'badge';
    badge.textContent = nomeDoTipo(usuario.tipo_perfil);
    card.appendChild(badge);

    // Informações
    card.appendChild(criarLinha('ID', usuario.id_usuario));
    card.appendChild(criarLinha('E-mail', usuario.email));
    card.appendChild(criarLinha('Primeiro acesso', formatarData(primeiroAcesso[usuario.id_usuario])));

    // Botão Editar
    const btnEditar = document.createElement('button');
    btnEditar.type = 'button';
    btnEditar.className = 'btn';
    btnEditar.textContent = 'Editar';
    btnEditar.addEventListener('click', function () {
      abrirEdicao(usuario.id_usuario);
    });
    card.appendChild(btnEditar);

    // Botão Excluir
    const btnExcluir = document.createElement('button');
    btnExcluir.type = 'button';
    btnExcluir.className = 'btn btn-secondary';
    btnExcluir.textContent = 'Excluir';
    btnExcluir.addEventListener('click', function () {
      excluirUsuario(usuario.id_usuario, usuario.nome);
    });
    card.appendChild(btnExcluir);

    elLista.appendChild(card);
  });
}

// ----------------------------------------------------------
// 5. PESQUISAR USUÁRIOS (funcionalidade 2)
// ----------------------------------------------------------
// Filtra a lista que já está na memória (não precisa ir ao banco)
function pesquisarUsuarios() {
  const termo = elPesquisa.value.trim().toLowerCase();

  const filtrados = listaUsuarios.filter(function (u) {
    return (
      u.nome.toLowerCase().includes(termo) ||
      u.email.toLowerCase().includes(termo) ||
      String(u.id_usuario).includes(termo)
    );
  });

  mostrarUsuarios(filtrados);
}

// ----------------------------------------------------------
// 6. EDITAR USUÁRIOS (funcionalidades 4 e 6)
// ----------------------------------------------------------

// Preenche o formulário com os dados do usuário escolhido
function abrirEdicao(idUsuario) {
  limparMensagem();

  const usuario = listaUsuarios.find(function (u) {
    return u.id_usuario === idUsuario;
  });
  if (!usuario) return;

  idEmEdicao = idUsuario;
  elEditNome.value = usuario.nome;
  elEditEmail.value = usuario.email;
  elEditTipo.value = usuario.tipo_perfil;

  elFormEdicao.hidden = false;
  elFormEdicao.scrollIntoView({ behavior: 'smooth' });
}

// Fecha o formulário sem salvar
function cancelarEdicao() {
  idEmEdicao = null;
  elFormEdicao.hidden = true;
}

// Salva as alterações no Supabase
async function salvarEdicao() {
  limparMensagem();

  // Se nenhum usuário foi escolhido, não há o que salvar
  if (idEmEdicao === null) return;

  const nome = elEditNome.value.trim();
  const email = elEditEmail.value.trim();
  const tipo = elEditTipo.value;

  // Validações simples
  if (nome === '' || email === '') {
    mostrarMensagem('Preencha o nome e o e-mail.');
    return;
  }
  if (!email.includes('@')) {
    mostrarMensagem('Digite um e-mail válido.');
    return;
  }

  // Regra de segurança: o admin não pode tirar o próprio acesso de admin
  if (idEmEdicao === usuarioLogado.id_usuario && tipo !== 'admin') {
    mostrarMensagem('Você não pode remover seu próprio perfil de administrador.');
    return;
  }

  // Descobre o id_perfil que corresponde ao tipo escolhido.
  // Assim "tipo_perfil" e "id_perfil" ficam sempre iguais no banco.
  const { data: perfil, error: erroPerfil } = await db
    .from('perfil')
    .select('id_perfil')
    .eq('nome_perfil', tipo)
    .maybeSingle();

  if (erroPerfil) {
    mostrarMensagem('Erro ao buscar o perfil: ' + erroPerfil.message);
    return;
  }
  if (!perfil) {
    mostrarMensagem('O perfil "' + tipo + '" não existe na tabela perfil.');
    return;
  }

  // Atualiza SOMENTE o usuário escolhido (.eq = "onde id_usuario é igual a").
  // O .select() no final faz o banco devolver as linhas alteradas,
  // para conferirmos se a alteração realmente aconteceu.
  const { data: alterados, error } = await db
    .from('usuario')
    .update({
      nome: nome,
      email: email,
      tipo_perfil: tipo,
      id_perfil: perfil.id_perfil
    })
    .eq('id_usuario', idEmEdicao)
    .select('id_usuario');

  if (error) {
    mostrarMensagem('Erro ao salvar: ' + error.message);
    return;
  }
  if (!alterados || alterados.length === 0) {
    mostrarMensagem('Nada foi alterado. Verifique as permissões do banco (RLS).');
    return;
  }

  // Se editou a si mesmo, atualiza os dados guardados no navegador
  if (idEmEdicao === usuarioLogado.id_usuario) {
    usuarioLogado.nome = nome;
    usuarioLogado.email = email;
    localStorage.setItem('edustream_usuario', JSON.stringify(usuarioLogado));
  }

  cancelarEdicao();

  // Só mostra "sucesso" se a lista foi recarregada sem erro
  const recarregou = await carregarUsuarios();
  if (recarregou) {
    mostrarMensagem('Usuário atualizado com sucesso!');
  }
}

// ----------------------------------------------------------
// 7. EXCLUIR USUÁRIOS (funcionalidade 5)
// ----------------------------------------------------------
async function excluirUsuario(idUsuario, nome) {
  limparMensagem();

  // O administrador não pode excluir a própria conta
  if (idUsuario === usuarioLogado.id_usuario) {
    mostrarMensagem('Você não pode excluir a sua própria conta.');
    return;
  }

  // Pede confirmação antes de apagar
  const confirmou = confirm('Tem certeza que deseja excluir "' + nome + '"? Essa ação não pode ser desfeita.');
  if (!confirmou) return;

  // Antes de apagar o usuário, apagamos os registros que dependem dele
  // (senão o banco recusa a exclusão por causa das chaves estrangeiras).
  const tabelasFilhas = ['avaliacao', 'historico_visualizacao', 'log_acesso'];

  for (const tabela of tabelasFilhas) {
    const { error } = await db.from(tabela).delete().eq('id_usuario', idUsuario);
    if (error) {
      mostrarMensagem('Erro ao excluir dados de ' + tabela + ': ' + error.message);
      return;
    }
  }

  // Agora sim, apaga o usuário. O .select() devolve a linha apagada,
  // para conferirmos se a exclusão realmente aconteceu.
  const { data: apagados, error } = await db
    .from('usuario')
    .delete()
    .eq('id_usuario', idUsuario)
    .select('id_usuario');

  if (error) {
    mostrarMensagem('Erro ao excluir usuário: ' + error.message);
    return;
  }
  if (!apagados || apagados.length === 0) {
    mostrarMensagem('Nada foi excluído. Verifique as permissões do banco (RLS).');
    return;
  }

  // Só mostra "sucesso" se a lista foi recarregada sem erro
  const recarregou = await carregarUsuarios();
  if (recarregou) {
    mostrarMensagem('Usuário excluído com sucesso!');
  }
}

// ----------------------------------------------------------
// 8. INICIALIZAÇÃO
// ----------------------------------------------------------
// Liga os eventos aos elementos da página
elPesquisa.addEventListener('input', pesquisarUsuarios);
document.getElementById('btn-salvar').addEventListener('click', salvarEdicao);
document.getElementById('btn-cancelar').addEventListener('click', cancelarEdicao);

// Só carrega os dados se o usuário for administrador
if (verificarPermissao()) {
  carregarUsuarios();
}
