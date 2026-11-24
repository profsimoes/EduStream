
/*
=========================================================
 EduStream - Equipe 2
 Arquivo: /assets/js/conteudos.js

 Função:
 - Buscar conteúdos no Supabase.
 - Pesquisar pelo título ou descrição.
 - Filtrar por categoria e tipo.
 - Ordenar os resultados.
 - Exibir os conteúdos na tela.

 Tabela utilizada: conteudo
 Tabela de categorias: categoria

 IMPORTANTE:
 O script usa o cliente Supabase que já foi
 configurado em supabase-config.js e supabase-client.js.
=========================================================
*/

// -------------------------------------------------------
// 1. IDENTIFICAR O CLIENTE SUPABASE
// -------------------------------------------------------

// Utiliza o cliente já criado nos arquivos de configuração.
// Caso seu projeto use outro nome para a variável,
// ajuste esta parte para o nome já existente.
const clienteSupabase =
    window.edustreamSupabase ||
    window.supabaseClient ||
    window.supabase;

// -------------------------------------------------------
// 2. LOCALIZAR OS ELEMENTOS DA PÁGINA
// -------------------------------------------------------

const campoBusca = document.getElementById("campo-busca");
const filtroCategoria = document.getElementById("filtro-categoria");
const filtroTipo = document.getElementById("filtro-tipo");
const ordenacao = document.getElementById("ordenacao");
const listaConteudos = document.getElementById("lista-conteudos");
const mensagem = document.getElementById("mensagem");

// -------------------------------------------------------
// 3. GUARDAR OS DADOS CARREGADOS
// -------------------------------------------------------

// Essas listas guardam os dados que vieram do banco.
// Assim, os filtros podem funcionar sem fazer uma
// nova consulta ao Supabase a cada digitação.

let conteudos = [];
let categorias = [];

// -------------------------------------------------------
// 4. FUNÇÕES AUXILIARES
// -------------------------------------------------------

// Exibe uma mensagem na tela.
function exibirMensagem(texto) {
    if (!mensagem) return;

    mensagem.textContent = texto;
}

// Limpa a mensagem.
function limparMensagem() {
    if (!mensagem) return;

    mensagem.textContent = "";
}

// Converte segundos em um formato de duração legível.
// Exemplos: 125 segundos = 2 min 5 s.
function formatarDuracao(segundos) {
    if (segundos === null || segundos === undefined) {
        return "Duração não informada";
    }

    const valor = Number(segundos);

    if (!Number.isFinite(valor) || valor < 0) {
        return "Duração não informada";
    }

    const minutos = Math.floor(valor / 60);
    const restante = valor % 60;

    if (minutos === 0) {
        return `${restante} s`;
    }

    if (restante === 0) {
        return `${minutos} min`;
    }

    return `${minutos} min ${restante} s`;
}

// Formata a data de publicação.
function formatarData(data) {
    if (!data) {
        return "Data não informada";
    }

    const dataConvertida = new Date(data);

    if (Number.isNaN(dataConvertida.getTime())) {
        return "Data não informada";
    }

    return dataConvertida.toLocaleDateString("pt-BR");
}

// Evita que textos do banco sejam interpretados como HTML.
// Isso ajuda a prevenir ataques de injeção de código.
function escaparHTML(valor) {
    return String(valor ?? "").replace(/[&<>"']/g, caractere => {
        const substituicoes = {
            "&": "&amp;",
            "<": "&lt;",
            ">": "&gt;",
            '"': "&quot;",
            "'": "&#39;"
        };

        return substituicoes[caractere];
    });
}

// Verifica se um link é seguro para abrir.
function validarLink(link) {
    if (!link) return null;

    try {
        const url = new URL(link);

        // Aceita somente links HTTP e HTTPS.
        if (url.protocol === "https:" || url.protocol === "http:") {
            return url.href;
        }

        return null;
    } catch {
        return null;
    }
}

// -------------------------------------------------------
// 5. BUSCAR CATEGORIAS NO SUPABASE
// -------------------------------------------------------

async function carregarCategorias() {
    const { data, error } = await clienteSupabase
        .from("categoria")
        .select("id_categoria, nome, descricao")
        .order("nome", { ascending: true });

    if (error) {
        console.error("Erro ao carregar categorias:", error);
        throw error;
    }

    categorias = data || [];

    // Adiciona as categorias ao filtro da página.
    if (!filtroCategoria) return;

    categorias.forEach(categoria => {
        const opcao = document.createElement("option");

        opcao.value = categoria.id_categoria;
        opcao.textContent = categoria.nome;

        filtroCategoria.appendChild(opcao);
    });
}

// -------------------------------------------------------
// 6. BUSCAR CONTEÚDOS NO SUPABASE
// -------------------------------------------------------

async function carregarConteudos() {
    exibirMensagem("Carregando conteúdos...");

    const { data, error } = await clienteSupabase
        .from("conteudo")
        .select(`
            id_conteudo,
            titulo,
            descricao,
            tipo,
            link_conteudo,
            data_publicacao,
            id_categoria,
            duracao_segundos
        `)
        .order("data_publicacao", { ascending: false })
        .limit(1000);

    if (error) {
        console.error("Erro ao carregar conteúdos:", error);
        exibirMensagem("Não foi possível carregar os conteúdos.");
        return;
    }

    conteudos = data || [];

    // Depois de carregar, mostra os resultados na tela.
    aplicarFiltros();
}

// -------------------------------------------------------
// 7. DESCOBRIR OS TIPOS DE CONTEÚDO
// -------------------------------------------------------

function carregarTipos() {
    if (!filtroTipo) return;

    // Descobre quais tipos existem nos dados carregados.
    const tipos = [
        ...new Set(
            conteudos
                .map(conteudo => conteudo.tipo)
                .filter(tipo => tipo !== null && tipo !== "")
        )
    ].sort();

    tipos.forEach(tipo => {
        const opcao = document.createElement("option");

        opcao.value = tipo;
        opcao.textContent = tipo;

        filtroTipo.appendChild(opcao);
    });
}

// -------------------------------------------------------
// 8. APLICAR OS FILTROS
// -------------------------------------------------------

function aplicarFiltros() {
    limparMensagem();

    // Obtém o texto digitado pelo usuário.
    const textoBusca = campoBusca
        ? campoBusca.value.trim().toLowerCase()
        : "";

    // Obtém a categoria escolhida.
    const categoriaSelecionada = filtroCategoria
        ? filtroCategoria.value
        : "";

    // Obtém o tipo escolhido.
    const tipoSelecionado = filtroTipo
        ? filtroTipo.value
        : "";

    // Começa com todos os conteúdos.
    let resultados = [...conteudos];

    // Pesquisa pelo título ou pela descrição.
    if (textoBusca) {
        resultados = resultados.filter(conteudo => {
            const titulo = (conteudo.titulo || "").toLowerCase();
            const descricao = (conteudo.descricao || "").toLowerCase();

            return (
                titulo.includes(textoBusca) ||
                descricao.includes(textoBusca)
            );
        });
    }

    // Filtra pela categoria.
    if (categoriaSelecionada) {
        resultados = resultados.filter(conteudo =>
            String(conteudo.id_categoria) === categoriaSelecionada
        );
    }

    // Filtra pelo tipo.
    if (tipoSelecionado) {
        resultados = resultados.filter(conteudo =>
            conteudo.tipo === tipoSelecionado
        );
    }

    // Ordena os resultados.
    const ordemSelecionada = ordenacao
        ? ordenacao.value
        : "recentes";

    switch (ordemSelecionada) {
        case "titulo":
            resultados.sort((a, b) =>
                (a.titulo || "").localeCompare(
                    b.titulo || "",
                    "pt-BR",
                    { sensitivity: "base" }
                )
            );
            break;

        case "antigos":
            resultados.sort((a, b) =>
                new Date(a.data_publicacao || 0) -
                new Date(b.data_publicacao || 0)
            );
            break;

        case "duracao":
            resultados.sort((a, b) =>
                (a.duracao_segundos ?? Infinity) -
                (b.duracao_segundos ?? Infinity)
            );
            break;

        case "recentes":
        default:
            resultados.sort((a, b) =>
                new Date(b.data_publicacao || 0) -
                new Date(a.data_publicacao || 0)
            );
            break;
    }

    // Exibe os conteúdos filtrados.
    renderizarConteudos(resultados);
}

// -------------------------------------------------------
// 9. EXIBIR OS CONTEÚDOS NA PÁGINA
// -------------------------------------------------------

function renderizarConteudos(resultados) {
    if (!listaConteudos) return;

    listaConteudos.innerHTML = "";

    // Se não houver resultados, exibe uma mensagem.
    if (resultados.length === 0) {
        exibirMensagem("Nenhum conteúdo encontrado.");
        return;
    }

    limparMensagem();

    resultados.forEach(conteudo => {
        // Descobre o nome da categoria.
        const categoria = categorias.find(item =>
            String(item.id_categoria) ===
            String(conteudo.id_categoria)
        );

        const nomeCategoria = categoria
            ? categoria.nome
            : "Sem categoria";

        // Cria o cartão de conteúdo.
        const card = document.createElement("div");

        card.classList.add("card");

        const linkSeguro = validarLink(conteudo.link_conteudo);

        // Monta o conteúdo do cartão.
        card.innerHTML = `
            <h3>${escaparHTML(conteudo.titulo || "Sem título")}</h3>

            <p>
                ${escaparHTML(conteudo.descricao || "Sem descrição.")}
            </p>

            <p>
                <span class="badge">
                    ${escaparHTML(conteudo.tipo || "Tipo não informado")}
                </span>
            </p>

            <p>
                <strong>Categoria:</strong>
                ${escaparHTML(nomeCategoria)}
            </p>

            <p>
                <strong>Publicado em:</strong>
                ${escaparHTML(formatarData(conteudo.data_publicacao))}
            </p>

            <p>
                <strong>Duração:</strong>
                ${escaparHTML(formatarDuracao(conteudo.duracao_segundos))}
            </p>

            ${
                linkSeguro
                    ? `<a
                        class="btn"
                        href="${escaparHTML(linkSeguro)}"
                        target="_blank"
                        rel="noopener noreferrer"
                    >
                        Acessar conteúdo
                    </a>`
                    : `<p>Link de conteúdo indisponível.</p>`
            }
        `;

        // Adiciona o cartão à lista.
        listaConteudos.appendChild(card);
    });

    // Mostra a quantidade de resultados.
    exibirMensagem(
        `${resultados.length} conteúdo(s) encontrado(s).`
    );
}

// -------------------------------------------------------
// 10. LIMPAR OS FILTROS
// -------------------------------------------------------

function limparFiltros() {
    if (campoBusca) campoBusca.value = "";
    if (filtroCategoria) filtroCategoria.value = "";
    if (filtroTipo) filtroTipo.value = "";
    if (ordenacao) ordenacao.value = "recentes";

    aplicarFiltros();
}

// -------------------------------------------------------
// 11. CONFIGURAR OS EVENTOS
// -------------------------------------------------------

// A cada digitação, atualiza a pesquisa.
if (campoBusca) {
    campoBusca.addEventListener("input", aplicarFiltros);
}

// Quando a categoria mudar, atualiza os resultados.
if (filtroCategoria) {
    filtroCategoria.addEventListener("change", aplicarFiltros);
}

// Quando o tipo mudar, atualiza os resultados.
if (filtroTipo) {
    filtroTipo.addEventListener("change", aplicarFiltros);
}

// Quando a ordenação mudar, atualiza os resultados.
if (ordenacao) {
    ordenacao.addEventListener("change", aplicarFiltros);
}

// Botão opcional para limpar os filtros.
const botaoLimpar = document.getElementById("limpar-filtros");

if (botaoLimpar) {
    botaoLimpar.addEventListener("click", limparFiltros);
}

// -------------------------------------------------------
// 12. INICIALIZAR O SCRIPT
// -------------------------------------------------------

async function iniciarPaginaConteudos() {
    // Verifica se o cliente Supabase existe.
    if (!clienteSupabase || typeof clienteSupabase.from !== "function") {
        console.error("Cliente Supabase não encontrado.");

        exibirMensagem(
            "Erro na conexão. Verifique a configuração do Supabase."
        );

        return;
    }

    try {
        // Primeiro carregamos as categorias.
        await carregarCategorias();

        // Depois carregamos os conteúdos.
        await carregarConteudos();

        // Montamos o filtro de tipos.
        carregarTipos();

    } catch (error) {
        console.error("Erro ao iniciar a página:", error);

        exibirMensagem(
            "Ocorreu um erro ao carregar os dados."
        );
    }
}

// Executa a inicialização.
iniciarPaginaConteudos();
