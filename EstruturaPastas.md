edustream/
├── index.html                        ← home / catálogo público
├── README.md
├── .gitignore
│
├── assets/
│   ├── css/
│   │   ├── global.css                ← NÃO EDITAR (professor)
│   │   └── equipe1.css ... equipe4.css
│   ├── js/
│   │   ├── supabase-config.js        ← NÃO EDITAR (professor)
│   │   ├── supabase-client.js        ← NÃO EDITAR (professor)
│   │   ├── utils.js                  ← NÃO EDITAR (professor)
│   │   └── equipe1/ ... equipe4/
│   └── img/
│       └── logo.svg
│
├── pages/
│   ├── login.html                    ← Equipe 1
│   ├── cadastro.html                 ← Equipe 1
│   ├── admin-usuarios.html           ← Equipe 1
│   ├── conteudos.html                ← Equipe 2
│   ├── conteudo.html                 ← Equipe 2 (recebe ?id=)
│   ├── continuar.html                ← Equipe 3
│   ├── historico.html                ← Equipe 3
│   ├── recomendados.html             ← Equipe 4
│   └── avaliacoes.html               ← Equipe 4
│
├── equipes/
│   ├── equipe1/
│   │   ├── README.md
│   │   ├── sql/01_migracao_perfil.sql
│   │   ├── sql/02_seed_usuarios.sql
│   │   ├── consultas/indicador_perfil.sql
│   │   ├── consultas/investigacao_conclusao.sql
│   │   └── docs/relatorio.md
│   ├── equipe2/
│   │   ├── README.md
│   │   ├── sql/01_migracao_conteudo.sql
│   │   ├── sql/02_seed_conteudos.sql
│   │   ├── consultas/indicador_duracao_media.sql
│   │   ├── consultas/investigacao_retencao.sql
│   │   └── docs/relatorio.md
│   ├── equipe3/
│   │   ├── README.md
│   │   ├── sql/01_migracao_historico.sql
│   │   ├── sql/02_seed_historico.sql
│   │   ├── consultas/indicador_evasao.sql
│   │   ├── consultas/investigacao_queda_atencao.sql
│   │   └── docs/relatorio.md
│   └── equipe4/
│       ├── README.md
│       ├── sql/01_migracao_avaliacao.sql
│       ├── sql/02_seed_avaliacoes.sql
│       ├── consultas/indicador_correlacao.sql
│       ├── consultas/recomendacao_join_avg.sql
│       ├── consultas/investigacao_avaliacao.sql
│       └── docs/relatorio.md
│
└── .github/
    └── workflows/
        └── static.yml                ← deploy automático no Pages
