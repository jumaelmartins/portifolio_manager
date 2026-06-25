# CI/CD com GitHub Actions — Design Spec

**Data:** 2026-06-25
**Status:** Aprovado

---

## Contexto

O repositório é um monorepo com dois serviços independentes:

- `backend/` — NestJS + Prisma + PostgreSQL
- `frontend/` — Next.js 16 (BFF pattern)

Ambos têm Dockerfiles prontos. Não há nenhum pipeline de CI/CD configurado.

---

## Decisões

| Decisão | Escolha |
|---|---|
| Destino de deploy | VPS Hostinger |
| Registry de imagens | GitHub Container Registry (GHCR) |
| Gatilho de deploy | Push na `master` |
| Testes no CI | Unitários apenas (lint + unit tests) |
| Filtro por path | Sim — cada workflow filtra seu próprio diretório |

---

## Estrutura dos arquivos

```
.github/workflows/
├── backend.yml
└── frontend.yml
```

Dois arquivos independentes. Cada um gerencia o ciclo completo do seu serviço: CI → build Docker → deploy na VPS.

---

## Jobs (idênticos nos dois workflows, com nomes trocados)

### `ci`

- Runner: `ubuntu-latest`
- `working-directory`: `backend/` ou `frontend/`
- Passos:
  1. `actions/checkout`
  2. `actions/setup-node@v4` com Node 22 e cache `npm`
  3. `npm ci`
  4. `npm run lint`
  5. `npm run test` (backend) / `npm run test:run` (frontend)

### `docker` — `needs: ci`

- Login no GHCR via `docker/login-action` usando `GITHUB_TOKEN` (automático, sem secret extra)
- Build com `docker/build-push-action`
- Context: `./backend` ou `./frontend`
- Tags publicadas:
  - `ghcr.io/jumaelmartins/portfolio-manager-backend:sha-${{ github.sha }}`
  - `ghcr.io/jumaelmartins/portfolio-manager-backend:latest`

### `deploy` — `needs: docker`

- Action: `appleboy/ssh-action@v1`
- Conecta na VPS usando os secrets `VPS_HOST`, `VPS_USER`, `VPS_SSH_KEY`
- Comandos remotos executados:
  ```bash
  echo "$CR_PAT" | docker login ghcr.io -u jumaelmartins --password-stdin
  cd /opt/portfolio-manager
  docker compose -f docker-compose.prod.yml pull backend   # ou frontend
  docker compose -f docker-compose.prod.yml up -d backend  # ou frontend
  ```

---

## Path filtering

Cada workflow só dispara em `push` na `master` quando arquivos do seu escopo mudam:

**`backend.yml`:**
```yaml
on:
  push:
    branches: [master]
    paths:
      - "backend/**"
      - ".github/workflows/backend.yml"
```

**`frontend.yml`:**
```yaml
on:
  push:
    branches: [master]
    paths:
      - "frontend/**"
      - ".github/workflows/frontend.yml"
```

Mudanças que afetam apenas o `frontend/` não disparam o pipeline do `backend/`, e vice-versa.

---

## Imagens Docker publicadas

```
ghcr.io/jumaelmartins/portfolio-manager-backend:latest
ghcr.io/jumaelmartins/portfolio-manager-backend:sha-<commit>
ghcr.io/jumaelmartins/portfolio-manager-frontend:latest
ghcr.io/jumaelmartins/portfolio-manager-frontend:sha-<commit>
```

A tag `:sha-<commit>` permite rollback para qualquer versão anterior sem precisar de nova tag manual.

---

## Secrets necessários

Configurar em `Settings → Secrets and variables → Actions` do repositório:

| Secret | Descrição |
|---|---|
| `VPS_HOST` | IP ou domínio da VPS |
| `VPS_USER` | Usuário SSH (ex: `root`) |
| `VPS_SSH_KEY` | Chave privada SSH (ed25519 recomendado) |
| `CR_PAT` | GitHub PAT com escopo `read:packages` — usado pela VPS para autenticar no GHCR |

O `GITHUB_TOKEN` (automático) é usado apenas dentro do workflow para fazer push das imagens. A VPS precisa do `CR_PAT` separado porque não tem acesso ao token efêmero do Actions.

---

## Pré-requisitos na VPS

- Docker + Docker Compose instalados
- `docker-compose.prod.yml` presente em `/opt/portfolio-manager/` (ver abaixo)
- Usuário SSH com permissão para rodar `docker` (ou `root`)

A configuração inicial da VPS é feita manualmente uma única vez. O pipeline não provisiona infraestrutura.

### `docker-compose.prod.yml`

O `docker-compose.yml` atual usa `build:` contexts — constrói localmente. Na VPS, o compose precisa referenciar as imagens do GHCR diretamente para que `docker compose pull` funcione:

```yaml
services:
  db:
    image: postgres:16-alpine
    # ... mesmas configs do docker-compose.yml

  backend:
    image: ghcr.io/jumaelmartins/portfolio-manager-backend:latest
    # ... mesmas configs (ports, environment, depends_on, healthcheck)

  frontend:
    image: ghcr.io/jumaelmartins/portfolio-manager-frontend:latest
    # ... mesmas configs
```

Este arquivo é criado como parte da implementação e copiado para a VPS manualmente na configuração inicial.

---

## Fluxo completo

```
push na master (com mudanças em backend/**)
        │
        ▼
  [ci] lint + unit tests
        │ (falhou → pipeline para, nada vai para produção)
        ▼
  [docker] build + push :sha-abc123 e :latest no GHCR
        │
        ▼
  [deploy] SSH → docker pull + docker compose up -d backend
```

---

## Fora do escopo

- Testes E2E no CI (Playwright / Jest E2E)
- Rollback automático em caso de falha pós-deploy
- Notificações (Slack, email)
- Provisionamento da VPS
- Ambientes de staging
