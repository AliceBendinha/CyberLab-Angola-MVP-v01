# CyberLab Angola MVP v0.1

Base inicial de uma plataforma web/PWA de aprendizagem prática em cibersegurança. Esta versão estabelece estrutura, navegação, API de saúde, Prisma e documentação; não representa um produto validado.

## Objetivos desta etapa

- Apresentar a landing page CyberLab Angola e a sua proposta.
- Permitir navegação entre landing page, login, registo e dashboard placeholder.
- Servir `GET /api/health`.
- Preparar PostgreSQL com Prisma e um modelo mínimo `User`.
- Deixar pontos de extensão para fases seguintes, sem antecipar os seus módulos.

## Stack

- React, TypeScript, Vite, Tailwind CSS, React Router e PWA.
- Node.js, TypeScript e Express para API REST.
- PostgreSQL e Prisma ORM.
- OpenAPI e código TypeScript gerado para contratos REST.
- Git e pnpm no workspace Replit existente.

> O monorepo fornecido usa pnpm e tem uma verificação que rejeita instalação com npm. Mantemos o gestor existente para evitar um segundo lockfile e preservar a execução no Replit.

## Instalação e execução local

Requisitos: Node.js compatível com o workspace, pnpm e uma instância PostgreSQL.

```bash
pnpm install
cp .env.example .env
```

Edite `DATABASE_URL` no `.env` para apontar à sua base PostgreSQL local. Gere o Prisma Client:

```bash
pnpm --filter @workspace/api-server run db:generate
```

Inicie cada serviço num terminal separado:

```bash
pnpm --filter @workspace/cyberlab-angola run dev
```

```bash
pnpm --filter @workspace/api-server run dev
```

O Vite usa `http://localhost:5173` por omissão. A API local usa a porta definida por `PORT` (5000 no exemplo). O frontend tem as rotas `/`, `/login`, `/register` e `/dashboard`. O health check fica em `http://localhost:5000/api/health`.

Comandos de qualidade:

```bash
pnpm --filter @workspace/cyberlab-angola run typecheck
pnpm --filter @workspace/api-server run typecheck
pnpm run typecheck
pnpm run build
```

## Variáveis de ambiente

Copie `.env.example` para `.env` e defina:

| Variável | Obrigatória | Finalidade |
| --- | --- | --- |
| `DATABASE_URL` | Sim | URL PostgreSQL usada pelo Prisma. |
| `PORT` | Sim para a API | Porta HTTP da API; o workflow Replit injeta a sua porta. |
| `CORS_ORIGINS` | Não | Lista separada por vírgulas de origens permitidas; por omissão, `http://localhost:5173`. |
| `NODE_ENV` | Não | `development`, `production` ou `test`; por omissão, `development`. |
| `VITE_PORT` | Não | Porta local do Vite; por omissão, `5173`. |

Não coloque chaves ou passwords reais no código. O ficheiro `.env` está ignorado pelo Git.

## Estrutura principal

```text
artifacts/
  cyberlab-angola/       # Frontend React/Vite/PWA
  api-server/            # API Express e schema Prisma
lib/
  api-spec/              # Contrato OpenAPI
  api-client-react/      # Hooks gerados
  api-zod/               # Validadores gerados
docs/
  architecture.md
```

## Estado do MVP v0.1

Pronto: landing page, formulários visuais de login/registo, dashboard placeholder, navegação, PWA, Express, health check, configuração inicial do Prisma e documentação.

Deliberadamente fora desta etapa: autenticação real/RBAC, tutor de IA, RAG, missões, Skills Intelligence, Talent Discovery, dados institucionais, dashboard funcional, seeds e integração de APIs de IA.

Consulte [docs/architecture.md](docs/architecture.md) para o fluxo entre frontend, API e base de dados.
