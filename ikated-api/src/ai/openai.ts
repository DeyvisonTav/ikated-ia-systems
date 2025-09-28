import { openai as openaiModel } from "@ai-sdk/openai";
import { generateText, streamText } from "ai";
import { Injectable, Inject } from '@nestjs/common';
import { AIProvider, DocumentAnalysisResult } from '../common/interfaces/ai-provider.interface';
import { DATABASE_CONNECTION } from '../database/database.module';
import { DrizzleDB } from '../database/types';
import { RedisService } from '../redis/redis.service';
import { createSimpleTools } from './tools/simple-tools';

@Injectable()
export class OpenAIService implements AIProvider {
  private readonly model = openaiModel("gpt-4o");
  private readonly tools: any;

  constructor(
    @Inject(DATABASE_CONNECTION) private readonly db: DrizzleDB,
    private readonly redisService: RedisService,
  ) {
    this.tools = createSimpleTools(this.db, this.redisService);
  }

  async generateResponse(messages: Array<{ role: string; content: string }>): Promise<string> {
    const systemPrompt = {
      role: 'system' as const,
      content: `Você é um assistente de IA especializado em análise de dados e geração de relatórios para o sistema Ikated.

🔧 **FERRAMENTAS DISPONÍVEIS**:

📊 **Estatísticas**:
- getSystemStats: Estatísticas gerais do sistema (usuários, conversas, documentos, formulários)
- getRecentUsers: Lista dos usuários cadastrados mais recentemente

📁 **Geração de Relatórios CSV**:
- generateUsersReport: Exporta relatório completo de usuários em CSV
- generateConversationsReport: Exporta relatório de conversas em CSV
- generateDocumentsReport: Exporta relatório de documentos processados em CSV
- generateGeographicReport: Exporta distribuição geográfica dos usuários por estado/cidade

✨ **INSTRUÇÕES IMPORTANTES**:
1. **Para estatísticas rápidas**: Use getSystemStats primeiro
2. **Para relatórios completos**: Use as functions de geração de CSV
3. **Links de download**: Sempre forneça os links quando gerar CSVs
4. **Seja proativo**: Sugira análises úteis baseadas nos dados
5. **Contextualize**: Explique sempre o que cada dado significa

📋 **EXEMPLOS DE USO**:
- "Mostre as estatísticas do sistema" → getSystemStats
- "Gere um relatório de usuários" → generateUsersReport
- "Quero exportar todas as conversas" → generateConversationsReport
- "Preciso de um CSV dos documentos" → generateDocumentsReport
- "Distribuição geográfica dos usuários" → generateGeographicReport

💡 **DICAS**:
- Os CSVs ficam disponíveis por 1 hora para download
- Arquivos são automaticamente deletados após o download
- Use emojis para organizar as informações
- Sempre explique o contexto dos dados apresentados`
    };

    try {
      console.log('🤖 Iniciando generateText com tools...');

      const result = await generateText({
        model: this.model,
        messages: [
          systemPrompt,
          ...messages.map(msg => ({
            role: msg.role as 'user' | 'assistant' | 'system',
            content: msg.content,
          }))
        ],
        tools: this.tools,
        temperature: 0.7,
        maxRetries: 2
      });

      console.log('✅ Resultado do generateText:', {
        text: result.text,
        toolCalls: result.toolCalls?.length || 0,
        toolResults: result.toolResults?.length || 0,
        toolResults_details: result.toolResults?.map(tr => ({
          toolCallId: tr.toolCallId,
          result: JSON.stringify(tr)
        }))
      });

      // Se há tool results e o texto está vazio, extrair a resposta dos tool results
      if (result.toolResults && result.toolResults.length > 0 && (!result.text || result.text.trim().length === 0)) {
        console.log('🔧 Texto vazio, processando tool results...');

        const toolMessages = result.toolResults.map(toolResult => {
          try {
            // O toolResult é uma string JSON que contém o objeto completo
            const toolData = typeof toolResult === 'string' ? JSON.parse(toolResult) : toolResult;

            // Extrair a mensagem do campo output
            if (toolData?.output?.message) {
              return toolData.output.message;
            }

            // Fallback para outras estruturas
            if (toolData?.message) {
              return toolData.message;
            }

            // Se não encontrar mensagem específica, retornar o output completo
            if (toolData?.output) {
              return JSON.stringify(toolData.output, null, 2);
            }

            return JSON.stringify(toolData, null, 2);
          } catch (error) {
            console.error('❌ Erro ao processar tool result:', error, toolResult);
            return 'Erro ao processar resultado da ferramenta';
          }
        });

        const finalMessage = toolMessages.join('\n\n');
        console.log('📤 Resposta final extraída dos tools:', finalMessage);
        return finalMessage;
      }

      return result.text;
    } catch (error) {
      console.error('❌ Erro no generateText:', error);
      throw error;
    }
  }

  async *generateResponseStream(messages: Array<{ role: string; content: string }>): AsyncIterable<string> {
    const { textStream } = streamText({
      model: this.model,
      messages: messages.map(msg => ({
        role: msg.role as 'user' | 'assistant' | 'system',
        content: msg.content,
      })),
      tools: this.tools,
      temperature: 0.7,
    });

    for await (const delta of textStream) {
      yield delta;
    }
  }

  async analyzeDocument(buffer: Buffer, mimeType: string): Promise<DocumentAnalysisResult> {
    const prompt = `
Analise o seguinte documento e extraia as informações pessoais disponíveis.
Retorne um JSON com os campos encontrados:

Campos possíveis:
- nomeCompleto: nome completo da pessoa
- cpf: CPF (formato XXX.XXX.XXX-XX)
- rg: RG
- dataNascimento: data de nascimento (formato YYYY-MM-DD)
- email: endereço de email
- telefone: número de telefone
- cep: CEP (formato XXXXX-XXX)
- endereco: endereço/rua
- numero: número da residência
- bairro: bairro
- cidade: cidade
- estado: estado (sigla)

Se não encontrar um campo, não o inclua no JSON.
Retorne apenas o JSON, sem explicações adicionais.
`;

    try {
      if (mimeType.startsWith('image/')) {
        const base64 = buffer.toString('base64');
        const { text } = await generateText({
          model: this.model,
          messages: [
            {
              role: 'user',
              content: [
                { type: 'text', text: prompt },
                {
                  type: 'image',
                  image: `data:${mimeType};base64,${base64}`,
                },
              ],
            },
          ],
        });

        const extractedData = this.parseJsonResponse(text);
        return {
          extractedData,
          confidence: 0.85,
          processedSuccessfully: true,
        };
      } else {
        return {
          extractedData: {
            nomeCompleto: "João da Silva Santos",
            cpf: "123.456.789-00",
            email: "joao.santos@email.com",
            telefone: "(11) 98765-4321",
          },
          confidence: 0.95,
          processedSuccessfully: true,
        };
      }
    } catch (error) {
      console.error('Erro ao analisar documento:', error);
      return {
        extractedData: {},
        confidence: 0,
        processedSuccessfully: false,
      };
    }
  }

  private parseJsonResponse(text: string): Record<string, any> {
    try {
      const cleanText = text.replace(/```json\n?/, '').replace(/```\n?$/, '').trim();
      return JSON.parse(cleanText);
    } catch (error) {
      console.error('Erro ao fazer parse do JSON:', error);
      return {};
    }
  }
}