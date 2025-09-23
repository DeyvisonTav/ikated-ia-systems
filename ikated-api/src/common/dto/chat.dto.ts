import { IsArray, IsString, IsOptional, IsUUID } from 'class-validator';

export class ChatMessage {
  @IsString()
  role: 'user' | 'assistant';

  @IsString()
  content: string;
}

export class ChatRequestDto {
  @IsArray()
  messages: ChatMessage[];

  @IsOptional()
  @IsUUID()
  conversationId?: string;

  @IsOptional()
  @IsString()
  model?: string;
}

export class ChatResponseDto {
  @IsString()
  message: string;

  @IsString()
  timestamp: string;

  @IsOptional()
  @IsUUID()
  conversationId?: string;
}