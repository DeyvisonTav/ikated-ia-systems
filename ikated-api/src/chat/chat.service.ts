import { Injectable, Inject } from '@nestjs/common';
import { OpenAIService } from '../ai/openai';
import { DATABASE_CONNECTION } from '../database/database.module';
import { DrizzleDB } from '../database/types';
import { conversations, messages, NewConversation, NewMessage } from '../database/schema';
import { ChatRequestDto, ChatResponseDto } from '../common/dto/chat.dto';
import { eq } from 'drizzle-orm';

@Injectable()
export class ChatService {
  constructor(
    private readonly openaiService: OpenAIService,
    @Inject(DATABASE_CONNECTION) private readonly db: DrizzleDB,
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

      const response = await this.openaiService.generateResponse(chatRequest.messages);

      const assistantMessage: NewMessage = {
        conversationId,
        role: 'assistant',
        content: response,
      };

      await this.db.insert(messages).values(assistantMessage);

      return {
        message: response,
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
}