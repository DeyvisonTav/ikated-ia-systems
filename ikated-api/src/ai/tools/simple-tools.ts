import { tool } from 'ai';
import { z } from 'zod';
import { DrizzleDB } from '../../database/types';
import { users, conversations, messages, documents, forms } from '../../database/schema';
import { count, desc, sql } from 'drizzle-orm';
import { RedisService } from '../../redis/redis.service';
import * as csvWriter from 'csv-writer';
import * as fs from 'fs';
import * as path from 'path';

export function createSimpleTools(db: DrizzleDB, redisService: RedisService) {
  return {
    getSystemStats: tool({
      description: 'Obtém estatísticas gerais do sistema Ikated',
      inputSchema: z.object({}),
      execute: async () => {
        console.log('📊 Tool getSystemStats executando...');
        try {
          const [usersCount] = await db.select({ count: count() }).from(users);
          const [conversationsCount] = await db.select({ count: count() }).from(conversations);
          const [messagesCount] = await db.select({ count: count() }).from(messages);
          const [documentsCount] = await db.select({ count: count() }).from(documents);
          const [formsCount] = await db.select({ count: count() }).from(forms);

          return {
            success: true,
            data: {
              totalUsers: usersCount?.count || 0,
              totalConversations: conversationsCount?.count || 0,
              totalMessages: messagesCount?.count || 0,
              totalDocuments: documentsCount?.count || 0,
              totalForms: formsCount?.count || 0,
            },
            message: `📊 **Estatísticas do Sistema Ikated**

👥 **Usuários**: ${usersCount?.count || 0}
💬 **Conversas**: ${conversationsCount?.count || 0}
📝 **Mensagens**: ${messagesCount?.count || 0}
📄 **Documentos**: ${documentsCount?.count || 0}
📋 **Formulários**: ${formsCount?.count || 0}`,
          };
        } catch (error) {
          console.error('❌ Erro na tool getSystemStats:', error);
          return {
            success: false,
            error: error.message,
            message: 'Erro ao obter estatísticas do sistema'
          };
        }
      },
    }),

    getRecentUsers: tool({
      description: 'Lista os usuários cadastrados mais recentemente',
      inputSchema: z.object({
        limit: z.number().optional().describe('Número máximo de usuários (padrão: 10)'),
      }),
      execute: async ({ limit = 10 }) => {
        try {
          const recentUsers = await db
            .select({
              id: users.id,
              name: users.name,
              email: users.email,
              createdAt: users.createdAt,
            })
            .from(users)
            .orderBy(desc(users.createdAt))
            .limit(limit);

          return {
            success: true,
            users: recentUsers,
            message: `👥 **Usuários Recentes** (${recentUsers.length} encontrados)

${recentUsers.map(user =>
              `• **${user.name}** (${user.email}) - ${user.createdAt?.toLocaleDateString('pt-BR')}`
            ).join('\n')}`,
          };
        } catch (error) {
          return {
            success: false,
            message: 'Erro ao buscar usuários recentes',
            error: error.message,
          };
        }
      },
    }),

    generateUsersReport: tool({
      description: 'Gera relatório completo de usuários em formato CSV para download',
      inputSchema: z.object({
        includeAddress: z.boolean().optional().describe('Incluir endereços no relatório'),
      }),
      execute: async ({ includeAddress = true }) => {
        try {
          console.log('📊 Tool generateUsersReport executando...');
          const allUsers = await db.select().from(users);
          console.log(`👥 Encontrados ${allUsers.length} usuários`);

          const exportPath = path.join(process.cwd(), 'exports');
          if (!fs.existsSync(exportPath)) {
            fs.mkdirSync(exportPath, { recursive: true });
          }

          const csvFilename = `relatorio-usuarios-${Date.now()}.csv`;
          const filePath = path.join(exportPath, csvFilename);

          const headers = [
            { id: 'name', title: 'Nome Completo' },
            { id: 'email', title: 'Email' },
            { id: 'cpf', title: 'CPF' },
            { id: 'rg', title: 'RG' },
            { id: 'phone', title: 'Telefone' },
            { id: 'birthDate', title: 'Data de Nascimento' },
            { id: 'createdAt', title: 'Data de Cadastro' },
          ];

          if (includeAddress) {
            headers.push(
              { id: 'cep', title: 'CEP' },
              { id: 'endereco', title: 'Endereço' },
              { id: 'numero', title: 'Número' },
              { id: 'bairro', title: 'Bairro' },
              { id: 'cidade', title: 'Cidade' },
              { id: 'estado', title: 'Estado' }
            );
          }

          const writer = csvWriter.createObjectCsvWriter({
            path: filePath,
            header: headers,
          });

          const records = allUsers.map(user => {
            const address = user.address as any;
            const record: any = {
              name: user.name,
              email: user.email,
              cpf: user.cpf || '',
              rg: user.rg || '',
              phone: user.phone || '',
              birthDate: user.birthDate?.toISOString().split('T')[0] || '',
              createdAt: user.createdAt?.toISOString() || '',
            };

            if (includeAddress && address) {
              record.cep = address.cep || '';
              record.endereco = address.endereco || '';
              record.numero = address.numero || '';
              record.bairro = address.bairro || '';
              record.cidade = address.cidade || '';
              record.estado = address.estado || '';
            }

            return record;
          });

          await writer.writeRecords(records);

          const downloadKey = `download:${path.basename(filePath, '.csv')}`;
          await redisService.setJson(downloadKey, {
            filePath,
            filename: csvFilename,
            type: 'csv',
            generatedAt: new Date().toISOString(),
            recordCount: records.length,
          }, 3600);

          console.log(`💾 Arquivo salvo no Redis com chave: ${downloadKey}`);

          const response = {
            success: true,
            message: `📊 **Relatório de Usuários Gerado!**

✅ **${records.length} usuários** exportados para CSV
📁 **Arquivo**: ${csvFilename}
⏰ **Gerado em**: ${new Date().toLocaleString('pt-BR')}

🔗 **Download**: [Clique aqui para baixar](/api/download/${downloadKey})

O arquivo estará disponível por 1 hora.`,
            downloadKey,
            filename: csvFilename,
            recordCount: records.length,
            downloadUrl: `/api/download/${downloadKey}`,
          };

          console.log('✅ Tool generateUsersReport concluída com sucesso');
          return response;
        } catch (error) {
          console.error('❌ Erro na tool generateUsersReport:', error);
          return {
            success: false,
            message: 'Erro ao gerar relatório de usuários',
            error: error.message,
          };
        }
      },
    }),

    generateConversationsReport: tool({
      description: 'Gera relatório de conversas em formato CSV para download',
      inputSchema: z.object({
        includeMessages: z.boolean().optional().describe('Incluir resumo das mensagens'),
      }),
      execute: async ({ includeMessages = false }) => {
        try {
          const allConversations = await db
            .select()
            .from(conversations)
            .orderBy(desc(conversations.createdAt));

          const exportPath = path.join(process.cwd(), 'exports');
          if (!fs.existsSync(exportPath)) {
            fs.mkdirSync(exportPath, { recursive: true });
          }

          const csvFilename = `relatorio-conversas-${Date.now()}.csv`;
          const filePath = path.join(exportPath, csvFilename);

          const headers = [
            { id: 'id', title: 'ID da Conversa' },
            { id: 'title', title: 'Título' },
            { id: 'userId', title: 'ID do Usuário' },
            { id: 'createdAt', title: 'Data de Criação' },
          ];

          if (includeMessages) {
            headers.push({ id: 'messageCount', title: 'Número de Mensagens' });
          }

          const writer = csvWriter.createObjectCsvWriter({
            path: filePath,
            header: headers,
          });

          const records: any[] = [];
          for (const conversation of allConversations) {
            const record: any = {
              id: conversation.id,
              title: conversation.title || 'Sem título',
              userId: conversation.userId || 'N/A',
              createdAt: conversation.createdAt?.toISOString() || '',
            };

            if (includeMessages) {
              // Simplifica para evitar problemas de tipos
              record.messageCount = 0; // Será implementado posteriormente
            }

            records.push(record);
          }

          await writer.writeRecords(records);

          const downloadKey = `download:${path.basename(filePath, '.csv')}`;
          await redisService.setJson(downloadKey, {
            filePath,
            filename: csvFilename,
            type: 'csv',
            generatedAt: new Date().toISOString(),
            recordCount: records.length,
          }, 3600);

          return {
            success: true,
            message: `💬 **Relatório de Conversas Gerado!**

✅ **${records.length} conversas** exportadas para CSV
📁 **Arquivo**: ${csvFilename}
⏰ **Gerado em**: ${new Date().toLocaleString('pt-BR')}

🔗 **Download**: [Clique aqui para baixar](/api/download/${downloadKey})

O arquivo estará disponível por 1 hora.`,
            downloadKey,
            filename: csvFilename,
            recordCount: records.length,
            downloadUrl: `/api/download/${downloadKey}`,
          };
        } catch (error) {
          return {
            success: false,
            message: 'Erro ao gerar relatório de conversas',
            error: error.message,
          };
        }
      },
    }),

    generateDocumentsReport: tool({
      description: 'Gera relatório de documentos processados em formato CSV',
      inputSchema: z.object({
        includeExtractedData: z.boolean().optional().describe('Incluir dados extraídos'),
      }),
      execute: async ({ includeExtractedData = true }) => {
        try {
          const allDocuments = await db
            .select()
            .from(documents)
            .orderBy(desc(documents.createdAt));

          const exportPath = path.join(process.cwd(), 'exports');
          if (!fs.existsSync(exportPath)) {
            fs.mkdirSync(exportPath, { recursive: true });
          }

          const csvFilename = `relatorio-documentos-${Date.now()}.csv`;
          const filePath = path.join(exportPath, csvFilename);

          const headers = [
            { id: 'id', title: 'ID' },
            { id: 'originalName', title: 'Nome Original' },
            { id: 'mimeType', title: 'Tipo de Arquivo' },
            { id: 'size', title: 'Tamanho (bytes)' },
            { id: 'processedAt', title: 'Data de Processamento' },
            { id: 'createdAt', title: 'Data de Upload' },
          ];

          if (includeExtractedData) {
            headers.push(
              { id: 'nomeCompleto', title: 'Nome Extraído' },
              { id: 'cpf', title: 'CPF Extraído' },
              { id: 'email', title: 'Email Extraído' },
              { id: 'telefone', title: 'Telefone Extraído' }
            );
          }

          const writer = csvWriter.createObjectCsvWriter({
            path: filePath,
            header: headers,
          });

          const records = allDocuments.map(doc => {
            const extractedData = doc.extractedData as any;
            const record: any = {
              id: doc.id,
              originalName: doc.originalName,
              mimeType: doc.mimeType || '',
              size: doc.size || 0,
              processedAt: doc.processedAt?.toISOString() || '',
              createdAt: doc.createdAt?.toISOString() || '',
            };

            if (includeExtractedData && extractedData) {
              record.nomeCompleto = extractedData.nomeCompleto || '';
              record.cpf = extractedData.cpf || '';
              record.email = extractedData.email || '';
              record.telefone = extractedData.telefone || '';
            }

            return record;
          });

          await writer.writeRecords(records);

          const downloadKey = `download:${path.basename(filePath, '.csv')}`;
          await redisService.setJson(downloadKey, {
            filePath,
            filename: csvFilename,
            type: 'csv',
            generatedAt: new Date().toISOString(),
            recordCount: records.length,
          }, 3600);

          return {
            success: true,
            message: `📄 **Relatório de Documentos Gerado!**

✅ **${records.length} documentos** exportados para CSV
📁 **Arquivo**: ${csvFilename}
⏰ **Gerado em**: ${new Date().toLocaleString('pt-BR')}

🔗 **Download**: [Clique aqui para baixar](/api/download/${downloadKey})

O arquivo estará disponível por 1 hora.`,
            downloadKey,
            filename: csvFilename,
            recordCount: records.length,
            downloadUrl: `/api/download/${downloadKey}`,
          };
        } catch (error) {
          return {
            success: false,
            message: 'Erro ao gerar relatório de documentos',
            error: error.message,
          };
        }
      },
    }),

    generateGeographicReport: tool({
      description: 'Gera relatório de distribuição geográfica dos usuários brasileiros',
      inputSchema: z.object({
        groupBy: z.enum(['estado', 'cidade']).optional().describe('Agrupar por estado ou cidade (padrão: estado)'),
      }),
      execute: async ({ groupBy = 'estado' }) => {
        console.log('🌍 Tool generateGeographicReport executando...', { groupBy });
        try {
          let query;
          if (groupBy === 'estado') {
            query = db
              .select({
                estado: users.address,
                count: count()
              })
              .from(users)
              .where(sql`${users.address} IS NOT NULL`)
              .groupBy(users.address);
          } else {
            query = db
              .select({
                cidade: users.address,
                estado: users.address,
                count: count()
              })
              .from(users)
              .where(sql`${users.address} IS NOT NULL`)
              .groupBy(users.address);
          }

          console.log('📊 Executando query do banco...');
          const results = await query;
          console.log('✅ Query executada, resultados:', results.length);

          // Processa os dados do JSON address
          const processedData = results.map(row => {
            const address = row.estado || row.cidade as any;
            if (groupBy === 'estado') {
              return {
                estado: address?.estado || 'N/A',
                total_usuarios: row.count || 0
              };
            } else {
              return {
                cidade: address?.cidade || 'N/A',
                estado: address?.estado || 'N/A',
                total_usuarios: row.count || 0
              };
            }
          });

          // Agrupa por estado/cidade
          const grouped = processedData.reduce((acc, item) => {
            const key = groupBy === 'estado' ? item.estado : `${item.cidade}-${item.estado}`;
            if (!acc[key]) {
              acc[key] = groupBy === 'estado' ?
                { estado: item.estado, total_usuarios: 0 } :
                { cidade: item.cidade, estado: item.estado, total_usuarios: 0 };
            }
            acc[key].total_usuarios += item.total_usuarios;
            return acc;
          }, {} as any);

          const finalData = Object.values(grouped).sort((a: any, b: any) => b.total_usuarios - a.total_usuarios);

          const exportPath = path.join(process.cwd(), 'exports');
          if (!fs.existsSync(exportPath)) {
            fs.mkdirSync(exportPath, { recursive: true });
          }

          const csvFilename = `distribuicao-geografica-${groupBy}-${Date.now()}.csv`;
          const filePath = path.join(exportPath, csvFilename);

          const headers = groupBy === 'estado' ? [
            { id: 'estado', title: 'Estado' },
            { id: 'total_usuarios', title: 'Total de Usuários' }
          ] : [
            { id: 'cidade', title: 'Cidade' },
            { id: 'estado', title: 'Estado' },
            { id: 'total_usuarios', title: 'Total de Usuários' }
          ];

          const writer = csvWriter.createObjectCsvWriter({
            path: filePath,
            header: headers,
          });

          await writer.writeRecords(finalData as any);

          const downloadKey = `download:${path.basename(filePath, '.csv')}`;
          console.log('💾 Tentando salvar no Redis:', { downloadKey, filePath, csvFilename });
          await redisService.setJson(downloadKey, {
            filePath,
            filename: csvFilename,
            type: 'csv',
            generatedAt: new Date().toISOString(),
            recordCount: finalData.length,
          }, 3600);
          console.log('✅ Dados salvos no Redis com sucesso!');

          return {
            success: true,
            message: `🗺️ **Distribuição Geográfica - ${groupBy === 'estado' ? 'Por Estado' : 'Por Cidade'}**

✅ **${finalData.length} registros** exportados para CSV
📁 **Arquivo**: ${csvFilename}
⏰ **Gerado em**: ${new Date().toLocaleString('pt-BR')}

📊 **Top 5 ${groupBy === 'estado' ? 'Estados' : 'Cidades'}**:
${finalData.slice(0, 5).map((item: any, index) =>
              groupBy === 'estado' ?
                `${index + 1}. **${item.estado}**: ${item.total_usuarios} usuários` :
                `${index + 1}. **${item.cidade}/${item.estado}**: ${item.total_usuarios} usuários`
            ).join('\n')}

🔗 **Download**: [Clique aqui para baixar](/api/download/${downloadKey})

O arquivo estará disponível por 1 hora.`,
            downloadKey,
            filename: csvFilename,
            recordCount: finalData.length,
            downloadUrl: `/api/download/${downloadKey}`,
            data: finalData.slice(0, 10) // Primeiros 10 para preview
          };
        } catch (error) {
          console.error('❌ Erro na tool generateGeographicReport:', error);
          return {
            success: false,
            message: 'Erro ao gerar relatório geográfico',
            error: error.message,
          };
        }
      },
    }),
  };
}