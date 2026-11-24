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

  // ATENÇÃO: nome da variável do cliente Supabase criada em supabase-client.js.
  // Se no seu arquivo o nome for outro, troque somente aqui.
  const db = supabaseClient;

  const TAMANHO_MINIMO_SENHA = 6;        // mínimo de caracteres da senha
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
      mostrarMensagem('Não foi possível concluir o cadastro. Tente novamente.', false);
      botaoEnviar.disabled = false;
    }
  }

  // Liga a função ao evento "submit" do formulário
  formCadastro.addEventListener('submit', aoEnviarFormulario);

})();
