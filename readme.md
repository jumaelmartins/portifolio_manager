# Portfolio Manager

> CMS open-source para gerenciar portfólio profissional, currículo, projetos, experiências, formações, cursos, roadmap público, FAQ, sugestões de melhoria e API pública para consumo em sites pessoais ou portfólios externos.

O **Portfolio Manager** nasceu como um CMS simples para centralizar projetos, experiências, cursos e formações acadêmicas. Com a evolução do projeto, a proposta passou a ser maior: criar uma plataforma open-source de **presença profissional**, permitindo que desenvolvedores, estudantes, freelancers e profissionais de tecnologia gerenciem seu conteúdo profissional em um único lugar e exponham esses dados por meio de uma API pública.

A ideia é evitar que o usuário precise editar manualmente o código do frontend sempre que quiser atualizar um projeto, adicionar uma experiência, alterar uma formação, publicar um item no roadmap ou responder dúvidas frequentes.

---

## Sumário

- [Sobre o projeto](#sobre-o-projeto)
- [Objetivos](#objetivos)
- [Principais recursos](#principais-recursos)
- [Status atual](#status-atual)
- [Tecnologias utilizadas](#tecnologias-utilizadas)
- [Arquitetura geral](#arquitetura-geral)
- [Estrutura do projeto](#estrutura-do-projeto)
- [Como rodar o projeto](#como-rodar-o-projeto)
- [Variáveis de ambiente](#variáveis-de-ambiente)
- [Documentação da API](#documentação-da-api)
- [Módulos planejados](#módulos-planejados)
- [Roadmap](#roadmap)
- [Contribuição](#contribuição)
- [Licença](#licença)

---

## Sobre o projeto

O **Portfolio Manager** é uma aplicação open-source pensada para funcionar como uma central de gerenciamento profissional.

Com ele, será possível administrar:

- Projetos pessoais e profissionais;
- Experiências profissionais;
- Formações acadêmicas;
- Cursos e certificações;
- Tecnologias utilizadas;
- Categorias;
- Imagens e mídias;
- Perfil público;
- Seções customizadas;
- Roadmap público;
- FAQ;
- Sugestões de melhoria;
- Changelog;
- API pública para consumo em frontends externos;
- Exportação futura de currículo e dados.

O projeto pode ser usado tanto como ferramenta pessoal quanto como base open-source para outros desenvolvedores criarem seus próprios portfólios dinâmicos.

---

## Objetivos

### Objetivo principal

Criar uma plataforma para gerenciar conteúdo profissional de forma centralizada e expor esses dados por meio de uma API pública robusta, permitindo que diferentes frontends, sites pessoais ou portfólios consumam o conteúdo sem depender de alterações manuais no código.

### Objetivos secundários

- Facilitar a manutenção de portfólios pessoais;
- Reduzir retrabalho na atualização de projetos e experiências;
- Criar uma base técnica robusta usando NestJS, PostgreSQL, Prisma e Next.js;
- Fornecer uma API pública pronta para consumo;
- Permitir geração futura de currículo em PDF, Markdown, HTML ou JSON;
- Criar um projeto open-source útil, extensível e bem documentado;
- Servir como projeto de portfólio técnico para demonstrar arquitetura, backend, frontend, segurança, documentação e visão de produto.

---

## Principais recursos

### Recursos já implementados

- [x] Autenticação local com registro e login;
- [x] Criptografia de senhas com bcrypt;
- [x] Verificação de e-mail com token de 6 dígitos;
- [x] Expiração de token de verificação em 30 minutos;
- [x] Autenticação com Google OAuth2;
- [x] CRUD de usuários;
- [x] CRUD de projetos;
- [x] CRUD de categorias;
- [x] CRUD de tecnologias;
- [x] Upload de imagens com Multer;
- [x] Armazenamento local de imagens em disco;
- [x] CRUD de experiências profissionais;
- [x] CRUD de formações acadêmicas;
- [x] CRUD de cursos adicionais;
- [x] Seções customizadas com schema em JSON;
- [x] Logs de auditoria para ações autenticadas;
- [x] API pública de leitura;
- [x] Dockerfile e Docker Compose;
- [x] Swagger/OpenAPI;
- [x] Documentação técnica complementar;
- [x] Frontend administrativo responsivo em Next.js;
- [x] Design system e identidade visual próprios;
- [x] Login, cadastro, verificação de e-mail e Google OAuth2;
- [x] Sessão protegida em cookie HttpOnly por meio de BFF;
- [x] Dashboard com indicadores reais do portfólio;
- [x] Listagem, filtros, criação, edição e exclusão de projetos;
- [x] Upload e seleção de capa para projetos;
- [x] Testes unitários, de integração e E2E em desktop e mobile;
- [x] Imagens Docker para backend e frontend.

### Recursos planejados

- [ ] Perfil público gerenciável;
- [ ] Preview público do portfólio;
- [ ] Status de publicação para projetos;
- [ ] Ordenação e destaque de projetos;
- [ ] Editor Markdown/Rich Text;
- [ ] Roadmap público;
- [ ] FAQ pública e administrativa;
- [ ] Tela pública de sugestões de melhoria;
- [ ] Moderação de sugestões no admin;
- [ ] Conversão de sugestões em itens de roadmap;
- [ ] Changelog público;
- [ ] Exportação de currículo;
- [ ] Analytics simples de visualizações e cliques;
- [ ] Integração futura com GitHub;
- [ ] Versão demo pública;
- [ ] Seeds para ambiente de demonstração;
- [ ] CI/CD;
- [ ] Telas administrativas para experiências, formações e cursos.

---

## Status atual

O backend e a fundação do frontend administrativo estão implementados. O sistema já oferece autenticação completa, dashboard, gerenciamento visual de projetos, upload de capas, API pública, auditoria e execução containerizada.

As próximas etapas do frontend são os módulos administrativos de experiências, formações, cursos, perfil público e preview do portfólio.

---

## Tecnologias utilizadas

### Backend

- [NestJS](https://nestjs.com/) v11
- [Prisma ORM](https://www.prisma.io/)
- [PostgreSQL](https://www.postgresql.org/)
- [Passport](https://www.passportjs.org/)
- JWT
- Google OAuth2
- bcrypt
- Multer
- Nodemailer
- Swagger/OpenAPI

### Frontend

- [Next.js](https://nextjs.org/) v16
- React 19
- TypeScript
- Tailwind CSS v4
- TanStack Query
- React Hook Form e Zod
- Base UI
- Vitest, Testing Library e Playwright

### Infraestrutura

- Docker
- Docker Compose
- PostgreSQL containerizado
- Deploy futuro em VPS ou plataforma cloud

---

## Arquitetura geral

O sistema é dividido em duas grandes áreas:

### 1. Área administrativa / CMS

Área autenticada onde o usuário gerencia todo o conteúdo do portfólio.

Módulos previstos:

- Dashboard;
- Projetos;
- Experiências;
- Formações acadêmicas;
- Cursos;
- Tecnologias;
- Categorias;
- Mídia/imagens;
- Perfil público;
- Seções customizadas;
- Roadmap;
- FAQ;
- Sugestões;
- Changelog;
- Auditoria;
- Configurações;
- Exportações.

### 2. Área pública

Área aberta usada para exibir informações públicas do portfólio e do próprio projeto open-source.

Páginas previstas:

- Página inicial pública;
- Perfil público;
- Lista de projetos;
- Detalhe de projeto;
- Experiências;
- Formação e cursos;
- Roadmap público;
- FAQ;
- Sugestões de melhoria;
- Changelog;
- Página de contribuição;
- Documentação da API;
- Preview público.

---

## Estrutura do projeto

```text
portfolio-manager/
├── backend/                  # API REST em NestJS + Prisma
│   ├── prisma/               # Schema do banco, migrations e seeders
│   ├── src/                  # Código fonte do backend
│   │   ├── common/           # Guards, interceptors, pipes e filtros compartilhados
│   │   ├── database/         # Módulo de conexão Prisma
│   │   ├── email/            # Envio de e-mails via Nodemailer
│   │   ├── modules/          # Módulos de negócio da aplicação
│   │   └── utils/            # Tipos e utilitários globais
│   └── test/                 # Testes E2E
├── frontend/                 # Frontend administrativo em Next.js
├── docker-compose.yml        # Orquestração dos serviços
├── README.md                 # Visão geral do projeto
├── DOCUMENTATION.md          # Documentação técnica da arquitetura e APIs
└── LICENSE                   # Licença do projeto
```

---

## Como rodar o projeto

### Pré-requisitos

- Node.js 22 ou superior;
- Docker;
- Docker Compose;
- npm, pnpm ou yarn;
- PostgreSQL, caso rode fora do Docker.

### Modo rápido com Docker Compose

```bash
docker compose up --build
```

A API estará disponível em:

```bash
http://localhost:3000
```

A interface administrativa estará disponível em:

```bash
http://localhost:3001
```

A documentação Swagger estará disponível em:

```bash
http://localhost:3000/api-docs
```

### Desenvolvimento local

Suba o PostgreSQL:

```bash
docker compose up -d db
```

Instale as dependências do backend, configure o ambiente e execute as migrations:

```bash
cd backend
npm ci
cp .env.example .env.development
npm run prisma:dev:migrate
npm run start:dev
```

Em outro terminal, instale e inicie o frontend:

```bash
cd frontend
npm ci
cp .env.example .env.local
npm run dev
```

### Testes

Backend:

```bash
cd backend
npm test
npm run test:e2e
```

Frontend:

```bash
cd frontend
npm run lint
npm run test:run
npm run test:e2e
```

---

## Variáveis de ambiente

Exemplo de variáveis esperadas:

```env
PORT=3000
DATABASE_URL=postgresql://portfolio:portfolio_pass@localhost:5432/portfolio_db
JWT_SECRET=replace-with-a-long-random-secret
JWT_EXPIRATION=24h
FRONTEND_URL=http://localhost:3001
CORS_ORIGINS=http://localhost:3001
BACKEND_PUBLIC_URL=http://localhost:3000
EMAIL_TRANSPORT=json
GOOGLE_CLIENT_ID=
GOOGLE_CLIENT_SECRET=
GOOGLE_CALLBACK_URL=http://localhost:3000/auth/google/callback
BACKEND_URL=http://localhost:3000
NEXT_PUBLIC_APP_URL=http://localhost:3001
SESSION_COOKIE_NAME=pm_session
```

Os valores de Google OAuth são opcionais no desenvolvimento. No Docker Compose eles usam placeholders locais, portanto o botão do Google só deve ser usado após configurar credenciais válidas.

---

## Documentação da API

Com a aplicação rodando, acesse:

```bash
http://localhost:3000/api-docs
```

A documentação técnica completa deve ser mantida em:

```bash
DOCUMENTATION.md
```

A documentação deve incluir:

- Visão da arquitetura;
- Fluxos de autenticação;
- Modelagem do banco de dados;
- Rotas privadas;
- Rotas públicas;
- Exemplos de payload;
- Estratégia de upload;
- Logs de auditoria;
- Padrões de erro;
- Guia de contribuição;
- Guia de deploy.

---

## Módulos planejados

## Dashboard administrativo

Visão geral do estado do portfólio.

Recursos previstos:

- Total de projetos;
- Projetos publicados, rascunhos e arquivados;
- Total de experiências, cursos e formações;
- Sugestões pendentes;
- Itens de roadmap em andamento;
- Últimos conteúdos atualizados;
- Checklist de completude do perfil.

---

## Projetos

Gerenciamento completo dos projetos cadastrados.

Recursos previstos:

- Criar, editar, listar e excluir projetos;
- Definir status: rascunho, publicado, arquivado;
- Marcar como destaque;
- Definir ordem de exibição;
- Adicionar descrição curta e completa;
- Vincular tecnologias;
- Vincular categorias;
- Adicionar imagens;
- Definir imagem de capa;
- Informar links de demo, GitHub e documentação;
- Definir slug público;
- Configurar metadados de SEO;
- Registrar desafios, soluções e aprendizados.

---

## Perfil público

Centraliza as informações profissionais principais do usuário.

Campos previstos:

- Nome profissional;
- Título profissional;
- Bio curta;
- Bio longa;
- Localização;
- Foto/avatar;
- E-mail público;
- GitHub;
- LinkedIn;
- Site pessoal;
- Currículo em PDF;
- Tecnologias principais;
- Disponibilidade para trabalho;
- Frase de destaque.

---

## Experiências, formações e cursos

Módulos responsáveis pela parte curricular.

Recursos previstos:

- Experiências profissionais;
- Formações acadêmicas;
- Cursos adicionais;
- Certificações;
- Instituição/empresa;
- Data de início e fim;
- Status atual;
- Descrição;
- Tecnologias relacionadas;
- Ordem de exibição;
- Visibilidade pública.

---

## FAQ

Módulo para perguntas frequentes do projeto.

Recursos previstos:

- Criar perguntas e respostas;
- Agrupar por categoria;
- Definir ordem de exibição;
- Publicar ou manter como rascunho;
- Exibir FAQ publicamente;
- Facilitar adoção do projeto por usuários e contribuidores.

Categorias sugeridas:

- Geral;
- Instalação;
- Configuração;
- Deploy;
- API pública;
- Autenticação;
- Uploads;
- Contribuição;
- Problemas comuns.

---

## Sugestões de melhoria

Módulo público para receber ideias, bugs e melhorias da comunidade.

Fluxo previsto:

1. Visitante envia uma sugestão pela área pública;
2. Sugestão entra como pendente;
3. Admin analisa a sugestão;
4. Admin aprova, recusa, arquiva ou converte em roadmap;
5. Sugestão aprovada pode ser vinculada a uma issue do GitHub;
6. Sugestão pode ser marcada como concluída no futuro.

Campos previstos:

- Título;
- Descrição;
- Categoria;
- Prioridade percebida;
- Nome opcional;
- E-mail opcional;
- Link opcional;
- Status;
- Notas internas;
- Visibilidade pública;
- Vínculo com roadmap;
- Vínculo com issue do GitHub.

Proteções recomendadas:

- Rate limit;
- Captcha ou alternativa simples;
- Honeypot;
- Validação forte;
- Moderação antes de exibir publicamente;
- Filtro contra spam.

---

## Roadmap público

Módulo para demonstrar evolução do projeto.

Status sugeridos:

- Planejado;
- Em análise;
- Em desenvolvimento;
- Concluído;
- Cancelado;
- Talvez no futuro.

Campos previstos:

- Título;
- Descrição;
- Categoria;
- Prioridade;
- Status;
- Versão planejada;
- Data prevista opcional;
- Link para issue;
- Visibilidade pública;
- Ordem de exibição.

---

## Changelog

Histórico público das mudanças relevantes do projeto.

Recursos previstos:

- Versão;
- Título;
- Descrição;
- Tipo de alteração;
- Data de release;
- Visibilidade pública.

Tipos sugeridos:

- Added;
- Changed;
- Fixed;
- Removed;
- Security;
- Deprecated.

---

## API pública

A API pública permitirá consumir dados do portfólio sem autenticação.

Rotas futuras sugeridas:

```http
GET /api/v1/public/profile
GET /api/v1/public/projects
GET /api/v1/public/projects/:slug
GET /api/v1/public/experiences
GET /api/v1/public/education
GET /api/v1/public/courses
GET /api/v1/public/technologies
GET /api/v1/public/roadmap
GET /api/v1/public/faq
GET /api/v1/public/changelog
POST /api/v1/public/suggestions
```

Melhorias recomendadas:

- Rate limit;
- Cache;
- Versionamento;
- Filtros e paginação;
- Campos de SEO;
- Retorno otimizado para frontend público.

---

## Exportações

Funcionalidade futura para exportar dados profissionais.

Formatos previstos:

- PDF;
- Markdown;
- HTML;
- JSON;
- Currículo ATS-friendly.

Exemplos:

```http
GET /api/v1/export/resume.pdf
GET /api/v1/export/resume.md
GET /api/v1/export/resume.json
```

---

## Analytics simples

Módulo futuro para entender uso do portfólio.

Métricas possíveis:

- Visualizações do perfil;
- Visualizações de projetos;
- Cliques em GitHub;
- Cliques em demo;
- Cliques em LinkedIn;
- Projetos mais acessados;
- Origem básica dos acessos.

---

## Integração futura com GitHub

Possibilidades futuras:

- Importar repositórios;
- Vincular projeto a repositório;
- Buscar stars;
- Buscar linguagem principal;
- Buscar última atualização;
- Buscar README;
- Vincular roadmap a issues;
- Vincular sugestões a issues;
- Exibir PRs relacionados.

---

## Roadmap

### Fase 1 — Backend base

- [x] CRUD de usuários;
- [x] Autenticação JWT;
- [x] Verificação de e-mail;
- [x] Login com Google OAuth2;
- [x] CRUD de projetos;
- [x] CRUD de categorias;
- [x] CRUD de tecnologias;
- [x] Upload de imagens;
- [x] CRUD de experiências;
- [x] CRUD de formações;
- [x] CRUD de cursos;
- [x] Seções customizadas;
- [x] Logs de auditoria;
- [x] API pública;
- [x] Swagger/OpenAPI;
- [x] Docker e Docker Compose.

### Fase 2 — Frontend administrativo

- [x] Criar estrutura Next.js;
- [x] Criar layout autenticado;
- [x] Criar tela de login;
- [x] Criar tela de cadastro;
- [x] Criar tela de verificação de e-mail;
- [x] Criar dashboard;
- [x] Criar CRUD visual de projetos;
- [ ] Criar CRUD visual de categorias;
- [ ] Criar CRUD visual de tecnologias;
- [ ] Criar CRUD visual de experiências;
- [ ] Criar CRUD visual de formações;
- [ ] Criar CRUD visual de cursos;
- [x] Integrar upload e seleção de capa em projetos;
- [ ] Criar módulo de perfil público;
- [ ] Criar preview público.

### Fase 3 — Recursos open-source/comunidade

- [ ] Criar módulo de FAQ;
- [ ] Criar página pública de FAQ;
- [ ] Criar módulo de sugestões;
- [ ] Criar página pública de sugestões;
- [ ] Criar moderação de sugestões no admin;
- [ ] Criar módulo de roadmap;
- [ ] Criar roadmap público;
- [ ] Criar módulo de changelog;
- [ ] Criar changelog público;
- [ ] Criar página de contribuição;
- [ ] Criar seeds para demo.

### Fase 4 — Recursos avançados

- [ ] Exportação de currículo;
- [ ] Analytics simples;
- [ ] Integração com GitHub;
- [ ] Cache para API pública;
- [ ] Rate limit avançado;
- [ ] Storage flexível: local, S3, R2 ou MinIO;
- [ ] CI/CD;
- [ ] Deploy de demo pública;
- [x] Testes E2E de autenticação e projetos;
- [ ] Guia de deploy em produção.

---

## Segurança

Cuidados recomendados:

- Senhas sempre criptografadas;
- JWT com segredo forte;
- Refresh token seguro, caso implementado;
- Rate limit em login, verificação e rotas públicas;
- Validação global de DTOs;
- Sanitização de entradas públicas;
- Proteção contra spam nas sugestões;
- CORS configurado adequadamente;
- Upload com validação de tipo, tamanho e extensão;
- Logs de auditoria para ações críticas;
- Variáveis sensíveis fora do repositório;
- Revisão periódica de dependências.

---

## Contribuição

Contribuições são bem-vindas.

Fluxo sugerido:

1. Faça um fork do projeto;
2. Crie uma branch para sua alteração:

```bash
git checkout -b feature/nova-feature
```

3. Faça commit das alterações:

```bash
git commit -m "Adiciona nova feature"
```

4. Envie para o seu fork:

```bash
git push origin feature/nova-feature
```

5. Abra um Pull Request.

Antes de contribuir, recomenda-se verificar:

- Issues abertas;
- Roadmap público;
- Sugestões aprovadas;
- Padrões de código;
- Documentação técnica;
- Testes existentes.

---

## Boas práticas para commits

Sugestão de padrão:

```bash
feat: adiciona módulo de roadmap
fix: corrige validação de upload
refactor: melhora serviço de projetos
docs: atualiza documentação da API
test: adiciona testes de autenticação
chore: atualiza dependências
```

---

## Licença

Este projeto está sob a licença MIT.

Consulte o arquivo `LICENSE` para mais detalhes.

---

## Autor

**Jumael Martins**

Desenvolvedor responsável pela criação e manutenção inicial do projeto.

---

## Observação

Este projeto está em evolução ativa. A proposta inicial era criar um CMS para portfólio pessoal, mas o escopo foi expandido para se tornar uma plataforma open-source de presença profissional, com área administrativa, API pública, roadmap, FAQ, sugestões, changelog e futuras integrações.
