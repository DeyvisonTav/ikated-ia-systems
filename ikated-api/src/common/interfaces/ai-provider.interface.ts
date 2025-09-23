export interface AIProvider {
  generateResponse(messages: Array<{ role: string; content: string }>): Promise<string>;
  generateResponseStream(messages: Array<{ role: string; content: string }>): AsyncIterable<string>;
  analyzeDocument(buffer: Buffer, mimeType: string): Promise<any>;
}

export interface DocumentAnalysisResult {
  extractedData: Record<string, any>;
  confidence: number;
  processedSuccessfully: boolean;
}

export interface ChatContext {
  conversationId?: string;
  userId?: string;
  sessionId?: string;
  metadata?: Record<string, any>;
}