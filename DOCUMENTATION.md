# Documentação do Sistema - Portfolio Manager

Esta documentação descreve a arquitetura full-stack, o esquema do banco de dados, os fluxos principais e as rotas da API do **Portfolio Manager**.

---

## 1. Arquitetura do Sistema

O backend foi construído usando o framework **NestJS** seguindo a modularização por recursos (Feature Modules). Cada funcionalidade/entidade possui seu próprio módulo que encapsula controladores, serviços e camadas de acesso a dados.

O frontend administrativo usa **Next.js App Router**. O navegador acessa somente rotas e handlers do próprio frontend; esses handlers formam uma camada BFF (Backend for Frontend), recuperam o JWT de um cookie HttpOnly e fazem as chamadas autenticadas ao NestJS no servidor.

### Estrutura de Diretórios de um Módulo
Cada módulo dentro de `backend/src/modules/` segue o seguinte padrão:
```text
modules/{feature}/
├── {feature}.controller.ts         # Recebe requisições HTTP, valida payloads com DTOs e valida permissões (guards)
├── {feature}.service.ts            # Contém as regras de negócio e orquestração do módulo
├── {feature}.module.ts             # Declara controladores, provedores e gerencia a injeção de dependência
├── dto/                            # Data Transfer Objects (DTOs) com validações decoradas (class-validator)
├── entities/                       # Interfaces TypeScript representando o modelo de dados
└── repository/
    ├── {feature}.repository.ts     # Implementação concreta de acesso a dados usando o Prisma Client
    └── {feature}-in-memory.repository.ts  # Implementação opcional em memória utilizada em testes unitários
```

### Abstração de Acesso a Dados
Para simplificar a realização de testes unitários rápidos, os serviços dependem de repositórios que podem ser facilmente substituídos. Nos testes de unidade, em vez de conectar ao PostgreSQL com Prisma, injeta-se uma versão em memória que gerencia os dados localmente em vetores.

### Estrutura do Frontend

```text
frontend/src/
├── app/                 # Páginas, layouts e route handlers do BFF
├── components/          # Componentes compartilhados e shell administrativo
├── features/            # Casos de uso organizados por domínio
└── lib/                 # Cliente da API, autenticação, contratos e utilitários
```

As páginas autenticadas são protegidas pelo proxy do Next.js. O token não é armazenado em `localStorage`, não aparece na URL e não é exposto ao JavaScript do navegador.

---

## 2. Esquema do Banco de Dados

O banco de dados utiliza o PostgreSQL gerenciado via Prisma ORM. O esquema está localizado em `backend/prisma/schema.prisma`.

### Convenção de Nomenclatura das Tabelas
*   **Prefixo `d_` (Dimension/Lookup)**: Tabelas que guardam dados de suporte, configurações, tipos ou dados estáticos de consulta.
    *   `d_roles`: Perfis de usuário (`SYSADMIN`, `USER`).
    *   `d_status`: Status da conta do usuário (`ACTIVE`, `INACTIVE`, `PENDING_VERIFICATION`).
    *   `d_auth_method`: Método de autenticação (`LOCAL`, `GOOGLE`).
    *   `d_category`: Categorias de projetos.
    *   `d_technologies`: Tecnologias associadas aos projetos.
*   **Prefixo `f_` (Fact/Entity)**: Tabelas principais contendo as entidades de negócio.
    *   `users`: Usuários registrados no sistema.
    *   `email_verification_tokens`: Tokens UUID para validação de e-mail e ativação de contas.
    *   `f_images`: Registro de caminhos de arquivos de imagem salvos em disco.
    *   `f_profile_picture`: Tabela associativa que define a imagem de perfil do usuário.
    *   `f_projects`: Projetos do portfólio.
    *   `f_experience`: Experiências profissionais dos usuários.
    *   `f_education`: Formações acadêmicas dos usuários.
    *   `f_courses`: Cursos adicionais ou certificações dos usuários.
    *   `audit_logs`: Log de ações CRUD para auditoria de segurança.
    *   `custom_sections` e `custom_section_items`: Tabelas flexíveis com schemas JSON dinâmicos para criação de seções personalizadas.

---

## 3. Fluxos de Autenticação e Segurança

A segurança é garantida através de uma pilha de **Guards** do NestJS aplicados nos endpoints das rotas.

### Guarda de Rotas (Guards Stack)
Nos controladores privados do CMS, os guards são aplicados sequencialmente:
1.  **`JwtAuthGuard`**: Verifica se há um token JWT válido e não expirado no cabeçalho `Authorization: Bearer <token>`. Decodifica o payload contendo o ID do usuário (`sub`), papel (`role`) e status (`status`).
2.  **`ActiveUserGuard`**: Valida se a conta do usuário que fez a requisição possui `status_id` correspondente a `ACTIVE`. Rejeita contas pendentes ou inativas.
3.  **`AdminGuard`** (opcional): Permite o acesso apenas se o papel do usuário logado for de administrador (`SYSADMIN`).

### Fluxo 1: Autenticação Local e Ativação de E-mail
```mermaid
sequenceDiagram
    participant User as Usuário / Frontend
    participant BFF as Next.js BFF
    participant API as NestJS API
    participant DB as Banco de Dados
    participant Mail as Servidor SMTP (Mailtrap)

    User->>BFF: POST /api/auth/register
    BFF->>API: POST /users
    API->>DB: Cria usuário com status PENDING_VERIFICATION (status_id = 1)
    API->>DB: Cria token e código de verificação de 6 dígitos (expira em 30min)
    API->>Mail: Envia e-mail contendo o código de 6 dígitos
    API-->>BFF: Retorna o desafio de verificação
    BFF-->>User: Grava cookie temporário e abre a verificação
    
    Note over User, Mail: O usuário abre a caixa de e-mail e obtém o código

    User->>BFF: POST /api/auth/verify-email { code }
    BFF->>API: POST /auth/verify-email { token, code }
    API->>DB: Valida o código, marca token como usado
    API->>DB: Atualiza status do usuário para ACTIVE (status_id = 2)
    API-->>BFF: Confirmação de e-mail verificado
    BFF-->>User: Redireciona para o login

    User->>BFF: POST /api/auth/login { email, password }
    BFF->>API: POST /auth/login
    API->>DB: Valida credenciais (bcrypt.compare)
    API-->>BFF: Retorna JWT
    BFF-->>User: Grava JWT em cookie HttpOnly, SameSite=Lax
```

### Fluxo 2: Autenticação via Google OAuth2
1.  O frontend cria um estado aleatório, grava-o em cookie HttpOnly e inicia o fluxo por `POST /api/auth/google/start`.
2.  O backend redireciona o usuário para a tela de login do Google.
3.  Após a autorização, o Google envia o perfil para `/auth/google/callback`.
4.  A estratégia do Google recebe o perfil e verifica se o e-mail já existe:
    *   Se **não existir**, a API cria o usuário com o método de autenticação configurado como `GOOGLE`, status `ACTIVE` e `verified_email` como `true`.
    *   Se **já existir**, recupera as informações do usuário.
5.  O backend envia o token ao callback do frontend por formulário `POST`.
6.  O frontend valida o estado, grava o JWT no cookie de sessão e redireciona para `/dashboard`. O token não é colocado na URL.

---

## 4. Principais Endpoints da API

### Rotas de Autenticação (`/auth`)
*   `POST /auth/login`: Autentica o usuário com email e senha locais. Retorna o token JWT.
*   `POST /auth/verify-email`: Valida o código de ativação enviado por e-mail.
*   `POST /auth/resend-verification`: Reenvia o código de ativação para o e-mail informado.
*   `GET /auth/google`: Redireciona para o fluxo de autenticação do Google.
*   `GET /auth/google/callback`: Rota de retorno do Google OAuth2.
*   `POST /auth/change-password` *(Protegido)*: Permite a alteração da senha atual do usuário logado.

### Rotas do Usuário (`/users`)
*   `POST /users`: Cria um novo usuário na plataforma (fluxo de auto-cadastro).
*   `GET /auth/me` *(Protegido)*: Retorna os dados de autenticação do usuário logado.

### Rotas de Conteúdo do CMS *(Todas protegidas por JWT e ActiveUser)*
Cada usuário gerencia apenas os seus próprios dados. O middleware valida a propriedade dos recursos.
*   **Projetos (`/projects`)**: CRUD de projetos do portfólio.
*   **Experiências (`/experience`)**: CRUD de histórico profissional do usuário.
*   **Formação Acadêmica (`/education`)**: CRUD de graduações, licenciaturas e pós-graduações.
*   **Cursos (`/courses`)**: CRUD de certificações e cursos extracurriculares.
*   **Categorias (`/category`)**: Gerencia categorias globais ou individuais para organizar projetos.
*   **Tecnologias (`/technologies`)**: CRUD de tags de habilidades e tecnologias usadas nos projetos.

### Rotas de Upload (`/upload`)
*   `POST /upload/users/:userId` *(Protegido)*: Envia JPEG, PNG ou GIF de até 5 MB. A API valida que o usuário autenticado é o dono do destino, armazena o arquivo em `uploads/{userId}/` e cria uma referência na tabela `f_images`.
*   `DELETE /upload/:imageId` *(Protegido)*: Remove uma imagem pertencente ao usuário autenticado.

### Seções Customizadas (`/custom-sections`)
Para permitir flexibilidade total no portfólio, os usuários podem criar seções dinâmicas definindo esquemas em JSON:
*   `POST /custom-sections`: Cria uma seção personalizada definindo seu nome, ícone e o esquema JSON dos campos.
*   `POST /custom-sections/:id/items`: Adiciona itens de dados estruturados à seção seguindo o formato definido no esquema.

### Rotas Públicas (`/public`)
As rotas de leitura pública são acessadas sem JWT e servem para renderizar os dados do portfólio de um usuário específico no frontend:
*   `GET /public/users/:userId`: Retorna a visão pública agregada do usuário.

---

## 5. Auditoria do Sistema

Todas as operações de alteração de dados (criação, edição e deleção) são automaticamente capturadas pelo `AuditInterceptor` (quando aplicável).
*   Ele intercepta requisições nos controllers privados.
*   Salva no banco de dados na tabela `audit_logs` os seguintes metadados:
    *   ID do Usuário executor.
    *   Tipo da Entidade modificada (`entity_type`) e seu ID (`entity_id`).
    *   Ação executada (`CREATE`, `UPDATE`, `DELETE`).
    *   Endereço de IP de onde partiu a chamada.
    *   Payload original (`old_values`) e novos dados (`new_values`) para auditoria de segurança.

---

## 6. Dashboard e Projetos

O dashboard agrega os dados do usuário autenticado e exibe totais de projetos, distribuição por categoria e uso de imagens de capa. O módulo de projetos oferece busca, filtros por categoria e tecnologia, paginação, criação, edição e exclusão.

Os contratos do BFF convertem os nomes usados pela interface para os campos esperados pela API. Categorias e tecnologias são carregadas como dados de apoio; a administração independente dessas entidades permanece no roadmap.

## 7. Testes

- Backend unitário: `cd backend && npm test`
- Backend HTTP E2E: `cd backend && npm run test:e2e`
- Frontend unitário: `cd frontend && npm run test:run`
- Frontend E2E: `cd frontend && npm run test:e2e`

O Playwright inicializa um PostgreSQL exclusivo em `localhost:55432`, aplica migrations, executa o seed idempotente e valida autenticação e projetos em Chromium desktop e mobile.

O Jest E2E possui mapeamento de `src/*` e usa a mesma função de configuração da aplicação real. Os testes cobrem o endpoint raiz, Swagger e rejeição de acesso não autenticado às rotas de projetos.

## 8. Execução com Docker

`docker compose up --build` inicia PostgreSQL, backend e frontend. A API fica em `http://localhost:3000`, o Swagger em `http://localhost:3000/api-docs` e o painel em `http://localhost:3001`.

O frontend usa a saída standalone do Next.js. O volume `uploads` mantém as imagens enviadas e o backend só é considerado pronto após responder ao healthcheck.
