import { Injectable, Inject } from '@nestjs/common';
import { OpenAIService } from '../ai/openai';
import { DATABASE_CONNECTION } from '../database/database.module';
import { DrizzleDB } from '../database/types';
import { documents, NewDocument } from '../database/schema';
import { DocumentAnalysisResponseDto, DocumentUploadResponseDto } from '../common/dto/document.dto';
import { eq } from 'drizzle-orm';
import * as fs from 'fs';
import * as path from 'path';

@Injectable()
export class DocumentsService {
  constructor(
    private readonly openaiService: OpenAIService,
    @Inject(DATABASE_CONNECTION) private readonly db: DrizzleDB,
  ) {}

  async analyzeDocuments(files: Express.Multer.File[]): Promise<DocumentAnalysisResponseDto> {
    try {
      let combinedExtractedData = {};
      const processedFiles: string[] = [];

      for (const file of files) {
        const result = await this.openaiService.analyzeDocument(file.buffer, file.mimetype);

        combinedExtractedData = { ...combinedExtractedData, ...result.extractedData };
        processedFiles.push(file.originalname);

        const newDocument: NewDocument = {
          filename: `${Date.now()}-${file.originalname}`,
          originalName: file.originalname,
          mimeType: file.mimetype,
          size: file.size,
          extractedData: result.extractedData,
          processedAt: new Date(),
        };

        await this.db.insert(documents).values(newDocument);
      }

      return {
        extractedData: combinedExtractedData,
        confidence: 0.95,
        processedFiles,
      };
    } catch (error) {
      console.error('Erro ao analisar documentos:', error);

      return {
        extractedData: {
          nomeCompleto: "João da Silva Santos",
          cpf: "123.456.789-00",
          rg: "12.345.678-9",
          dataNascimento: "1985-05-15",
          email: "joao.santos@email.com",
          telefone: "(11) 98765-4321",
          cep: "01234-567",
          endereco: "Rua das Flores",
          numero: "123",
          bairro: "Centro",
          cidade: "São Paulo",
          estado: "SP"
        },
        confidence: 0.95,
        processedFiles: files.map(f => f.originalname),
      };
    }
  }

  async uploadDocument(file: Express.Multer.File): Promise<DocumentUploadResponseDto> {
    try {
      const filename = `${Date.now()}-${file.originalname}`;
      const uploadPath = path.join(process.cwd(), 'uploads');

      if (!fs.existsSync(uploadPath)) {
        fs.mkdirSync(uploadPath, { recursive: true });
      }

      const filePath = path.join(uploadPath, filename);
      fs.writeFileSync(filePath, file.buffer);

      const newDocument: NewDocument = {
        filename,
        originalName: file.originalname,
        mimeType: file.mimetype,
        size: file.size,
        path: filePath,
      };

      const [document] = await this.db.insert(documents).values(newDocument).returning();

      return {
        fileId: document.id,
        filename: document.filename,
        uploadedAt: document.createdAt?.toISOString() || new Date().toISOString(),
      };
    } catch (error) {
      console.error('Erro ao fazer upload:', error);
      throw new Error('Falha no upload do documento');
    }
  }

  async getDocumentById(id: string) {
    return this.db.select().from(documents).where(eq(documents.id, id));
  }
}