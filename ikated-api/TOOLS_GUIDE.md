# 🛠️ Guia de Tools de IA - Ikated API

Esta API implementa um sistema avançado de **AI Tools** usando o Vercel AI SDK, permitindo que o chat do frontend interaja diretamente com o banco de dados para gerar relatórios e análises em tempo real.

## 🚀 Funcionalidades Implementadas

### 📊 **Estatísticas do Sistema**
- **Tool**: `getSystemStats`
- **Função**: Obtém visão geral do sistema
- **Retorna**: Totais de usuários, conversas, mensagens, documentos e formulários

### 👥 **Usuários Recentes**
- **Tool**: `getRecentUsers`
- **Função**: Lista usuários cadastrados recentemente
- **Parâmetros**: `limit` (opcional, padrão: 10)

### 📄 **Geração de Relatórios CSV**

#### 1. Relatório de Usuários
- **Tool**: `generateUsersReport`
- **Função**: Exporta todos os usuários para CSV
- **Parâmetros**: `includeAddress` (opcional, inclui endereços)
- **Output**: Link de download temporário

#### 2. Relatório de Conversas
- **Tool**: `generateConversationsReport`
- **Função**: Exporta conversas para CSV
- **Parâmetros**: `includeMessages` (opcional, inclui contagem de mensagens)
- **Output**: Link de download temporário

#### 3. Relatório de Documentos
- **Tool**: `generateDocumentsReport`
- **Função**: Exporta documentos processados para CSV
- **Parâmetros**: `includeExtractedData` (opcional, inclui dados extraídos)
- **Output**: Link de download temporário

## 🔧 Como Funciona

### 1. **Integração com OpenAI**
```typescript
// O serviço OpenAI carrega automaticamente as tools
constructor(db: DrizzleDB, redisService: RedisService) {
  this.tools = createSimpleTools(db, redisService);
}

// Tools são passadas para generateText/streamText
const { text } = await generateText({
  model: this.model,
  messages: [...],
  tools: this.tools, // ← Tools automáticas
});
```

### 2. **Sistema de Downloads**
- **Redis**: Armazena metadados temporários dos arquivos
- **TTL**: 1 hora de validade para cada download
- **Auto-cleanup**: Arquivos são removidos após download
- **Endpoint**: `/api/download/{key}`

### 3. **Prompt System**
A IA é instruída automaticamente sobre como usar as tools:

```
🔧 **FERRAMENTAS DISPONÍVEIS**:

📊 **Estatísticas**:
- getSystemStats: Estatísticas gerais do sistema
- getRecentUsers: Lista dos usuários cadastrados recentemente

📁 **Geração de Relatórios CSV**:
- generateUsersReport: Exporta relatório completo de usuários
...
```

## 📋 Exemplos de Uso no Chat

### Solicitações que Ativam Tools:

```
🎯 "Mostre as estatísticas do sistema"
   → Aciona: getSystemStats

🎯 "Gere um relatório de usuários"
   → Aciona: generateUsersReport

🎯 "Quero exportar todas as conversas"
   → Aciona: generateConversationsReport

🎯 "Preciso de um CSV dos documentos processados"
   → Aciona: generateDocumentsReport

🎯 "Quais são os últimos usuários cadastrados?"
   → Aciona: getRecentUsers
```

### Resposta da IA com Tools:

```
📊 **Estatísticas do Sistema Ikated**

👥 **Usuários**: 150
💬 **Conversas**: 342
📝 **Mensagens**: 1,247
📄 **Documentos**: 89
📋 **Formulários**: 67

✨ Posso gerar relatórios detalhados em CSV.
   Gostaria de exportar algum desses dados?
```

## 🛠️ Configuração Técnica

### 1. **Dependências Necessárias**
```json
{
  "ai": "^5.0.44",
  "@ai-sdk/openai": "^2.0.30",
  "zod": "^4.1.8",
  "ioredis": "^5.7.0",
  "csv-writer": "^1.6.0"
}
```

### 2. **Variáveis de Ambiente**
```env
OPENAI_API_KEY=sk-...  # OBRIGATÓRIO
REDIS_HOST=localhost
REDIS_PORT=6379
```

### 3. **Estrutura dos Arquivos**
```
src/
├── ai/
│   ├── openai.ts              # Serviço principal com tools
│   └── tools/
│       └── simple-tools.ts    # Definição das tools
├── redis/
│   ├── redis.module.ts        # Configuração Redis
│   └── redis.service.ts       # Serviços Redis
└── download/
    ├── download.controller.ts # API de downloads
    └── download.module.ts     # Módulo de downloads
```

## ⚡ Performance e Cache

### 1. **Cache Redis**
- **Metadados de download**: 1 hora TTL
- **Consultas frequentes**: Cache automático
- **Cleanup**: Limpeza automática de arquivos expirados

### 2. **Otimizações**
- Queries SQL otimizadas com Drizzle
- Streaming de arquivos para downloads
- Cleanup automático de arquivos temporários

## 🔒 Segurança

### 1. **Validação**
- Schemas Zod para validação de inputs
- Sanitização automática de parâmetros
- Validação de tipos TypeScript

### 2. **Downloads Seguros**
- Links temporários com TTL
- Validação de chaves de download
- Auto-destruição de arquivos

## 📈 Monitoramento

### 1. **Logs de Tools**
- Execução de tools registrada
- Performance tracking
- Error monitoring

### 2. **Métricas Disponíveis**
- Número de downloads gerados
- Tools mais utilizadas
- Performance de queries

## 🚀 Evolução Futura

### Próximas Tools Planejadas:
- **Análise Temporal**: Dados por período
- **Filtros Avançados**: Queries customizadas
- **Exportação PDF**: Relatórios formatados
- **Dashboards**: Visualizações automáticas
- **Alertas**: Notificações baseadas em dados

## 💡 Dicas de Uso

1. **Seja específico**: "Gere relatório de usuários com endereços"
2. **Use linguagem natural**: "Mostre as estatísticas gerais"
3. **Aproveite o contexto**: A IA lembra da conversa
4. **Explore sugestões**: A IA sugere análises relevantes

---

Este sistema transforma seu chat em uma interface poderosa de Business Intelligence, permitindo análises e relatórios instantâneos através de conversas naturais! 🎯