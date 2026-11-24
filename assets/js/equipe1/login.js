// =====================================================
// EduStream - Equipe 1 (Usuários e Autenticação)
// Arquivo: /assets/js/equipe1/login.js
// O que faz: realiza o login do usuário na página login.html
// =====================================================

// Tudo fica dentro desta função para não conflitar com os nomes
// de variáveis de outros arquivos (como o utils.js).
(function () {

  // ---------------------------------------------------
  // 1) Pegando os elementos da página (IDs do login.html)
  // ---------------------------------------------------
  const formLogin = document.getElementById("formulario-login");
  const campoEmail = document.getElementById("campo-email");
  const campoSenha = document.getElementById("campo-senha");
  const botaoEntrar = document.getElementById("botao-entrar");
  const areaMensagem = document.getElementById("mensagem-login");

  // Guarda o texto original do botão para devolver depois
  const textoOriginalBotao = botaoEntrar.textContent;

  // ---------------------------------------------------
  // 2) Cliente do Supabase (já criado em supabase-client.js)
  // No projeto, o cliente se chama "db".
  // ---------------------------------------------------
  const conexao = (typeof db !== "undefined") ? db : null;

  // ---------------------------------------------------
  // 3) Função auxiliar: mostrar mensagem na tela
  // ---------------------------------------------------
  function exibirMensagem(texto) {
    areaMensagem.textContent = texto;
  }

  // ---------------------------------------------------
  // 4) Função auxiliar: ligar/desligar o botão
  // ---------------------------------------------------
  function bloquearBotao(bloquear) {
    botaoEntrar.disabled = bloquear;
    botaoEntrar.textContent = bloquear ? "Entrando..." : textoOriginalBotao;
  }

  // ---------------------------------------------------
  // 5) Função principal: fazer o login
  // ---------------------------------------------------
  async function fazerLogin(evento) {
    // Impede o navegador de recarregar a página
    evento.preventDefault();
    exibirMensagem("");

    // Confere se o cliente do Supabase foi encontrado
    if (!conexao) {
      exibirMensagem("Erro: cliente do Supabase (db) não encontrado. Verifique a ordem dos scripts no HTML.");
      return;
    }

    // E-mail: tiramos espaços das pontas. Senha: NÃO mexemos.
    const email = campoEmail.value.trim();
    const senha = campoSenha.value;

    // Passo A: validar campos vazios
    if (email === "" || senha === "") {
      exibirMensagem("Preencha o e-mail e a senha.");
      return;
    }

    bloquearBotao(true);

    try {
      // Passo B: procurar o usuário na tabela "usuario"
      // limit(1) evita erro caso existam registros repetidos
      const { data, error } = await conexao
        .from("usuario")
        .select("id_usuario, nome, email, tipo_perfil")
        .eq("email", email)
        .eq("senha", senha)
        .limit(1);

      if (error) {
        throw error;
      }

      // Passo C: nenhum usuário encontrado
      if (!data || data.length === 0) {
        exibirMensagem("E-mail ou senha incorretos.");
        bloquearBotao(false);
        return;
      }

      const usuario = data[0];

      // Passo D: salvar no localStorage (o layout.js usa isso)
      const usuarioLogado = {
        id_usuario: usuario.id_usuario,
        nome: usuario.nome,
        email: usuario.email,
        tipo_perfil: usuario.tipo_perfil
      };
      localStorage.setItem("edustream_usuario", JSON.stringify(usuarioLogado));

      // Passo E: registrar o acesso em "log_acesso"
      const { error: erroLog } = await conexao
        .from("log_acesso")
        .insert({
          id_usuario: usuario.id_usuario,
          data_hora: new Date().toISOString()
        });

      // Se o log falhar, o login continua (só avisa no console)
      if (erroLog) {
        console.warn("Não foi possível registrar o acesso:", erroLog.message);
      }

      // Passo F: ir para a página de conteúdos
      window.location.href = "/pages/conteudos.html";

    } catch (erro) {
      console.error("Erro no login:", erro);
      exibirMensagem("Erro de conexão. Tente novamente em instantes.");
      bloquearBotao(false);
    }
  }

  // ---------------------------------------------------
  // 6) Ao enviar o formulário, chama a função de login
  // ---------------------------------------------------
  formLogin.addEventListener("submit", fazerLogin);

})();
