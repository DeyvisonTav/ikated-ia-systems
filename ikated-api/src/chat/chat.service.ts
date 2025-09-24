import { Injectable, Inject } from '@nestjs/common';
import { OpenAIService } from '../ai/openai';
import { DATABASE_CONNECTION } from '../database/database.module';
import { DrizzleDB } from '../database/types';
import { conversations, messages, NewConversation, NewMessage } from '../database/schema';
import { ChatRequestDto, ChatResponseDto } from '../common/dto/chat.dto';
import { eq } from 'drizzle-orm';
import { RedisService } from '../redis/redis.service';

@Injectable()
export class ChatService {
  constructor(
    private readonly openaiService: OpenAIService,
    @Inject(DATABASE_CONNECTION) private readonly db: DrizzleDB,
    private readonly redisService: RedisService,
  ) {}

  async generateResponse(chatRequest: ChatRequestDto): Promise<ChatResponseDto> {
    try {
      let conversationId = chatRequest.conversationId;

      if (!conversationId) {
        const newConversation: NewConversation = {
          title: this.generateConversationTitle(chatRequest.messages[0]?.content),
          metadata: { model: chatRequest.model || 'gpt-4o' },
        };

        const [conversation] = await this.db
          .insert(conversations)
          .values(newConversation)
          .returning();

        conversationId = conversation.id;
      }

      for (const message of chatRequest.messages) {
        if (message.role === 'user') {
          const newMessage: NewMessage = {
            conversationId,
            role: message.role,
            content: message.content,
          };

          await this.db.insert(messages).values(newMessage);
        }
      }

      // Timeout de 30 segundos para evitar travamentos
      const response = await Promise.race([
        this.openaiService.generateResponse(chatRequest.messages),
        new Promise<string>((_, reject) =>
          setTimeout(() => reject(new Error('Chat timeout - operação muito lenta')), 30000)
        )
      ]);

      let finalResponse = response;

      // Verificar se é comando de CSV e adicionar link se necessário
      const lastUserMessage = chatRequest.messages[chatRequest.messages.length - 1]?.content?.toLowerCase() || '';
      if (this.isCsvCommand(lastUserMessage) && (!response || response.trim().length < 50)) {
        console.log('🔗 Comando CSV detectado, buscando link mais recente...');
        const downloadLink = await this.getLatestDownloadLink();
        if (downloadLink) {
          finalResponse = `📊 **Relatório gerado com sucesso!**

🔗 **Download disponível:** ${downloadLink}

⏰ **Importante:** O link expira em 1 hora e o arquivo será automaticamente deletado após o download.

${response ? `\n${response}` : ''}`.trim();
        }
      }

      const assistantMessage: NewMessage = {
        conversationId,
        role: 'assistant',
        content: finalResponse,
      };

      await this.db.insert(messages).values(assistantMessage);

      return {
        message: finalResponse,
        timestamp: new Date().toISOString(),
        conversationId,
      };
    } catch (error) {
      console.error('Erro no chat:', error);
      throw new Error('Falha ao gerar resposta');
    }
  }

  async *generateResponseStream(chatRequest: ChatRequestDto): AsyncIterable<string> {
    try {
      let fullResponse = '';

      for await (const chunk of this.openaiService.generateResponseStream(chatRequest.messages)) {
        fullResponse += chunk;
        yield chunk;
      }

      let conversationId = chatRequest.conversationId;

      if (!conversationId) {
        const newConversation: NewConversation = {
          title: this.generateConversationTitle(chatRequest.messages[0]?.content),
          metadata: { model: chatRequest.model || 'gpt-4o' },
        };

        const [conversation] = await this.db
          .insert(conversations)
          .values(newConversation)
          .returning();

        conversationId = conversation.id;
      }

      const userMessage: NewMessage = {
        conversationId,
        role: 'user',
        content: chatRequest.messages[chatRequest.messages.length - 1]?.content,
      };

      const assistantMessage: NewMessage = {
        conversationId,
        role: 'assistant',
        content: fullResponse,
      };

      await this.db.insert(messages).values([userMessage, assistantMessage]);

    } catch (error) {
      console.error('Erro no chat stream:', error);
      yield 'Erro: Falha ao gerar resposta';
    }
  }

  async getConversationHistory(conversationId: string) {
    return this.db
      .select()
      .from(messages)
      .where(eq(messages.conversationId, conversationId))
      .orderBy(messages.createdAt);
  }

  private generateConversationTitle(firstMessage: string): string {
    if (!firstMessage) return 'Nova Conversa';

    const words = firstMessage.split(' ').slice(0, 5);
    return words.join(' ') + (firstMessage.split(' ').length > 5 ? '...' : '');
  }

  private isCsvCommand(message: string): boolean {
    const csvKeywords = [
      'csv', 'relatório', 'relatorio', 'export', 'exportar',
      'planilha', 'usuarios', 'usuários', 'conversas',
      'documentos', 'geografica', 'geográfica', 'distribuição',
      'distribuicao', 'gerar', 'gere'
    ];

    return csvKeywords.some(keyword => message.includes(keyword));
  }

  private async getLatestDownloadLink(): Promise<string | null> {
    try {
      // Buscar todas as chaves de download no Redis
      const keys = await this.redisService.keys('download:*');
      if (keys.length === 0) return null;

      // Ordenar por timestamp (mais recente primeiro)
      const keysWithTime = await Promise.all(
        keys.map(async (key) => {
          const ttl = await this.redisService.ttl(key);
          return { key, ttl };
        })
      );

      // Pegar a chave mais recente (menor TTL = mais nova)
      const latestKey = keysWithTime
        .filter(item => item.ttl > 0)
        .sort((a, b) => b.ttl - a.ttl)[0];

      if (!latestKey) return null;

      const downloadId = latestKey.key.replace('download:', '');
      return `http://localhost:3333/api/download/${downloadId}`;
    } catch (error) {
      console.error('❌ Erro ao buscar link de download:', error);
      return null;
    }
  }
}