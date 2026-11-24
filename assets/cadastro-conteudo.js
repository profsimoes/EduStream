
/*
=========================================================
 EduStream - Equipe 2
 Arquivo: /assets/js/cadastro-conteudo.js

 Função:
 - Carregar categorias do banco.
 - Cadastrar novos conteúdos educacionais.
 - Validar os dados do formulário.
 - Inserir os dados na tabela conteudo.

 Tabelas utilizadas:
 - categoria
 - conteudo

 Este arquivo utiliza o cliente Supabase já configurado
 no projeto.
=========================================================
*/

// -------------------------------------------------------
// 1. IDENTIFICAR O CLIENTE SUPABASE
// -------------------------------------------------------

// Utiliza o cliente que já foi criado no projeto.
const clienteSupabase =
    window.edustreamSupabase ||
    window.supabaseClient ||
    window.supabase;

// -------------------------------------------------------
// 2. LOCALIZAR OS ELEMENTOS HTML
// -------------------------------------------------------

const formulario = document.getElementById("form-cadastro-conteudo");

const campoTitulo = document.getElementById("titulo");
const campoDescricao = document.getElementById("descricao");
const campoTipo = document.getElementById("tipo");
const campoLink = document.getElementById("link_conteudo");
const campoCategoria = document.getElementById("id_categoria");
const campoDuracao = document.getElementById("duracao_segundos");

const mensagem = document.getElementById("mensagem");
const botaoCadastrar = document.getElementById("btn-cadastrar");

// -------------------------------------------------------
// 3. EXIBIR MENSAGENS
// -------------------------------------------------------

// Mostra uma mensagem ao usuário.
function mostrarMensagem(texto) {
    if (!mensagem) return;

    mensagem.textContent = texto;
}

// Limpa a mensagem exibida.
function limparMensagem() {
    if (!mensagem) return;

    mensagem.textContent = "";
}

// -------------------------------------------------------
// 4. VALIDAR LINKS
// -------------------------------------------------------

// Verifica se o link informado é válido e utiliza
// HTTP ou HTTPS.
function validarLink(link) {
    if (!link) return false;

    try {
        const url = new URL(link);

        return url.protocol === "http:" ||
               url.protocol === "https:";
    } catch {
        return false;
    }
}

// -------------------------------------------------------
// 5. CARREGAR CATEGORIAS
// -------------------------------------------------------

async function carregarCategorias() {
    if (!campoCategoria) return;

    const { data, error } = await clienteSupabase
        .from("categoria")
        .select("id_categoria, nome")
        .order("nome", { ascending: true });

    if (error) {
        console.error("Erro ao carregar categorias:", error);

        mostrarMensagem("Não foi possível carregar as categorias.");

        return;
    }

    // Adiciona as categorias ao campo de seleção.
    (data || []).forEach(categoria => {
        const opcao = document.createElement("option");

        opcao.value = categoria.id_categoria;
        opcao.textContent = categoria.nome;

        campoCategoria.appendChild(opcao);
    });
}

// -------------------------------------------------------
// 6. VALIDAR OS DADOS DO FORMULÁRIO
// -------------------------------------------------------

function validarFormulario() {
    const titulo = campoTitulo?.value.trim();
    const descricao = campoDescricao?.value.trim();
    const tipo = campoTipo?.value.trim();
    const link = campoLink?.value.trim();
    const categoria = campoCategoria?.value;
    const duracao = campoDuracao?.value.trim();

    // Verifica campos obrigatórios.
    if (!titulo || !descricao || !tipo || !link || !categoria) {
        mostrarMensagem("Preencha todos os campos obrigatórios.");
        return false;
    }

    // Verifica o link.
    if (!validarLink(link)) {
        mostrarMensagem("Informe um link válido com HTTP ou HTTPS.");
        return false;
    }

    // Se a duração foi preenchida, verifica se é válida.
    if (duracao !== "") {
        const segundos = Number(duracao);

        if (
            !Number.isInteger(segundos) ||
            segundos < 0
        ) {
            mostrarMensagem(
                "A duração deve ser um número inteiro de segundos, igual ou maior que zero."
            );

            return false;
        }
    }

    limparMensagem();

    return true;
}

// -------------------------------------------------------
// 7. CADASTRAR CONTEÚDO
// -------------------------------------------------------

async function cadastrarConteudo(event) {
    // Impede o recarregamento da página.
    event.preventDefault();

    limparMensagem();

    // Verifica os dados antes de enviar.
    if (!validarFormulario()) {
        return;
    }

    // Evita que o usuário clique várias vezes.
    if (botaoCadastrar) {
        botaoCadastrar.disabled = true;
        botaoCadastrar.textContent = "Cadastrando...";
    }

    try {
        // Monta o objeto com os dados do formulário.
        // Os nomes correspondem exatamente às colunas
        // da tabela conteudo.
        const novoConteudo = {
            titulo: campoTitulo.value.trim(),
            descricao: campoDescricao.value.trim(),
            tipo: campoTipo.value.trim(),
            link_conteudo: campoLink.value.trim(),
            data_publicacao: new Date().toISOString(),
            id_categoria: campoCategoria.value
        };

        // Duração é opcional.
        if (campoDuracao.value.trim() !== "") {
            novoConteudo.duracao_segundos =
                Number(campoDuracao.value);
        }

        // Envia os dados para o Supabase.
        const { error } = await clienteSupabase
            .from("conteudo")
            .insert([novoConteudo]);

        // Se o banco retornar um erro, ele será exibido.
        if (error) {
            console.error("Erro ao cadastrar conteúdo:", error);

            mostrarMensagem(
                "Não foi possível cadastrar o conteúdo. Verifique as permissões."
            );

            return;
        }

        // Cadastro realizado.
        mostrarMensagem("Conteúdo cadastrado com sucesso!");

        // Limpa os campos após o cadastro.
        formulario.reset();

    } catch (error) {
        console.error("Erro inesperado:", error);

        mostrarMensagem(
            "Ocorreu um erro inesperado ao cadastrar o conteúdo."
        );

    } finally {
        // Reativa o botão após o processamento.
        if (botaoCadastrar) {
            botaoCadastrar.disabled = false;
            botaoCadastrar.textContent = "Cadastrar conteúdo";
        }
    }
}

// -------------------------------------------------------
// 8. CONFIGURAR O FORMULÁRIO
// -------------------------------------------------------

// Verifica se o cliente Supabase está disponível.
if (!clienteSupabase || typeof clienteSupabase.from !== "function") {
    console.error("Cliente Supabase não encontrado.");

    mostrarMensagem(
        "Erro na conexão com o banco de dados."
    );
} else {
    // Carrega as categorias assim que o script é executado.
    carregarCategorias();
}

// Adiciona o evento de envio do formulário.
if (formulario) {
    formulario.addEventListener("submit", cadastrarConteudo);
}
