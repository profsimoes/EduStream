# 🚀 Guia de Desenvolvimento e Integração — EduStream

## 1. Prompt Mestre (Copie e Cole na IA antes de gerar qualquer código)

> **CONTEXTO DO PROJETO EDUSTREAM (LEIA ANTES DE GERAR CÓDIGO):**
> Estamos desenvolvendo o **EduStream**, uma aplicação web estática hospedada na **Vercel** e conectada ao **Supabase** (PostgreSQL via `@supabase/supabase-js@2`).
>
> **1. Arquitetura, Layout e Segurança (NÃO ALTERAR):**
> - Todas as páginas HTML ficam na pasta `/pages/` e importam o CSS institucional único: `<link rel="stylesheet" href="/assets/css/style.css">`.
> - O cabeçalho e o rodapé são injetados automaticamente pelo script `/assets/js/layout.js` nas tags `<div id="app-header"></div>` e `<div id="app-footer"></div>` (nas telas públicas `login.html` e `cadastro.html`, use apenas `<div id="app-footer"></div>`). Nunca crie `<header>` ou `<footer>` manuais dentro das páginas.
> - **Autenticação Obrigatória (`layout.js`):** O arquivo `/assets/js/layout.js` bloqueia automaticamente qualquer página privada se não existir o objeto `edustream_usuario` salvo no `localStorage`, redirecionando para `/pages/login.html`.
> - Use as classes CSS já existentes: `.container`, `.grid`, `.card`, `.form-box`, `.btn`, `.btn-secondary`, `.badge` e `.mensagem`. Não escreva CSS inline nem altere as cores institucionais (Verde `#0b8e36` e Azul `#005ca9`).
>
> **2. Conexão com o Supabase:**
> - O cliente já está instanciado nos scripts `/assets/js/supabase-config.js` e `/assets/js/supabase-client.js`. Utilize a variável de conexão já definida lá.
>
> **3. Esquema Exato do Banco de Dados (Tabelas e Colunas):**
> - `perfil` (`id_perfil`, `nome_perfil`)
> - `usuario` (`id_usuario`, `nome`, `email`, `senha`, `id_perfil`, `tipo_perfil` ['aluno', 'professor', 'admin'])
> - `log_acesso` (`id_log`, `data_hora`, `ip`, `id_usuario`)
> - `categoria` (`id_categoria`, `nome`, `descricao`)
> - `conteudo` (`id_conteudo`, `titulo`, `descricao`, `tipo`, `link_conteudo`, `data_publicacao`, `id_categoria`, `duracao_segundos`)
> - `historico_visualizacao` (`id_historico`, `id_usuario`, `id_conteudo`, `data_hora_acesso`, `segundos_assistidos`, `concluido`)
> - `avaliacao` (`id_avaliacao`, `id_usuario`, `id_conteudo`, `nota` [1 a 5], `comentario`, `data_avaliacao`)
>
> **4. Minha Tarefa Agora:**
> Sou da **Equipe [NÚMERO]**. Preciso criar/ajustar o arquivo `[NOME_DO_ARQUIVO]` para realizar `[DESCREVER FUNCIONALIDADE]`. Gere o código completo, limpo, comentado para estudantes do 1º ano e respeitando 100% os nomes de colunas e regras acima.

---

## 2. Estrutura de Pastas Oficial do Projeto

```text
EduStream/
├── vercel.json
├── components/
│   ├── header.html
│   └── footer.html
├── assets/
│   ├── css/
│   │   └── style.css
│   ├── img/
│   │   ├── logo_edustream.png
│   │   ├── logo_edustream2.png
│   │   ├── logo_ceep.jpg
│   │   └── logo_sedms.png
│   └── js/
│       ├── layout.js
│       ├── supabase-config.js
│       ├── supabase-client.js
│       ├── utils.js
│       ├── equipe1/
│       │   ├── login.js               (A criar)
│       │   ├── cadastro.js            (A criar)
│       │   └── usuarios.js            (A criar)
│       ├── equipe2/
│       │   ├── conteudos.js           (A criar)
│       │   └── cadastro-conteudo.js   (A criar)
│       ├── equipe3/
│       │   ├── player.js              (Pronto - revisar integração)
│       │   ├── continuar.js           (A criar)
│       │   └── historico.js           (A criar)
│       └── equipe4/
│           ├── avaliacoes.js          (Pronto - alinhar sessão)
│           └── recomendados.js        (Pronto - expandir indicadores)
└── pages/
    ├── login.html                     (Pronto)
    ├── cadastro.html                  (A criar - Equipe 1)
    ├── usuarios.html                  (A criar - Equipe 1)
    ├── conteudos.html                 (Pronto)
    ├── novo-conteudo.html             (A criar - Equipe 2)
    ├── player.html                    (A criar - Equipe 3)
    ├── continuar.html                 (Pronto)
    ├── historico.html                 (Pronto)
    ├── avaliacoes.html                (Pronto)
    └── recomendados.html              (Pronto)
