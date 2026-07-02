# Portfolio Manager — Roadmap

> Atualizado em 2026-07-02

## Legenda
- ✅ Concluído
- 🔄 Em progresso
- ⬜ Pendente

---

## Fase 1 — Fundação (Backend + Infra) ✅

| Item | Status |
|---|---|
| Estrutura NestJS + Prisma + PostgreSQL | ✅ |
| Módulo de Auth (Register / Login / JWT) | ✅ |
| Verificação de email (token 6-dígitos, 30min) | ✅ |
| Google OAuth (estratégia + guards) | ✅ |
| Forgot / Reset Password (rate limiting, cooldown) | ✅ |
| Módulo Users (CRUD) | ✅ |
| Módulo Projects (CRUD + categoria + tecnologias + capa) | ✅ |
| Módulo Experience (CRUD) | ✅ |
| Módulo Education (CRUD) | ✅ |
| Módulo Courses (CRUD) | ✅ |
| Módulo Custom Sections (CRUD + items + schema dinâmico) | ✅ |
| Módulo Images (upload Multer, jpg/png/gif) | ✅ |
| Módulo Public (portfólio read-only sem auth) | ✅ |
| Módulo Audit (logs de ações) | ✅ |
| Lookups: Categories, Technologies, Roles, Status | ✅ |
| Docker Compose (dev + prod) | ✅ |
| CI/CD — GitHub Actions (backend + frontend) | ✅ |

---

## Fase 2 — Frontend Foundation ✅

| Item | Status |
|---|---|
| Next.js App Router + BFF pattern (Route Handlers) | ✅ |
| Identidade visual / design system base | ✅ |
| Auth: Login, Register, Verify Email | ✅ |
| Auth: Forgot Password / Reset Password | ✅ |
| Shell admin responsivo (layout + sidebar) | ✅ |
| Dashboard overview (estatísticas do portfólio) | ✅ |
| Projects: listagem com busca | ✅ |
| Projects: criação / edição com upload de capa | ✅ |
| BFF routes: auth, session, projects, categories, technologies, images, uploads, dashboard | ✅ |

---

## Fase 3 — Gestão de Conteúdo do Portfólio ✅

| Item | Status |
|---|---|
| **Experience**: página de listagem + formulário create/edit | ✅ |
| **Education**: página de listagem + formulário create/edit | ✅ |
| **Courses**: página de listagem + formulário create/edit | ✅ |
| **Custom Sections**: página de gestão + items com schema dinâmico | ✅ |
| **Profile / Account Settings**: username, foto de perfil, troca de senha | ✅ |

---

## Fase 4 — Portfólio Público (Site) ✅

| Item | Status |
|---|---|
| Rota pública `/portfolio/[userId]` no frontend | ✅ |
| Renderização de todas as seções (projects, experience, education, courses, custom) | ✅ |
| SEO básico (metadata, OG tags) | ✅ |
| Responsividade mobile do site público | ✅ |

---

## Fase 5 — Polimento e Extras 🔄

| Item | Status |
|---|---|
| Admin: gestão de Categories e Technologies (CRUD) | ✅ |
| Reordenação de itens (drag-and-drop) | ⬜ |
| Paginação e filtros avançados | ⬜ |
| Testes E2E frontend (Playwright) para fluxos de conteúdo | ⬜ |
| Soft-delete / arquivamento de itens | ⬜ |

> **Categories/Technologies CRUD** entregue em 2026-07-02 (merge em `master`,
> commit `00bd7d1`): CRUD page-per-record espelhando o módulo Experience, para
> os dois lookups globais. Categories tem CRUD completo para qualquer usuário
> ativo; Technologies permite create/edit a qualquer ativo mas o delete é
> admin-only (role-gated no frontend via sessão). Nav items reabilitados.

---

## Próximo passo

**Fase 5 (continuação)** — itens restantes, cada um independente: reordenação
de itens (drag-and-drop); paginação e filtros avançados; testes E2E frontend
(Playwright) para fluxos de conteúdo; soft-delete / arquivamento de itens.
