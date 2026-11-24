// =====================================================
// EduStream - Equipe 1 (Usuários e Autenticação)
// Arquivo: /assets/js/login.js
// O que faz: realiza o login do usuário na página login.html
// =====================================================

// ATENÇÃO: o cliente do Supabase já é criado em
// /assets/js/supabase-config.js e /assets/js/supabase-client.js.
// Aqui só USAMOS essa variável. Se no seu projeto ela tiver outro nome
// (ex.: "supabase"), troque apenas esta linha:
const conexao = supabaseClient;

// -----------------------------------------------------
// 1) Pegando os elementos da página
// -----------------------------------------------------
const formLogin = document.querySelector("form");          // o formulário
const campoEmail = document.querySelector("#email");       // campo de e-mail
const campoSenha = document.querySelector("#senha");       // campo de senha
const botaoEntrar = document.querySelector('button[type="submit"]'); // botão de entrar
const areaMensagem = document.querySelector(".mensagem");  // onde aparecem os avisos

// -----------------------------------------------------
// 2) Função auxiliar: mostrar mensagem na tela
// -----------------------------------------------------
function mostrarMensagem(texto) {
  areaMensagem.textContent = texto;
}

// -----------------------------------------------------
// 3) Função auxiliar: ligar/desligar o botão
//    (evita clicar várias vezes enquanto a consulta roda)
// -----------------------------------------------------
function bloquearBotao(bloquear) {
  botaoEntrar.disabled = bloquear;
  botaoEntrar.textContent = bloquear ? "Entrando..." : "Entrar";
}

// -----------------------------------------------------
// 4) Função principal: fazer o login
// -----------------------------------------------------
async function fazerLogin(evento) {
  // Impede o navegador de recarregar a página ao enviar o formulário
  evento.preventDefault();

  // Limpa qualquer mensagem antiga
  mostrarMensagem("");

  // Pega o que a pessoa digitou (trim() tira espaços do começo e do fim)
  const email = campoEmail.value.trim();
  const senha = campoSenha.value.trim();

  // ---- Passo A: validar se os campos não estão vazios ----
  if (email === "" || senha === "") {
    mostrarMensagem("Preencha o e-mail e a senha.");
    return; // para aqui, não continua
  }

  // Desabilita o botão enquanto consultamos o banco
  bloquearBotao(true);

  try {
    // ---- Passo B: consultar a tabela "usuario" no Supabase ----
    // Procuramos UM usuário com o mesmo email E a mesma senha
    const { data: usuario, error } = await conexao
      .from("usuario")
      .select("id_usuario, nome, email, tipo_perfil")
      .eq("email", email)
      .eq("senha", senha)
      .maybeSingle(); // devolve 1 usuário, ou null se não achar

    // Se o Supabase devolveu erro, vamos para o bloco catch
    if (error) {
      throw error;
    }

    // ---- Passo C: nenhum usuário encontrado = dados incorretos ----
    if (!usuario) {
      mostrarMensagem("E-mail ou senha incorretos.");
      bloquearBotao(false);
      return;
    }

    // ---- Passo D: salvar o usuário no localStorage ----
    // O layout.js usa este objeto para liberar as páginas privadas
    const usuarioLogado = {
      id_usuario: usuario.id_usuario,
      nome: usuario.nome,
      email: usuario.email,
      tipo_perfil: usuario.tipo_perfil
    };
    localStorage.setItem("edustream_usuario", JSON.stringify(usuarioLogado));

    // ---- Passo E: registrar o acesso na tabela "log_acesso" ----
    const { error: erroLog } = await conexao
      .from("log_acesso")
      .insert({
        id_usuario: usuario.id_usuario,
        data_hora: new Date().toISOString() // data e hora atuais
      });

    // Se o log falhar, o login continua valendo (só avisamos no console)
    if (erroLog) {
      console.warn("Não foi possível registrar o acesso:", erroLog.message);
    }

    // ---- Passo F: ir para a página de conteúdos ----
    window.location.href = "/pages/conteudos.html";

  } catch (erro) {
    // Qualquer falha de conexão ou do banco cai aqui
    console.error("Erro no login:", erro);
    mostrarMensagem("Erro de conexão. Tente novamente em instantes.");
    bloquearBotao(false);
  }
}

// -----------------------------------------------------
// 5) Quando o formulário for enviado, chama a função de login
// -----------------------------------------------------
formLogin.addEventListener("submit", fazerLogin);
