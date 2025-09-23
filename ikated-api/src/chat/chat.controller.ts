import { Controller, Post, Body, Res, Get, Param } from '@nestjs/common';
import { Response } from 'express';
import { ChatService } from './chat.service';
import { ChatRequestDto, ChatResponseDto } from '../common/dto/chat.dto';

@Controller('api/chat')
export class ChatController {
  constructor(private readonly chatService: ChatService) {}

  @Post()
  async chat(@Body() body: ChatRequestDto): Promise<ChatResponseDto> {
    return this.chatService.generateResponse(body);
  }

  @Post('stream')
  async chatStream(@Body() body: ChatRequestDto, @Res() res: Response) {
    res.writeHead(200, {
      'Content-Type': 'text/event-stream',
      'Cache-Control': 'no-cache',
      'Connection': 'keep-alive',
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Headers': 'Cache-Control',
    });

    try {
      for await (const chunk of this.chatService.generateResponseStream(body)) {
        res.write(`data: ${JSON.stringify({ content: chunk })}\n\n`);
      }

      res.write(`data: ${JSON.stringify({ type: 'done' })}\n\n`);
    } catch (error) {
      res.write(`data: ${JSON.stringify({ error: 'Erro interno do servidor' })}\n\n`);
    } finally {
      res.end();
    }
  }

  @Get('conversation/:id/history')
  async getConversationHistory(@Param('id') conversationId: string) {
    return this.chatService.getConversationHistory(conversationId);
  }
}