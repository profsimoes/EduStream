/* =====================================================
   usuarios.js  (Equipe 1)
   Tela: /pages/usuarios.html  (somente administrador)

   O que este arquivo faz:
   1. Confere se quem está logado é admin
   2. Lista os usuários (SEM a coluna senha)
   3. Busca por nome ou e-mail
   4. Filtra por perfil
   5. Altera o perfil (tipo_perfil + id_perfil juntos)
   6. Exclui usuário (com confirmação)
   7. Mostra mensagens na área .mensagem
   ===================================================== */

// -----------------------------------------------------
// ATENÇÃO: o nome abaixo deve ser o mesmo da variável que
// foi criada em supabase-client.js / supabase-config.js.
// Se no projeto ela tiver outro nome, troque só esta linha.
// -----------------------------------------------------
const db = supabaseClient;

// Elementos da página
const areaMensagem = document.getElementById("mensagem");
const campoBusca = document.getElementById("campo-busca");
const filtroPerfil = document.getElementById("filtro-perfil");
const listaUsuarios = document.getElementById("lista-usuarios");

// Dados em memória (para filtrar sem consultar o banco toda hora)
let todosUsuarios = [];
let todosPerfis = [];

// Usuário logado (salvo no login em localStorage)
const usuarioLogado = JSON.parse(localStorage.getItem("edustream_usuario"));


/* -----------------------------------------------------
   MENSAGENS
   Mostra um texto na área .mensagem
   ----------------------------------------------------- */
function mostrarMensagem(texto) {
  areaMensagem.textContent = texto;
}


/* -----------------------------------------------------
   1. VERIFICAR SE É ADMIN
   Retorna true se pode continuar, false se não pode.
   ----------------------------------------------------- */
function verificarAdmin() {
  if (!usuarioLogado || usuarioLogado.tipo_perfil !== "admin") {
    mostrarMensagem("Acesso negado: esta página é somente para administradores.");
    return false;
  }
  return true;
}


/* -----------------------------------------------------
   2. CARREGAR PERFIS
   Busca a tabela perfil e monta as opções do filtro.
   ----------------------------------------------------- */
async function carregarPerfis() {
  const { data, error } = await db
    .from("perfil")
    .select("id_perfil, nome_perfil")
    .order("nome_perfil");

  if (error) {
    mostrarMensagem("Erro ao carregar perfis: " + error.message);
    return;
  }

  todosPerfis = data;

  // Uma <option> para cada perfil
  todosPerfis.forEach(function (perfil) {
    const opcao = document.createElement("option");
    opcao.value = perfil.id_perfil;
    opcao.textContent = perfil.nome_perfil;
    filtroPerfil.appendChild(opcao);
  });
}


/* -----------------------------------------------------
   3. CARREGAR USUÁRIOS
   Atenção: listamos as colunas uma a uma para NÃO trazer
   a senha. Nunca use select("*") nesta tabela.
   ----------------------------------------------------- */
async function carregarUsuarios() {
  const { data, error } = await db
    .from("usuario")
    .select("id_usuario, nome, email, id_perfil, tipo_perfil")
    .order("nome");

  if (error) {
    mostrarMensagem("Erro ao carregar usuários: " + error.message);
    return;
  }

  todosUsuarios = data;
  mostrarUsuarios();
}


/* -----------------------------------------------------
   4. FILTRAR (busca + perfil) E DESENHAR A LISTA
   ----------------------------------------------------- */
function mostrarUsuarios() {
  const termo = campoBusca.value.trim().toLowerCase();
  const perfilEscolhido = filtroPerfil.value; // "" = todos

  // Mantém só quem combina com a busca E com o perfil
  const filtrados = todosUsuarios.filter(function (u) {
    const combinaBusca =
      u.nome.toLowerCase().includes(termo) ||
      u.email.toLowerCase().includes(termo);

    const combinaPerfil =
      perfilEscolhido === "" || String(u.id_perfil) === perfilEscolhido;

    return combinaBusca && combinaPerfil;
  });

  // Limpa a lista antes de desenhar de novo
  listaUsuarios.innerHTML = "";

  if (filtrados.length === 0) {
    mostrarMensagem("Nenhum usuário encontrado.");
    return;
  }

  mostrarMensagem(filtrados.length + " usuário(s) encontrado(s).");

  filtrados.forEach(function (usuario) {
    listaUsuarios.appendChild(criarCard(usuario));
  });
}


/* -----------------------------------------------------
   5. CRIAR O CARD DE UM USUÁRIO
   Usamos textContent (e não innerHTML) para que nomes
   com símbolos estranhos não quebrem a página.
   ----------------------------------------------------- */
function criarCard(usuario) {
  const card = document.createElement("div");
  card.className = "card";

  const nome = document.createElement("h3");
  nome.textContent = usuario.nome;

  const email = document.createElement("p");
  email.textContent = usuario.email;

  const badge = document.createElement("span");
  badge.className = "badge";
  badge.textContent = usuario.tipo_perfil;

  // Lista de perfis para trocar o tipo do usuário
  const seletor = document.createElement("select");
  todosPerfis.forEach(function (perfil) {
    const opcao = document.createElement("option");
    opcao.value = perfil.id_perfil;
    opcao.textContent = perfil.nome_perfil;
    if (perfil.id_perfil === usuario.id_perfil) {
      opcao.selected = true;
    }
    seletor.appendChild(opcao);
  });

  const botaoSalvar = document.createElement("button");
  botaoSalvar.className = "btn";
  botaoSalvar.textContent = "Salvar perfil";
  botaoSalvar.addEventListener("click", function () {
    alterarPerfil(usuario.id_usuario, seletor.value);
  });

  const botaoExcluir = document.createElement("button");
  botaoExcluir.className = "btn btn-secondary";
  botaoExcluir.textContent = "Excluir";
  botaoExcluir.addEventListener("click", function () {
    excluirUsuario(usuario);
  });

  card.appendChild(nome);
  card.appendChild(email);
  card.appendChild(badge);
  card.appendChild(seletor);
  card.appendChild(botaoSalvar);
  card.appendChild(botaoExcluir);

  return card;
}


/* -----------------------------------------------------
   6. ALTERAR PERFIL
   Atualiza id_perfil e tipo_perfil JUNTOS, para os dois
   campos nunca ficarem diferentes um do outro.
   ----------------------------------------------------- */
async function alterarPerfil(idUsuario, idPerfilNovo) {
  // Descobre qual perfil foi escolhido
  const perfil = todosPerfis.find(function (p) {
    return String(p.id_perfil) === String(idPerfilNovo);
  });

  if (!perfil) {
    mostrarMensagem("Perfil não encontrado.");
    return;
  }

  // tipo_perfil só aceita: aluno, professor ou admin
  const tipo = perfil.nome_perfil.toLowerCase();
  const tiposValidos = ["aluno", "professor", "admin"];

  if (!tiposValidos.includes(tipo)) {
    mostrarMensagem("O perfil '" + perfil.nome_perfil + "' não é um tipo válido.");
    return;
  }

  const { error } = await db
    .from("usuario")
    .update({ id_perfil: perfil.id_perfil, tipo_perfil: tipo })
    .eq("id_usuario", idUsuario);

  if (error) {
    mostrarMensagem("Erro ao alterar perfil: " + error.message);
    return;
  }

  // Recarrega a lista e depois mostra a mensagem de sucesso
  await carregarUsuarios();
  mostrarMensagem("Perfil alterado com sucesso!");
}


/* -----------------------------------------------------
   7. EXCLUIR USUÁRIO
   ----------------------------------------------------- */
async function excluirUsuario(usuario) {
  // O admin não pode excluir a si mesmo
  if (usuario.id_usuario === usuarioLogado.id_usuario) {
    mostrarMensagem("Você não pode excluir a sua própria conta.");
    return;
  }

  // Pede confirmação antes de apagar
  const confirmou = confirm("Deseja realmente excluir " + usuario.nome + "?");
  if (!confirmou) {
    return;
  }

  const { error } = await db
    .from("usuario")
    .delete()
    .eq("id_usuario", usuario.id_usuario);

  if (error) {
    // Pode falhar se o usuário já tem histórico, avaliações ou logs
    mostrarMensagem("Erro ao excluir usuário: " + error.message);
    return;
  }

  await carregarUsuarios();
  mostrarMensagem("Usuário excluído com sucesso!");
}


/* -----------------------------------------------------
   INÍCIO: o que roda quando a página abre
   ----------------------------------------------------- */
async function iniciar() {
  // Se não for admin, para por aqui
  if (!verificarAdmin()) {
    return;
  }

  await carregarPerfis();   // primeiro os perfis (usados nos cards)
  await carregarUsuarios(); // depois os usuários

  // Atualiza a lista enquanto a pessoa digita ou muda o filtro
  campoBusca.addEventListener("input", mostrarUsuarios);
  filtroPerfil.addEventListener("change", mostrarUsuarios);
}

iniciar();
