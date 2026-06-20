# Fleet Investor Management System (V1)

Plataforma interna de administração de frota de veículos para investidores, com locação para motoristas de apps (Uber, etc).

## Stack

- **Frontend:** Next.js 14 (App Router) + TypeScript + Tailwind CSS
- **Backend/DB:** Supabase (PostgreSQL + Auth + Row Level Security)
- **i18n:** next-intl (PT/EN)
- **Gráficos:** Recharts
- **Exportação:** jsPDF (PDF) + SheetJS (Excel)

## Por que essa stack

O PRD original sugeria Node.js/Express + PostgreSQL hospedados separadamente (Railway/Render). Optamos por Supabase para:

1. Eliminar a camada de API manual — PostgREST gera a API automaticamente a partir do schema
2. Row Level Security nativo no Postgres (essencial para dados financeiros multi-investidor)
3. Auth pronta (login email/senha já é requisito do PRD)
4. Caminho de evolução claro para V2 (portal do investidor) sem reescrever a base

## Estrutura do projeto

```
fleet-investor-system/
├── supabase/
│   └── migrations/          # Schema, RLS, views financeiras, regras de negócio
│       ├── 0000_extensions.sql
│       ├── 0001_initial_schema.sql
│       ├── 0002_rls_policies.sql
│       ├── 0003_financial_views.sql
│       └── 0004_business_rules.sql
└── web/                      # Aplicação Next.js
    ├── app/
    │   ├── (dashboard)/       # Rotas autenticadas (sidebar + layout)
    │   ├── login/
    │   └── api/
    ├── components/
    │   ├── ui/                # Componentes base (Button, Card, Badge, DataTable)
    │   ├── dashboard/         # Sidebar, KPI cards, language switcher
    │   ├── forms/              # Formulários (login, e futuros CRUDs)
    │   └── reports/
    ├── lib/
    │   ├── supabase/           # Clients (browser, server)
    │   ├── utils/               # Formatação (moeda, data, %)
    │   └── i18n.ts
    ├── messages/                # pt.json / en.json
    └── types/database.ts        # Tipos espelhando o schema do banco
```

## Setup

### 1. Criar projeto no Supabase

1. Acesse [supabase.com](https://supabase.com) e crie um novo projeto
2. Em **SQL Editor**, rode as migrations na ordem (0000 → 0004), copiando o conteúdo de cada arquivo em `supabase/migrations/`
3. Em **Authentication → Providers**, confirme que Email está habilitado
4. Crie seu primeiro usuário admin em **Authentication → Users → Add user** (a trigger `handle_new_user` já cria o profile automaticamente com `role = 'admin'`)

### 2. Configurar variáveis de ambiente

```bash
cd web
cp .env.example .env.local
```

Preencha com a URL e anon key do seu projeto Supabase (em **Project Settings → API**).

### 3. Instalar dependências e rodar

```bash
cd web
npm install
npm run dev
```

Acesse `http://localhost:3000` — você será redirecionado para `/login`.

## O que já está implementado

- [x] Schema completo do banco (Investidores, Veículos, Motoristas, Alocações, Receitas, Despesas, Participações, Eventos)
- [x] Row Level Security (admin-only, com estrutura pronta para portal do investidor futuro)
- [x] Validação de regra de negócio: soma de ownership_percentage por veículo nunca excede 100%
- [x] Validação de regra de negócio: apenas uma alocação ativa por veículo por vez
- [x] Views financeiras: profit mensal, ROI, ROI depreciado, lucro por investidor, dashboard summary
- [x] Autenticação (login/logout, proteção de rotas via middleware)
- [x] Dashboard com KPIs e tabela de performance da frota
- [x] i18n PT/EN com seletor de idioma
- [x] CRUD completo: Veículos (lista, criar, editar, detalhe com ROI e participações)
- [x] CRUD completo: Investidores (lista, criar, editar)
- [x] CRUD completo: Motoristas (lista, criar, editar)
- [x] CRUD completo: Receitas (lista, criar, editar, excluir)
- [x] CRUD completo: Despesas (lista, criar, editar, excluir)
- [x] CRUD completo: Eventos de Veículo (lista, criar, editar, excluir, marcar como concluído)
- [x] Alocação de veículos a motoristas (criar, encerrar alocação ativa, histórico)
- [x] Página de detalhe do veículo: ROI, lucro acumulado (com e sem depreciação), gestão de participações de investidores com validação de 100%
- [x] **Relatórios completos:**
  - Relatório de Veículos (ROI, lucro, depreciação) — export PDF/Excel
  - Relatório de Investidores (participação, lucro líquido de taxa, valor de portfólio) — export PDF/Excel
  - Relatório de Frota (consolidado de receitas/despesas/ocupação com totais) — export PDF/Excel
  - Relatório de Eventos (filtro passado/futuro + período customizável) — export PDF/Excel

## Funcionalidades fora do escopo do V1 (conforme PRD original)

Portal do investidor, portal do motorista, app mobile, integração de pagamentos, rastreamento GPS, alertas automáticos de manutenção, contratos digitais, motor de depreciação automática, suporte multi-empresa, ativos imobiliários, analytics com IA.

## Decisão de arquitetura pendente

**Recorrência complexa em eventos** (ex: "toda 3ª terça-feira do mês"): recomendo usar o padrão `RRULE` (RFC 5545), armazenado como string no banco (`vehicle_events.recurrence_rule`, campo a adicionar), com a biblioteca `rrule.js` no frontend para calcular as ocorrências futuras. Essa é a mesma abordagem usada por Google Calendar e Outlook — evita modelar manualmente todas as combinações de recorrência no schema.

## Notas de design

Sistema voltado para uso interno e profissional — densidade de informação alta, tipografia neutra (Inter), paleta discreta (verde profundo para indicadores positivos, âmbar para alertas de manutenção). Números sempre com `tabular-nums` para alinhamento visual em tabelas financeiras.
