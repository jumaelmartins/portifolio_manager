# Portfolio Manager

Um CMS open-source para gerenciar projetos, experiências, cursos e formações acadêmicas de forma simples e centralizada. A ideia é disponibilizar uma API robusta para ser consumida em portfólios pessoais ou sites, facilitando a manutenção do conteúdo sem precisar alterar diretamente o código do frontend.

🚀 Tecnologias Utilizadas

- **Backend**: NestJS (v11)
- **Banco de Dados**: PostgreSQL + Prisma ORM
- **Frontend** (em planejamento): Next.js
- **Autenticação**: JWT (JSON Web Tokens) & Google OAuth2 (Passport)
- **Containerização/Orquestração**: Docker & Docker Compose
- **E-mails**: Nodemailer (para fluxo de verificação de conta)
- **Documentação**: Swagger / OpenAPI

⚙️ Funcionalidades Implementadas (Backend)

- [X] **Autenticação Local**: Registro e Login de usuários utilizando senhas criptografadas com bcrypt.
- [X] **Verificação de E-mail**: Fluxo de segurança que envia token de 6 dígitos via SMTP (Nodemailer) expirando em 30 minutos para ativação de conta.
- [X] **Autenticação OAuth2 (Google)**: Login social integrado com registro automático de contas verificadas.
- [X] **Gerenciamento de Projetos**: CRUD completo de projetos, incluindo categorias, tecnologias e anexos de imagens.
- [X] **Upload de Imagens**: Módulo de upload via Multer com armazenamento em disco de imagens (JPG/PNG/GIF) vinculadas aos usuários.
- [X] **Gerenciamento de Currículo**: CRUDs completos para experiências profissionais, formações acadêmicas e cursos adicionais.
- [X] **Seções Customizadas**: Possibilidade de criar seções dinâmicas personalizadas com esquemas de campos em JSON.
- [X] **Logs de Auditoria**: Registro automático de todas as ações de criação, modificação e exclusão realizadas por usuários autenticados.
- [X] **API Pública**: Módulo que expõe rotas de leitura rápida para que o frontend consuma dados públicos sem necessidade de autenticação.
- [X] **Containerização**: Setup pronto com Dockerfile e Docker Compose para execução rápida em desenvolvimento ou produção.

📂 Estrutura do Projeto

```text
portfolio-manager/
├── backend/                  # API Rest em NestJS + Prisma
│   ├── prisma/               # Esquema do banco de dados (PostgreSQL) e migrações
│   ├── src/                  # Código fonte do NestJS
│   │   ├── common/           # Guards, interceptors, pipes compartilhados
│   │   ├── database/         # Módulo de conexão Prisma
│   │   ├── email/            # Envio de e-mails via Nodemailer
│   │   ├── modules/          # Módulos de negócio da aplicação (auth, projects, etc.)
│   │   └── utils/            # Tipos e utilitários globais
│   └── test/                 # Testes E2E (End-to-End)
├── docker-compose.yml        # Orquestração do banco de dados PostgreSQL e backend
├── README.md                 # Visão geral do projeto (este arquivo)
└── DOCUMENTATION.md          # Documentação completa de Arquitetura e APIs
```

🔧 Como Rodar o Projeto

### Pré-requisitos
*   [Node.js](https://nodejs.org/) (versão 22 ou superior recomendada)
*   [Docker](https://www.docker.com/) e Docker Compose instalados

### Modo Rápido (Docker Compose)
Para subir o banco de dados PostgreSQL e a API automaticamente em ambiente de produção:
```bash
docker compose up --build
```
A API estará acessível em `http://localhost:3000`.

### Desenvolvimento Local (Passo a Passo)

1.  **Instalar dependências**:
    ```bash
    cd backend
    npm install
    ```

2.  **Configurar variáveis de ambiente**:
    Crie ou configure o arquivo `backend/.env.development` (consulte `.env.development` como modelo). Certifique-se de configurar o acesso ao seu banco de dados PostgreSQL e as credenciais de SMTP/OAuth.

3.  **Executar Migrações do Banco**:
    ```bash
    npm run prisma:dev:migrate
    ```

4.  **Iniciar o Servidor em Modo de Desenvolvimento (Watch)**:
    ```bash
    npm run start:dev
    ```

---

📖 Documentação Detalhada

*   A documentação de arquitetura, banco de dados e rotas da API pode ser encontrada em [DOCUMENTATION.md](file:///d:/Development/PersonalProjects/portfolio_manager/DOCUMENTATION.md).
*   Com a aplicação rodando localmente, acesse a documentação interativa e execute requisições diretamente através do **Swagger UI** em:
    👉 `http://localhost:3000/api-docs`

🛣️ Roadmap de Desenvolvimento

- [x] Finalizar CRUD de usuários
- [x] Implementar autenticação via JWT
- [x] Finalizar CRUD de categorias e tags de tecnologia
- [x] Finalizar CRUD de upload de imagens
- [x] Finalizar CRUD de projetos
- [x] Implementar autenticação via Google OAuth2
- [x] Finalizar CRUD de experiências, cursos e educação
- [x] Estruturar seções dinâmicas personalizadas (Custom Sections)
- [x] Criar interceptor de auditoria
- [x] Criar documentação da API e Arquitetura do Sistema ([DOCUMENTATION.md](file:///d:/Development/PersonalProjects/portfolio_manager/DOCUMENTATION.md))
- [ ] Corrigir mapeamento de caminhos nos testes E2E do Jest
- [ ] Criar frontend em Next.js para consumo da API
- [ ] Hospedar versão demo do CMS e do Frontend

🤝 Contribuição

Contribuições são super bem-vindas! Siga os passos abaixo:
1. Faça um Fork do repositório
2. Crie uma branch com sua alteração (`git checkout -b feature/nova-feature`)
3. Faça commit de suas alterações (`git commit -m 'Adiciona nova feature'`)
4. Faça push para a branch (`git push origin feature/nova-feature`)
5. Abra um Pull Request

📄 Licença

Este projeto está sob a licença MIT. Veja o arquivo LICENSE para mais detalhes.

---
**Equipe de Desenvolvimento:** Jumael Martins