# Arquitetura — CyberLab Angola MVP v0.1

## Arquitetura geral

O projeto separa a aplicação web da API. O frontend comunica com a API REST; a API é responsável por validar pedidos e, quando necessário, aceder ao PostgreSQL através do Prisma.

```text
React PWA (client)
        ↓ HTTP / JSON
API REST (Express)
        ↓ Prisma
PostgreSQL
```

## Tecnologias

- **Frontend:** React, TypeScript, Vite, Tailwind CSS, React Router e suporte PWA.
- **Backend:** Node.js, TypeScript e Express.
- **Contrato REST:** OpenAPI, com geração dos clientes e validadores TypeScript.
- **Base de dados:** PostgreSQL e Prisma ORM.
- **Workspace:** pnpm, conforme o monorepo Replit já existente.

## Responsabilidades

### Frontend

Apresenta as páginas públicas, recolhe interação visual e navega entre rotas. Login, registo e dashboard são apenas interfaces nesta etapa; não enviam dados nem guardam sessões.

### Backend

Expõe a API REST, valida a configuração do processo, restringe origens CORS e normaliza erros. Nesta versão, apenas `GET /api/health` tem a resposta funcional pedida. `GET /api/healthz` é mantido para compatibilidade com o template Replit.

### Base de dados

O Prisma está configurado para PostgreSQL. O modelo inicial `User` contém apenas campos básicos e o papel (`STUDENT`, `INSTRUCTOR` ou `ADMIN`). Não há autenticação, criação de contas, seeds ou migrações nesta etapa.

## Preparação para módulos futuros

Existem pastas reservadas para autenticação, utilizadores, missões, competências, IA e dashboard. São apenas pontos de extensão: AI Tutor, RAG, Mission Engine, Skills Intelligence, Talent Discovery e dashboard institucional não estão implementados.

Nenhuma chave de IA é configurada ou enviada ao frontend. Uma integração futura deve ser chamada pelo backend e usar secrets no servidor.

## Fluxo de comunicação

1. O browser carrega a PWA React servida pelo Vite.
2. O frontend poderá enviar pedidos HTTP/JSON ao prefixo `/api`; nesta etapa não há chamadas de produto.
3. O Express trata rotas, CORS e erros e responde ao health check.
4. Os serviços futuros usarão o cliente Prisma no servidor para comunicar com PostgreSQL; a base de dados não é acessível pelo frontend.

## Mapa do workspace

- `artifacts/cyberlab-angola/src/` — aplicação React e recursos PWA.
- `artifacts/api-server/src/` — API Express, middleware e pontos de extensão backend.
- `artifacts/api-server/prisma/schema.prisma` — fonte do schema Prisma, mantido junto do serviço que o utiliza.
- `lib/api-spec/openapi.yaml` — contrato REST.
- `lib/api-client-react/` e `lib/api-zod/` — código gerado a partir do contrato.
- `docs/` — documentação do produto e arquitetura.
