# Integração com Backend Nest.js

Esta aplicação Next.js foi desenvolvida para integrar exclusivamente com um backend Nest.js externo, fornecendo funcionalidades avançadas de IA através de uma interface moderna e intuitiva.

## Arquitetura da Aplicação Frontend

### Tecnologias e Dependências
- **Framework**: Next.js 15.5.3 com React 19.1.0
- **UI**: Tailwind CSS 4 + shadcn/ui components
- **IA**: @ai-sdk/react + openai para integrações
- **Ícones**: Lucide React
- **Styling**: class-variance-authority + clsx + tailwind-merge

### Configuração de Ambiente

#### URL do Backend
Por padrão, a aplicação espera que o backend esteja rodando em:
```
http://localhost:3000
```

Configuração de ambiente no `.env.local`:
```env
# URL pública para requisições do cliente
NEXT_PUBLIC_BACKEND_URL=http://localhost:3000

# URL interna para requisições server-side (se necessário)
BACKEND_API_URL=http://localhost:3000
```

**⚠️ ATENÇÃO**: O código atualmente usa `http://localhost:3000` como padrão, mas o plano original menciona `http://localhost:3333`. Certifique-se de que o backend esteja rodando na porta correta.

## Componentes e Funcionalidades Implementadas

### 1. Página Principal (`src/app/page.tsx`)
- **Interface responsiva** com header da marca Ikated
- **Seleção de demonstrações** entre Formulário Inteligente e Chatbot
- **Chat Widget flutuante** sempre disponível
- **Sistema de popup** para chat em janela separada
- **Integração com múltiplos componentes** de chat

### 2. Sistema de Chat (Múltiplos Componentes)

#### ChatWidget (`src/components/ChatWidget.tsx`)
- **Widget flutuante** no canto inferior direito
- **Estados**: fechado, aberto, minimizado
- **Chat básico** com histórico de mensagens
- **Integração com backend** via `/api/chat`
- **Fallback** quando backend indisponível

#### ChatBot (`src/components/ChatBot.tsx`)
- **Chat expandido** para a demonstração principal
- **Interface completa** com sugestões de perguntas
- **Histórico persistente** de conversas
- **Indicadores visuais** de carregamento

#### ChatExpanded (`src/components/ChatExpanded.tsx`)
- **Modal de chat expandido** sobreposto à página
- **Opção de abrir em popup** separado
- **Compartilhamento de estado** entre componentes

#### ChatPopup (`src/components/ChatPopup.tsx`)
- **Janela popup dedicada** para chat
- **Comunicação entre janelas** via postMessage
- **Estado independente** da janela principal

### 3. Sistema de Upload e Formulário Inteligente

#### SmartForm (`src/components/SmartForm.tsx`)
- **Upload múltiplo** de documentos (PDF, JPG, PNG)
- **Processamento via IA** usando `/api/documents/analyze`
- **Preenchimento automático** de formulário
- **Fallback com dados simulados** quando backend offline
- **Campos organizados** por seções: Pessoais, Contato, Endereço

#### FileUpload (`src/components/FileUpload.tsx`)
- **Drag & drop** de arquivos
- **Validação de tipos** de arquivo
- **Preview de arquivos** carregados
- **Limite configurável** de arquivos

### 4. Hooks Customizados

#### usePopupChat (`src/hooks/usePopupChat.ts`)
- **Gerenciamento de popups** de chat
- **Comunicação entre janelas** usando postMessage
- **Controle de estado** de popup aberto/fechado
- **Sincronização de mensagens** entre janelas

### 5. Utilitários e API

#### API Client (`src/lib/api.ts`)
- **Cliente HTTP estruturado** para comunicação com backend
- **Endpoints organizados** por funcionalidade
- **Tratamento de erros** padronizado
- **Suporte a streams** para chat

## Endpoints Necessários no Backend

### 1. Chat com IA
**POST** `/api/chat`

**Request Body:**
```json
{
  "messages": [
    {
      "role": "user|assistant",
      "content": "Mensagem do usuário"
    }
  ]
}
```

**Response:**
```json
{
  "message": "Resposta gerada pela IA",
  "timestamp": "2024-01-01T00:00:00Z"
}
```

### 2. Chat com Stream (Opcional)
**POST** `/api/chat/stream`
- Mesmo body do chat normal
- Response em formato SSE/stream

### 3. Análise de Documentos
**POST** `/api/documents/analyze`

**Request:** FormData
- `documents`: Array de arquivos (field name usado no frontend)

**Response:**
```json
{
  "extractedData": {
    "nomeCompleto": "João da Silva Santos",
    "cpf": "123.456.789-00",
    "rg": "12.345.678-9",
    "dataNascimento": "1985-05-15",
    "email": "joao.santos@email.com",
    "telefone": "(11) 98765-4321",
    "cep": "01234-567",
    "endereco": "Rua das Flores",
    "numero": "123",
    "bairro": "Centro",
    "cidade": "São Paulo",
    "estado": "SP"
  },
  "confidence": 0.95,
  "processedFiles": ["documento1.pdf", "documento2.jpg"]
}
```

### 4. Upload de Documentos (Endpoint Adicional da API)
**POST** `/api/documents/upload`

**Request:** FormData
- `file`: Arquivo individual

**Response:**
```json
{
  "fileId": "uuid-do-arquivo",
  "filename": "documento.pdf",
  "uploadedAt": "2024-01-01T00:00:00Z"
}
```

### 5. Preenchimento de Formulário com IA (Endpoint Adicional da API)
**POST** `/api/forms/fill-with-ai`

**Request Body:**
```json
{
  "documentIds": ["uuid1", "uuid2"],
  "formData": {
    // dados atuais do formulário
  }
}
```

## Comportamento de Fallback

### Quando Backend Indisponível:

1. **Chat Components**:
   - Exibem mensagem explicativa sobre backend indisponível
   - Sugerem verificar se servidor está rodando
   - Mantêm interface funcional sem envio de mensagens

2. **SmartForm**:
   - Simula processamento com dados mock
   - Preenche formulário com dados de exemplo
   - Mostra mensagem sobre uso de simulação local

3. **Logs de Debug**:
   - Console.error quando falha comunicação
   - Mensagens informativas sobre fallbacks
   - Indicadores visuais de status de conexão

## Estrutura Recomendada do Backend

```
src/
├── chat/
│   ├── chat.controller.ts
│   ├── chat.service.ts
│   ├── chat.module.ts
│   └── dto/
│       ├── chat-request.dto.ts
│       └── chat-response.dto.ts
├── documents/
│   ├── documents.controller.ts
│   ├── documents.service.ts
│   ├── documents.module.ts
│   └── dto/
│       ├── document-upload.dto.ts
│       └── analysis-result.dto.ts
├── forms/
│   ├── forms.controller.ts
│   ├── forms.service.ts
│   └── forms.module.ts
├── ai/
│   ├── openai.service.ts
│   ├── ai.module.ts
│   └── interfaces/
│       └── ai-provider.interface.ts
├── common/
│   ├── filters/
│   ├── interceptors/
│   └── pipes/
└── app.module.ts
```

## Exemplos de Implementação Backend

### Chat Controller
```typescript
@Controller('api/chat')
export class ChatController {
  constructor(private readonly chatService: ChatService) {}

  @Post()
  async chat(@Body() body: ChatRequestDto) {
    const response = await this.chatService.generateResponse(body.messages);
    return {
      message: response,
      timestamp: new Date().toISOString()
    };
  }

  @Post('stream')
  async chatStream(@Body() body: ChatRequestDto, @Res() res: Response) {
    res.writeHead(200, {
      'Content-Type': 'text/event-stream',
      'Cache-Control': 'no-cache',
      'Connection': 'keep-alive',
    });

    const stream = await this.chatService.generateResponseStream(body.messages);
    // Implementar streaming response
  }
}
```

### Documents Controller
```typescript
@Controller('api/documents')
export class DocumentsController {
  constructor(private readonly documentsService: DocumentsService) {}

  @Post('analyze')
  @UseInterceptors(FilesInterceptor('documents', 10))
  async analyzeDocuments(@UploadedFiles() files: Express.Multer.File[]) {
    const extractedData = await this.documentsService.analyzeDocuments(files);
    return {
      extractedData,
      confidence: extractedData.confidence || 0.95,
      processedFiles: files.map(f => f.originalname)
    };
  }

  @Post('upload')
  @UseInterceptors(FileInterceptor('file'))
  async uploadDocument(@UploadedFile() file: Express.Multer.File) {
    const result = await this.documentsService.uploadDocument(file);
    return result;
  }
}
```

## Configuração CORS

```typescript
// main.ts
async function bootstrap() {
  const app = await NestFactory.create(AppModule);

  app.enableCors({
    origin: [
      'http://localhost:3001', // Next.js dev
      'http://localhost:3000', // Next.js prod
      'http://localhost:3002'  // Fallback
    ],
    credentials: true,
    methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization'],
  });

  await app.listen(3000); // ou 3333 conforme configuração
}
```

## Monitoramento e Debug

### Frontend Logs
- **Chat errors**: Console.error quando backend indisponível
- **Upload status**: Progresso de upload de arquivos
- **API responses**: Status de requisições HTTP
- **Popup communication**: Eventos de postMessage entre janelas

### Backend Logs Recomendados
- **Request/Response**: Log de todas as requisições de IA
- **File processing**: Status de análise de documentos
- **Error tracking**: Falhas de processamento e timeouts
- **Performance metrics**: Tempo de resposta dos modelos de IA

### Debug URLs
- **Frontend**: http://localhost:3001 (Next.js dev)
- **Backend**: http://localhost:3000/api (ou 3333)
- **Health check**: GET `/api/health` (recomendado implementar)

## Próximos Passos de Implementação

1. **Confirmar porta do backend** (3000 vs 3333)
2. **Implementar todos os endpoints** listados
3. **Configurar processamento de IA** (OpenAI/outros)
4. **Testar upload e análise** de documentos
5. **Implementar streaming** para chat (opcional)
6. **Adicionar autenticação** se necessário
7. **Configurar rate limiting** para API
8. **Implementar health checks** e monitoramento