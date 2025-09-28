# Ikated - Integração de IA em Sistemas

<div align="center">

![Ikated Logo](./ikated-front/public/images/ikatec_logo.jpeg)

**Tecnologia e inovação para transformar negócios e pessoas**

[![NestJS](https://img.shields.io/badge/Backend-NestJS-red.svg)](https://nestjs.com/)
[![Next.js](https://img.shields.io/badge/Frontend-Next.js-black.svg)](https://nextjs.org/)
[![OpenAI](https://img.shields.io/badge/IA-OpenAI-green.svg)](https://openai.com/)
[![PostgreSQL](https://img.shields.io/badge/Database-PostgreSQL-blue.svg)](https://postgresql.org/)
[![Redis](https://img.shields.io/badge/Cache-Redis-red.svg)](https://redis.io/)

</div>

## 📋 Índice

- [Visão Geral](#-visão-geral)
- [Arquitetura](#-arquitetura)
- [Funcionalidades](#-funcionalidades)
- [Tecnologias](#-tecnologias)
- [Pré-requisitos](#-pré-requisitos)
- [Instalação](#-instalação)
- [Configuração](#-configuração)
- [Execução](#-execução)
- [API Endpoints](#-api-endpoints)
- [Estrutura do Projeto](#-estrutura-do-projeto)
- [Contribuição](#-contribuição)
- [Licença](#-licença)

## 🎯 Visão Geral

O **Ikated** é uma plataforma completa de integração de Inteligência Artificial em sistemas empresariais, desenvolvida para demonstrar o poder da IA na transformação digital de negócios. O sistema combina processamento de documentos inteligente, chatbots especializados e geração de relatórios automatizados.

### Principais Destaques

- 🤖 **Chatbot Especializado**: IA conversacional especializada em tecnologia e negócios
- 📄 **Processamento de Documentos**: Extração automática de dados de RG, CPF e documentos pessoais
- 📊 **Formulários Inteligentes**: Preenchimento automático baseado em IA
- 📈 **Relatórios Automatizados**: Geração de relatórios CSV com dados do sistema
- 🌐 **Interface Moderna**: UI responsiva e intuitiva com Next.js e Tailwind CSS

## 🏗️ Arquitetura

O sistema é composto por dois serviços principais:

```
┌─────────────────┐    ┌─────────────────┐    ┌─────────────────┐
│   ikated-front  │────│   ikated-api    │────│   PostgreSQL    │
│   (Next.js)     │    │   (NestJS)      │    │   Database      │
└─────────────────┘    └─────────────────┘    └─────────────────┘
         │                       │                       │
         │                       │                       │
         │              ┌─────────────────┐              │
         └──────────────│      Redis      │──────────────┘
                        │     (Cache)     │
                        └─────────────────┘
```

### Componentes Principais

- **Frontend (ikated-front)**: Interface de usuário moderna e responsiva
- **Backend (ikated-api)**: API robusta com NestJS e integração OpenAI
- **Banco de Dados**: PostgreSQL para persistência de dados
- **Cache**: Redis para otimização de performance
- **IA**: OpenAI GPT-4o para processamento inteligente

## ✨ Funcionalidades

### 🤖 Chatbot Especializado
- Conversas naturais com IA especializada em tecnologia e negócios
- Respostas contextuais sobre transformação digital
- Interface de chat moderna com sugestões de perguntas
- Suporte a chat em popup e expansível

### 📄 Processamento de Documentos
- Upload de múltiplos arquivos (PDF, JPG, PNG)
- Extração automática de dados pessoais (CPF, RG, endereços)
- Análise de imagens com visão computacional
- Validação e estruturação de dados extraídos

### 📋 Formulários Inteligentes
- Preenchimento automático baseado em documentos carregados
- Validação de dados em tempo real
- Interface organizada por seções (pessoais, contato, endereço)
- Exportação de formulários preenchidos

### 📊 Sistema de Relatórios
- Geração automática de relatórios CSV
- Estatísticas do sistema em tempo real
- Relatórios de usuários, conversas e documentos
- Distribuição geográfica de dados
- Download seguro com links temporários

## 🛠️ Tecnologias

### Backend (ikated-api)
- **Framework**: NestJS 11.x
- **Linguagem**: TypeScript
- **Banco de Dados**: PostgreSQL com Drizzle ORM
- **Cache**: Redis com IORedis
- **IA**: OpenAI GPT-4o com AI SDK
- **Validação**: Class Validator & Class Transformer
- **Upload**: Multer para arquivos
- **PDF**: jsPDF e html-pdf-node
- **Testes**: Jest

### Frontend (ikated-front)
- **Framework**: Next.js 15.x
- **Linguagem**: TypeScript
- **Estilização**: Tailwind CSS 4.x
- **UI Components**: Lucide React (ícones)
- **IA**: AI SDK React
- **Estados**: React Hooks
- **Fontes**: Geist Sans & Geist Mono

### Infraestrutura
- **Containerização**: Docker & Docker Compose
- **Banco de Dados**: PostgreSQL (Bitnami)
- **Cache**: Redis (oficial)
- **Migrações**: Drizzle Kit
- **Linting**: ESLint + Prettier

## 📋 Pré-requisitos

Antes de começar, certifique-se de ter instalado:

- **Node.js** >= 18.x
- **npm** >= 8.x ou **yarn** >= 1.22.x
- **Docker** >= 20.x
- **Docker Compose** >= 2.x
- **Git**

## 🚀 Instalação

### 1. Clone o Repositório

```bash
git clone https://github.com/seu-usuario/ikated-ia-systems.git
cd ikated-ia-systems
```

### 2. Instale as Dependências

```bash
# Backend
cd ikated-api
npm install

# Frontend
cd ../ikated-front
npm install
```

### 3. Configure as Variáveis de Ambiente

#### Backend (.env)
```bash
cd ikated-api
cp .env.example .env
```

Edite o arquivo `.env`:
```env
# Database
DB_HOST=localhost
DB_PORT=5432
DB_USER=admin
DB_PASSWORD=root
DB_NAME=ikated

# Redis
REDIS_HOST=localhost
REDIS_PORT=6379

# OpenAI
OPENAI_API_KEY=sua_chave_openai_aqui

# Server
PORT=3333
NODE_ENV=development
```

#### Frontend (.env.local)
```bash
cd ikated-front
cp .env.example .env.local
```

Edite o arquivo `.env.local`:
```env
NEXT_PUBLIC_BACKEND_URL=http://localhost:3333
```

## ⚙️ Configuração

### 1. Inicie os Serviços de Infraestrutura

```bash
cd ikated-api
npm run docker:up
```

Isso iniciará:
- PostgreSQL na porta 5432
- Redis na porta 6379

### 2. Configure o Banco de Dados

```bash
# Gere as migrações
npm run db:generate

# Execute as migrações
npm run db:migrate

# (Opcional) Popule com dados de exemplo
npm run db:seed
```

## 🏃‍♂️ Execução

### Desenvolvimento

#### Backend
```bash
cd ikated-api
npm run start:dev
```
O backend estará disponível em: http://localhost:3333

#### Frontend
```bash
cd ikated-front
npm run dev
```
O frontend estará disponível em: http://localhost:3000

### Produção

#### Backend
```bash
cd ikated-api
npm run build
npm run start:prod
```

#### Frontend
```bash
cd ikated-front
npm run build
npm run start
```

## 📡 API Endpoints

### Chat
- `POST /api/chat` - Enviar mensagem para o chatbot
- `GET /api/chat/history/:conversationId` - Histórico de conversas

### Documentos
- `POST /api/documents/upload` - Upload de documentos
- `POST /api/documents/analyze` - Análise de documentos com IA
- `GET /api/documents` - Listar documentos

### Formulários
- `POST /api/forms` - Criar formulário
- `GET /api/forms` - Listar formulários
- `PUT /api/forms/:id` - Atualizar formulário

### Exportação
- `GET /api/export/users` - Exportar usuários em CSV
- `GET /api/export/conversations` - Exportar conversas em CSV
- `GET /api/export/documents` - Exportar documentos em CSV

### Download
- `GET /api/download/:id` - Download de arquivos gerados

### Health Check
- `GET /api/health` - Status da API

## 📁 Estrutura do Projeto

```
ikated-ia-systems/
├── ikated-api/                 # Backend NestJS
│   ├── src/
│   │   ├── ai/                 # Integração OpenAI
│   │   │   ├── openai.ts       # Serviço OpenAI
│   │   │   └── tools/          # Ferramentas de IA
│   │   ├── chat/               # Módulo de Chat
│   │   ├── database/           # Configuração do banco
│   │   │   ├── schema.ts       # Schema do banco
│   │   │   └── seed.ts         # Dados de exemplo
│   │   ├── documents/          # Processamento de documentos
│   │   ├── forms/              # Formulários
│   │   ├── export/             # Exportação de dados
│   │   ├── download/           # Downloads
│   │   └── redis/              # Cache Redis
│   ├── drizzle/                # Migrações do banco
│   └── docker-compose.yml      # Serviços de infraestrutura
├── ikated-front/               # Frontend Next.js
│   ├── src/
│   │   ├── app/                # Páginas da aplicação
│   │   ├── components/         # Componentes React
│   │   │   ├── ChatBot.tsx     # Chatbot principal
│   │   │   ├── SmartForm.tsx   # Formulário inteligente
│   │   │   ├── FileUpload.tsx  # Upload de arquivos
│   │   │   └── ChatWidget.tsx  # Widget de chat
│   │   ├── hooks/              # React Hooks customizados
│   │   └── lib/                # Utilitários
│   └── public/                 # Arquivos estáticos
└── README.md                   # Este arquivo
```
## 📝 Licença

Este projeto está sob a licença MIT. Veja o arquivo [LICENSE](LICENSE) para mais detalhes.

## 📞 Suporte

Para suporte e dúvidas:

- **Email**: deyvisontav@gmail.com
- **Website**: https://github.com/DeyvisonTav
- **Issues**: Use o sistema de issues do GitHub

---

<div align="center">

**Desenvolvido com ❤️ por Deyvison Tavares**

*Transformando negócios através da Inteligência Artificial*

</div>
