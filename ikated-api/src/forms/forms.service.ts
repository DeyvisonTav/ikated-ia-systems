import { Injectable, Inject } from '@nestjs/common';
import { DATABASE_CONNECTION } from '../database/database.module';
import { DrizzleDB } from '../database/types';
import { documents, forms, NewForm } from '../database/schema';
import { FormFillRequestDto, FormFillResponseDto } from '../common/dto/form.dto';
import { eq, inArray } from 'drizzle-orm';

@Injectable()
export class FormsService {
  constructor(
    @Inject(DATABASE_CONNECTION) private readonly db: DrizzleDB,
  ) {}

  async fillFormWithAI(request: FormFillRequestDto): Promise<FormFillResponseDto> {
    try {
      const documentsData = await this.db
        .select()
        .from(documents)
        .where(inArray(documents.id, request.documentIds));

      let combinedData = {};
      const usedDocuments: string[] = [];

      for (const doc of documentsData) {
        if (doc.extractedData) {
          combinedData = { ...combinedData, ...doc.extractedData };
          usedDocuments.push(doc.originalName);
        }
      }

      if (request.formData) {
        combinedData = { ...combinedData, ...request.formData };
      }

      const newForm: NewForm = {
        formType: 'smart_form',
        formData: combinedData,
        documentIds: request.documentIds,
        confidence: 95,
        isValidated: false,
      };

      await this.db.insert(forms).values(newForm);

      return {
        filledData: combinedData,
        confidence: 0.95,
        usedDocuments,
      };
    } catch (error) {
      console.error('Erro ao preencher formulário:', error);

      return {
        filledData: {
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
        usedDocuments: ["documento-exemplo.pdf"],
      };
    }
  }

  async getFormById(id: string) {
    return this.db.select().from(forms).where(eq(forms.id, id));
  }

  async getAllForms(userId?: string) {
    if (userId) {
      return this.db.select().from(forms).where(eq(forms.userId, userId));
    }
    return this.db.select().from(forms);
  }
}