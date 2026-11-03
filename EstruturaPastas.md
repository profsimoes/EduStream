edustream/
├── README.md
├── .gitignore
├── .env.example
├── package.json
├── next.config.mjs
├── tailwind.config.ts
├── postcss.config.mjs
├── tsconfig.json
│
├── app/
│   ├── layout.tsx
│   ├── globals.css
│   ├── page.tsx                      ← home (catálogo público)
│   │
│   ├── login/page.tsx                ← Equipe 1
│   ├── cadastro/page.tsx             ← Equipe 1
│   ├── admin/usuarios/page.tsx       ← Equipe 1
│   │
│   ├── conteudos/page.tsx            ← Equipe 2 (catálogo com filtro)
│   ├── conteudos/[id]/page.tsx       ← Equipe 2 + player da Equipe 3
│   │
│   ├── continuar/page.tsx            ← Equipe 3
│   ├── historico/page.tsx            ← Equipe 3
│   │
│   ├── recomendados/page.tsx         ← Equipe 4
│   └── avaliacoes/page.tsx           ← Equipe 4
│
├── components/
│   ├── ui/                           ← componentes base (todos podem usar)
│   │   ├── Button.tsx
│   │   ├── Card.tsx
│   │   ├── Input.tsx
│   │   └── Badge.tsx
│   ├── equipe1/
│   ├── equipe2/
│   ├── equipe3/
│   └── equipe4/
│
├── lib/
│   ├── supabase.ts                   ← NÃO EDITAR (professor)
│   ├── types.ts                      ← NÃO EDITAR (professor)
│   └── format.ts                     ← helpers de data/duração
│
├── equipes/
│   ├── equipe1/
│   │   ├── README.md
│   │   ├── sql/
│   │   │   ├── 01_migracao_perfil.sql
│   │   │   └── 02_seed_usuarios.sql
│   │   ├── consultas/
│   │   │   ├── indicador_perfil.sql
│   │   │   └── investigacao_conclusao.sql
│   │   └── docs/relatorio.md
│   ├── equipe2/
│   │   ├── README.md
│   │   ├── sql/
│   │   │   ├── 01_migracao_conteudo.sql
│   │   │   └── 02_seed_conteudos.sql
│   │   ├── consultas/
│   │   │   ├── indicador_duracao_media.sql
│   │   │   └── investigacao_retencao.sql
│   │   └── docs/relatorio.md
│   ├── equipe3/
│   │   ├── README.md
│   │   ├── sql/
│   │   │   ├── 01_migracao_historico.sql
│   │   │   └── 02_seed_historico.sql
│   │   ├── consultas/
│   │   │   ├── indicador_evasao.sql
│   │   │   └── investigacao_queda_atencao.sql
│   │   └── docs/relatorio.md
│   └── equipe4/
│       ├── README.md
│       ├── sql/
│       │   ├── 01_migracao_avaliacao.sql
│       │   └── 02_seed_avaliacoes.sql
│       ├── consultas/
│       │   ├── indicador_correlacao.sql
│       │   ├── recomendacao_join_avg.sql
│       │   └── investigacao_avaliacao.sql
│       └── docs/relatorio.md
│
└── public/
    └── logo.svg
