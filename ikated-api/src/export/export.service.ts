import { Injectable, Inject } from '@nestjs/common';
import { DATABASE_CONNECTION } from '../database/database.module';
import { DrizzleDB } from '../database/types';
import { forms, documents, conversations, messages } from '../database/schema';
import { eq } from 'drizzle-orm';
import * as csvWriter from 'csv-writer';
import * as fs from 'fs';
import * as path from 'path';
import { jsPDF } from 'jspdf';

@Injectable()
export class ExportService {
  constructor(
    @Inject(DATABASE_CONNECTION) private readonly db: DrizzleDB,
  ) {}

  async exportFormsToCSV(): Promise<string> {
    try {
      const formsData = await this.db.select().from(forms);

      const exportPath = path.join(process.cwd(), 'exports');
      if (!fs.existsSync(exportPath)) {
        fs.mkdirSync(exportPath, { recursive: true });
      }

      const fileName = `forms-export-${Date.now()}.csv`;
      const filePath = path.join(exportPath, fileName);

      const writer = csvWriter.createObjectCsvWriter({
        path: filePath,
        header: [
          { id: 'id', title: 'ID' },
          { id: 'formType', title: 'Tipo de Formulário' },
          { id: 'nomeCompleto', title: 'Nome Completo' },
          { id: 'cpf', title: 'CPF' },
          { id: 'email', title: 'Email' },
          { id: 'telefone', title: 'Telefone' },
          { id: 'confidence', title: 'Confiança (%)' },
          { id: 'isValidated', title: 'Validado' },
          { id: 'createdAt', title: 'Data de Criação' },
        ],
      });

      const records = formsData.map(form => {
        const formData = form.formData as any;
        return {
          id: form.id,
          formType: form.formType,
          nomeCompleto: formData?.nomeCompleto || '',
          cpf: formData?.cpf || '',
          email: formData?.email || '',
          telefone: formData?.telefone || '',
          confidence: form.confidence || 0,
          isValidated: form.isValidated ? 'Sim' : 'Não',
          createdAt: form.createdAt?.toISOString() || '',
        };
      });

      await writer.writeRecords(records);
      return filePath;
    } catch (error) {
      console.error('Erro ao exportar CSV:', error);
      throw new Error('Falha na exportação CSV');
    }
  }

  async exportConversationsToPDF(conversationId?: string): Promise<string> {
    try {
      let conversationsData;

      if (conversationId) {
        conversationsData = await this.db
          .select()
          .from(conversations)
          .where(eq(conversations.id, conversationId));
      } else {
        conversationsData = await this.db.select().from(conversations);
      }

      const exportPath = path.join(process.cwd(), 'exports');
      if (!fs.existsSync(exportPath)) {
        fs.mkdirSync(exportPath, { recursive: true });
      }

      const fileName = `conversations-${conversationId || 'all'}-${Date.now()}.pdf`;
      const filePath = path.join(exportPath, fileName);

      const doc = new jsPDF();
      let yPosition = 20;

      doc.setFontSize(16);
      doc.text('Relatório de Conversas - Ikated IA', 20, yPosition);
      yPosition += 20;

      doc.setFontSize(12);
      doc.text(`Data de Geração: ${new Date().toLocaleDateString('pt-BR')}`, 20, yPosition);
      yPosition += 20;

      for (const conversation of conversationsData) {
        const messagesData = await this.db
          .select()
          .from(messages)
          .where(eq(messages.conversationId, conversation.id))
          .orderBy(messages.createdAt);

        doc.setFontSize(14);
        doc.text(`Conversa: ${conversation.title || 'Sem título'}`, 20, yPosition);
        yPosition += 10;

        doc.setFontSize(10);
        doc.text(`ID: ${conversation.id}`, 20, yPosition);
        yPosition += 10;

        doc.text(`Criada em: ${conversation.createdAt?.toLocaleDateString('pt-BR')}`, 20, yPosition);
        yPosition += 15;

        for (const message of messagesData) {
          if (yPosition > 270) {
            doc.addPage();
            yPosition = 20;
          }

          doc.setFontSize(12);
          doc.text(`${message.role === 'user' ? 'Usuário' : 'IA'}:`, 20, yPosition);
          yPosition += 10;

          const words = message.content.split(' ');
          let line = '';

          for (const word of words) {
            const testLine = line + word + ' ';
            const testWidth = doc.getTextWidth(testLine);

            if (testWidth > 170 && line !== '') {
              doc.text(line.trim(), 25, yPosition);
              yPosition += 7;
              line = word + ' ';

              if (yPosition > 270) {
                doc.addPage();
                yPosition = 20;
              }
            } else {
              line = testLine;
            }
          }

          if (line.trim() !== '') {
            doc.text(line.trim(), 25, yPosition);
            yPosition += 7;
          }

          yPosition += 10;
        }

        yPosition += 10;
      }

      doc.save(filePath);
      return filePath;
    } catch (error) {
      console.error('Erro ao exportar PDF:', error);
      throw new Error('Falha na exportação PDF');
    }
  }

  async exportDocumentsToPDF(): Promise<string> {
    try {
      const documentsData = await this.db.select().from(documents);

      const exportPath = path.join(process.cwd(), 'exports');
      if (!fs.existsSync(exportPath)) {
        fs.mkdirSync(exportPath, { recursive: true });
      }

      const fileName = `documents-report-${Date.now()}.pdf`;
      const filePath = path.join(exportPath, fileName);

      const doc = new jsPDF();
      let yPosition = 20;

      doc.setFontSize(16);
      doc.text('Relatório de Documentos - Ikated IA', 20, yPosition);
      yPosition += 20;

      doc.setFontSize(12);
      doc.text(`Data de Geração: ${new Date().toLocaleDateString('pt-BR')}`, 20, yPosition);
      yPosition += 20;

      for (const document of documentsData) {
        if (yPosition > 250) {
          doc.addPage();
          yPosition = 20;
        }

        doc.setFontSize(14);
        doc.text(`Documento: ${document.originalName}`, 20, yPosition);
        yPosition += 10;

        doc.setFontSize(10);
        doc.text(`ID: ${document.id}`, 20, yPosition);
        yPosition += 7;

        doc.text(`Tipo: ${document.mimeType || 'N/A'}`, 20, yPosition);
        yPosition += 7;

        doc.text(`Tamanho: ${document.size ? `${document.size} bytes` : 'N/A'}`, 20, yPosition);
        yPosition += 7;

        doc.text(`Upload: ${document.createdAt?.toLocaleDateString('pt-BR') || 'N/A'}`, 20, yPosition);
        yPosition += 10;

        if (document.extractedData) {
          doc.text('Dados Extraídos:', 20, yPosition);
          yPosition += 7;

          const extractedData = document.extractedData as Record<string, any>;
          for (const [key, value] of Object.entries(extractedData)) {
            if (value) {
              doc.text(`  ${key}: ${value}`, 25, yPosition);
              yPosition += 7;

              if (yPosition > 270) {
                doc.addPage();
                yPosition = 20;
              }
            }
          }
        }

        yPosition += 10;
      }

      doc.save(filePath);
      return filePath;
    } catch (error) {
      console.error('Erro ao exportar PDF de documentos:', error);
      throw new Error('Falha na exportação PDF de documentos');
    }
  }
}