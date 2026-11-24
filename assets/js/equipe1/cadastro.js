/* ==========================================================
   EduStream - assets/js/equipe1/cadastro.js  (Equipe 1)
   Script da página pública: /pages/cadastro.html

   O que este arquivo faz:
   1. Lê os dados do formulário
   2. Valida os dados
   3. Verifica se o e-mail já existe e grava na tabela "usuario"
   4. Mostra uma mensagem (.mensagem) e redireciona para o login

   Scripts no cadastro.html (nesta ordem, antes do </body>):
     <script src="https://cdn.jsdelivr.net/npm/@supabase/supabase-js@2"></script>
     <script src="/assets/js/supabase-config.js"></script>
     <script src="/assets/js/supabase-client.js"></script>
     <script src="/assets/js/layout.js"></script>
     <script src="/assets/js/equipe1/cadastro.js"></script>

   IDs esperados no cadastro.html:
     form: #form-cadastro | inputs: #nome, #email, #senha, #confirmar-senha
     mensagem: <div id="mensagem" class="mensagem"></div>
   ========================================================== */

// Todo o código fica dentro desta função "(function () { ... })();".
// Isso evita conflito de nomes com os outros arquivos .js da página.
(function () {
  'use strict';

  // ---------- CONFIGURAÇÕES (fáceis de alterar) ----------

  // Procura o cliente Supabase criado em supabase-client.js / supabase-config.js.
  // Testa os nomes mais comuns; "typeof" evita erro se a variável não existir.
  function encontrarCliente() {
    if (typeof supabaseClient !== 'undefined') return supabaseClient;
    if (typeof clienteSupabase !== 'undefined') return clienteSupabase;
    if (typeof supabaseCliente !== 'undefined') return supabaseCliente;
    // Se a variável se chamar "supabase" e já for o cliente (e não a biblioteca)
    if (typeof supabase !== 'undefined' && typeof supabase.from === 'function') return supabase;
    return null;
  }

  const db = encontrarCliente();

  // Se não achou, mostra no console qual é o problema e para o script.
  if (!db) {
    console.error('cadastro.js: cliente Supabase não encontrado. ' +
      'Abra supabase-client.js, veja o nome da variável criada com createClient(...) ' +
      'e coloque esse nome na função encontrarCliente().');
    return;
  }

  const TAMANHO_MINIMO_SENHA = 6;        // mínimo de caracteres da senha

  // Limites iguais aos da tabela "usuario" (colunas varchar)
  const MAX_NOME = 100;                  // nome  varchar(100)
  const MAX_EMAIL = 150;                 // email varchar(150)
  const MAX_SENHA = 255;                 // senha varchar(255)
  const TIPO_PERFIL_PADRAO = 'aluno';    // todo novo cadastro entra como aluno
  const PAGINA_LOGIN = '/pages/login.html';
  const TEMPO_REDIRECIONAMENTO = 2000;   // 2000 ms = 2 segundos

  // ---------- ELEMENTOS DA PÁGINA ----------
  const formCadastro = document.getElementById('form-cadastro');
  const campoNome = document.getElementById('nome');
  const campoEmail = document.getElementById('email');
  const campoSenha = document.getElementById('senha');
  const campoConfirmar = document.getElementById('confirmar-senha');
  const areaMensagem = document.getElementById('mensagem');

  // Se o formulário não existir, avisa no console e para o script.
  if (!formCadastro) {
    console.error('cadastro.js: formulário #form-cadastro não encontrado.');
    return;
  }

  const botaoEnviar = formCadastro.querySelector('button[type="submit"]');

  // ---------- FUNÇÕES AUXILIARES ----------

  /**
   * Mostra uma mensagem para a pessoa usando a classe .mensagem.
   * @param {string} texto - o texto que será exibido
   * @param {boolean} ehSucesso - true = sucesso, false = erro
   */
  function mostrarMensagem(texto, ehSucesso) {
    areaMensagem.textContent = texto; // textContent é mais seguro que innerHTML
    areaMensagem.classList.add('mensagem');
    areaMensagem.classList.toggle('sucesso', ehSucesso);
    areaMensagem.classList.toggle('erro', !ehSucesso);
  }

  /**
   * Confere se o e-mail tem formato válido (ex.: nome@dominio.com).
   */
  function emailEhValido(email) {
    const padraoEmail = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return padraoEmail.test(email);
  }

  /**
   * Valida todos os campos do formulário.
   * Retorna um texto com o erro encontrado, ou "" (vazio) se estiver tudo certo.
   */
  function validarDados(nome, email, senha, confirmarSenha) {
    // 1) Nenhum campo pode estar vazio
    if (!nome || !email || !senha || !confirmarSenha) {
      return 'Preencha todos os campos.';
    }
    // 1.1) Tamanhos máximos aceitos pelo banco
    if (nome.length > MAX_NOME) {
      return 'O nome pode ter no máximo ' + MAX_NOME + ' caracteres.';
    }
    if (email.length > MAX_EMAIL) {
      return 'O e-mail pode ter no máximo ' + MAX_EMAIL + ' caracteres.';
    }
    if (senha.length > MAX_SENHA) {
      return 'A senha pode ter no máximo ' + MAX_SENHA + ' caracteres.';
    }
    // 2) E-mail com formato válido
    if (!emailEhValido(email)) {
      return 'Digite um e-mail válido.';
    }
    // 3) Tamanho mínimo da senha
    if (senha.length < TAMANHO_MINIMO_SENHA) {
      return 'A senha deve ter pelo menos ' + TAMANHO_MINIMO_SENHA + ' caracteres.';
    }
    // 4) As duas senhas precisam ser iguais
    if (senha !== confirmarSenha) {
      return 'As senhas não coincidem.';
    }
    return ''; // sem erros
  }

  /**
   * Verifica no banco se já existe um usuário com este e-mail.
   * Retorna true se já existe, false se não existe.
   */
  async function emailJaExiste(email) {
    const { data, error } = await db
      .from('usuario')
      .select('id_usuario')
      .eq('email', email)
      .limit(1);

    if (error) throw error; // problema na consulta: quem chamou trata o erro
    return data.length > 0;
  }

  /**
   * Busca na tabela "perfil" o id do perfil informado (ex.: "aluno").
   * Retorna o número do id_perfil.
   */
  async function buscarIdPerfil(tipoPerfil) {
    const { data, error } = await db
      .from('perfil')
      .select('id_perfil')
      .ilike('nome_perfil', tipoPerfil) // ilike ignora maiúsculas/minúsculas
      .limit(1);

    if (error) throw error;
    if (data.length === 0) {
      throw new Error('Perfil "' + tipoPerfil + '" não encontrado na tabela perfil.');
    }
    return data[0].id_perfil;
  }

  /**
   * Insere o novo usuário na tabela "usuario".
   */
  async function inserirUsuario(nome, email, senha, idPerfil) {
    const { error } = await db.from('usuario').insert({
      nome: nome,
      email: email,
      senha: senha,
      id_perfil: idPerfil,
      tipo_perfil: TIPO_PERFIL_PADRAO
    });

    if (error) throw error;
  }

  /**
   * Transforma o erro técnico do Supabase em uma mensagem que ajuda a achar o problema.
   * O texto original também aparece no Console (F12) com console.error.
   */
  function descreverErro(erro) {
    const codigo = erro && erro.code ? erro.code : '';
    const texto = erro && erro.message ? erro.message : 'erro desconhecido';

    if (codigo === '42501') {
      return 'Banco bloqueou a operação (RLS/permissão). Detalhe: ' + texto;
    }
    if (codigo === '23502') {
      return 'Campo obrigatório sem valor no banco (ex.: id_usuario sem auto-incremento). Detalhe: ' + texto;
    }
    if (codigo === '23503') {
      return 'id_perfil não existe na tabela perfil. Detalhe: ' + texto;
    }
    if (codigo === '23505') {
      // constraint uq_usuario_email: outro cadastro com o mesmo e-mail foi feito
      // entre a verificação e a gravação
      return 'Este e-mail já está cadastrado.';
    }
    if (codigo === '23514') {
      return 'Valor recusado por regra do banco (ex.: tipo_perfil). Detalhe: ' + texto;
    }
    if (codigo === '42P01') {
      return 'Tabela não encontrada no banco. Detalhe: ' + texto;
    }
    return 'Não foi possível concluir o cadastro. Detalhe: ' + texto;
  }

  // ---------- FLUXO PRINCIPAL ----------

  /**
   * Executa quando a pessoa clica em "Cadastrar".
   */
  async function aoEnviarFormulario(evento) {
    evento.preventDefault(); // impede a página de recarregar

    // 1) LER o formulário (trim() remove espaços no começo e no fim)
    const nome = campoNome.value.trim();
    const email = campoEmail.value.trim().toLowerCase(); // e-mail sempre minúsculo
    const senha = campoSenha.value;                      // senha não leva trim
    const confirmarSenha = campoConfirmar.value;

    // 2) VALIDAR
    const erroValidacao = validarDados(nome, email, senha, confirmarSenha);
    if (erroValidacao) {
      mostrarMensagem(erroValidacao, false);
      return; // para por aqui
    }

    // Desativa o botão para evitar cliques duplicados
    botaoEnviar.disabled = true;
    mostrarMensagem('Cadastrando...', true);

    try {
      // 3) GRAVAR no banco
      // 3.1 - não permitir e-mail repetido
      if (await emailJaExiste(email)) {
        mostrarMensagem('Este e-mail já está cadastrado.', false);
        botaoEnviar.disabled = false;
        return;
      }

      // 3.2 - descobrir o id_perfil e 3.3 - inserir o usuário
      const idPerfil = await buscarIdPerfil(TIPO_PERFIL_PADRAO);
      await inserirUsuario(nome, email, senha, idPerfil);

      // 4) AVISAR o resultado e ir para o login
      mostrarMensagem('Cadastro realizado com sucesso! Redirecionando para o login...', true);
      setTimeout(function () {
        window.location.href = PAGINA_LOGIN;
      }, TEMPO_REDIRECIONAMENTO);

    } catch (erro) {
      // Qualquer problema inesperado (internet, banco, etc.) cai aqui
      console.error('Erro no cadastro:', erro);
      mostrarMensagem(descreverErro(erro), false);
      botaoEnviar.disabled = false;
    }
  }

  // Liga a função ao evento "submit" do formulário
  formCadastro.addEventListener('submit', aoEnviarFormulario);

})();
