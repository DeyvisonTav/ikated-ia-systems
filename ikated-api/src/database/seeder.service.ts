import { Injectable, Inject } from '@nestjs/common';
import { faker } from '@faker-js/faker';
import { DATABASE_CONNECTION } from './database.module';
import { DrizzleDB } from './types';
import {
  users,
  conversations,
  messages,
  documents,
  forms,
  aiLogs,
  NewUser,
  NewConversation,
  NewMessage,
  NewDocument,
  NewForm,
  NewAiLog,
} from './schema';

@Injectable()
export class SeederService {
  constructor(
    @Inject(DATABASE_CONNECTION) private readonly db: DrizzleDB,
  ) {
    // faker.locale = 'pt_BR';
  }

  async seedUsers(count: number = 10): Promise<string[]> {
    const userIds: string[] = [];

    for (let i = 0; i < count; i++) {
      const newUser: NewUser = {
        name: faker.person.fullName(),
        email: faker.internet.email(),
        cpf: this.generateCPF(),
        rg: faker.string.numeric(9),
        phone: `(${faker.string.numeric(2)}) ${faker.string.numeric(1)}.${faker.string.numeric(4)}-${faker.string.numeric(4)}`,
        birthDate: faker.date.birthdate({ min: 18, max: 80, mode: 'age' }),
        address: {
          cep: faker.location.zipCode('#####-###'),
          endereco: faker.location.streetAddress(),
          numero: faker.string.numeric({ length: { min: 1, max: 4 } }),
          bairro: faker.location.direction(),
          cidade: faker.location.city(),
          estado: faker.location.state({ abbreviated: true }),
        },
      };

      const [user] = await this.db.insert(users).values(newUser).returning();
      userIds.push(user.id);
    }

    return userIds;
  }

  async seedConversations(userIds: string[], count: number = 20): Promise<string[]> {
    const conversationIds: string[] = [];

    for (let i = 0; i < count; i++) {
      const newConversation: NewConversation = {
        userId: faker.helpers.arrayElement(userIds),
        title: faker.lorem.sentence(3),
        metadata: {
          model: faker.helpers.arrayElement(['gpt-4o', 'gpt-3.5-turbo']),
          language: 'pt-BR',
        },
      };

      const [conversation] = await this.db.insert(conversations).values(newConversation).returning();
      conversationIds.push(conversation.id);
    }

    return conversationIds;
  }

  async seedMessages(conversationIds: string[], count: number = 100): Promise<void> {
    const sampleQuestions = [
      'Olá! Como você pode me ajudar?',
      'Preciso de ajuda para preencher um formulário.',
      'Como posso extrair dados de documentos?',
      'Pode me ajudar a criar um relatório?',
      'Qual a melhor forma de organizar meus documentos?',
      'Como funciona a análise automática de documentos?',
      'Preciso gerar um CSV com meus dados.',
      'Pode criar um PDF do nosso histórico de conversa?',
      'Como posso validar as informações extraídas?',
      'Quais tipos de documentos vocês suportam?',
    ];

    const sampleAnswers = [
      'Olá! Sou seu assistente de IA e posso ajudar com análise de documentos, preenchimento de formulários, geração de relatórios e muito mais. Em que posso ajudá-lo hoje?',
      'Claro! Posso ajudar você a preencher formulários automaticamente usando dados extraídos de documentos. Você pode fazer upload dos seus documentos e eu analiso as informações para preencher os campos.',
      'Para extrair dados de documentos, basta fazer upload dos arquivos (PDF, JPG, PNG) e nossa IA analisa automaticamente, extraindo informações como nome, CPF, endereço, etc.',
      'Sim! Posso gerar relatórios em PDF ou CSV com seus dados. Que tipo de relatório você gostaria de criar?',
      'Recomendo organizar documentos por categorias: pessoais, financeiros, profissionais. Nossa plataforma pode ajudar a extrair e categorizar automaticamente.',
      'Nossa análise usa IA para reconhecer texto e padrões em documentos, extraindo informações estruturadas como dados pessoais, endereços, datas, etc.',
      'Posso gerar um arquivo CSV com todos os seus dados. Você gostaria de incluir formulários, documentos analisados ou conversas?',
      'Claro! Posso criar um PDF com todo o histórico da nossa conversa, formatado de forma profissional para você salvar ou compartilhar.',
      'Você pode revisar os dados extraídos e marcar como validados. Também mostramos um nível de confiança para cada extração.',
      'Suportamos PDFs, imagens (JPG, PNG), e estamos sempre expandindo os formatos. A IA consegue analisar documentos de identidade, comprovantes, contratos, etc.',
    ];

    for (let i = 0; i < count; i++) {
      const conversationId = faker.helpers.arrayElement(conversationIds);
      const isUserMessage = i % 2 === 0;

      const newMessage: NewMessage = {
        conversationId,
        role: isUserMessage ? 'user' : 'assistant',
        content: isUserMessage
          ? faker.helpers.arrayElement(sampleQuestions)
          : faker.helpers.arrayElement(sampleAnswers),
        metadata: {
          timestamp: faker.date.recent(),
          processed: true,
        },
      };

      await this.db.insert(messages).values(newMessage);
    }
  }

  async seedDocuments(userIds: string[], count: number = 30): Promise<string[]> {
    const documentIds: string[] = [];

    const documentTypes = [
      { type: 'application/pdf', name: 'documento.pdf' },
      { type: 'image/jpeg', name: 'foto-documento.jpg' },
      { type: 'image/png', name: 'screenshot.png' },
      { type: 'application/pdf', name: 'comprovante.pdf' },
      { type: 'image/jpeg', name: 'rg-frente.jpg' },
    ];

    for (let i = 0; i < count; i++) {
      const docType = faker.helpers.arrayElement(documentTypes);

      const newDocument: NewDocument = {
        userId: faker.helpers.arrayElement(userIds),
        filename: `${Date.now()}-${faker.string.uuid()}-${docType.name}`,
        originalName: docType.name,
        mimeType: docType.type,
        size: faker.number.int({ min: 10000, max: 5000000 }),
        path: `/uploads/${faker.string.uuid()}.pdf`,
        extractedData: {
          nomeCompleto: faker.person.fullName(),
          cpf: this.generateCPF(),
          rg: faker.string.numeric(9),
          dataNascimento: faker.date.birthdate().toISOString().split('T')[0],
          email: faker.internet.email(),
          telefone: faker.phone.number(),
          cep: faker.location.zipCode('#####-###'),
          endereco: faker.location.streetAddress(),
          numero: faker.string.numeric({ length: { min: 1, max: 4 } }),
          bairro: faker.location.direction(),
          cidade: faker.location.city(),
          estado: faker.location.state({ abbreviated: true }),
        },
        processedAt: faker.date.recent(),
      };

      const [document] = await this.db.insert(documents).values(newDocument).returning();
      documentIds.push(document.id);
    }

    return documentIds;
  }

  async seedForms(userIds: string[], documentIds: string[], count: number = 15): Promise<void> {
    for (let i = 0; i < count; i++) {
      const newForm: NewForm = {
        userId: faker.helpers.arrayElement(userIds),
        formType: faker.helpers.arrayElement(['smart_form', 'manual_form', 'ai_assisted']),
        formData: {
          nomeCompleto: faker.person.fullName(),
          cpf: this.generateCPF(),
          rg: faker.string.numeric(9),
          dataNascimento: faker.date.birthdate().toISOString().split('T')[0],
          email: faker.internet.email(),
          telefone: faker.phone.number(),
          cep: faker.location.zipCode('#####-###'),
          endereco: faker.location.streetAddress(),
          numero: faker.string.numeric({ length: { min: 1, max: 4 } }),
          bairro: faker.location.direction(),
          cidade: faker.location.city(),
          estado: faker.location.state({ abbreviated: true }),
        },
        documentIds: faker.helpers.arrayElements(documentIds, { min: 1, max: 3 }),
        confidence: faker.number.int({ min: 75, max: 99 }),
        isValidated: faker.datatype.boolean(),
      };

      await this.db.insert(forms).values(newForm);
    }
  }

  async seedAiLogs(count: number = 50): Promise<void> {
    const requestTypes = ['chat', 'document_analysis', 'form_fill', 'export'];
    const statuses = ['success', 'error', 'partial'];

    for (let i = 0; i < count; i++) {
      const requestType = faker.helpers.arrayElement(requestTypes);

      const newLog: NewAiLog = {
        sessionId: faker.string.uuid(),
        requestType,
        inputData: {
          type: requestType,
          timestamp: faker.date.recent(),
          size: faker.number.int({ min: 100, max: 10000 }),
        },
        outputData: {
          result: 'success',
          processed: true,
          confidence: faker.number.float({ min: 0.7, max: 0.99, fractionDigits: 2 }),
        },
        model: faker.helpers.arrayElement(['gpt-4o', 'gpt-3.5-turbo']),
        tokens: faker.number.int({ min: 50, max: 2000 }),
        duration: faker.number.int({ min: 200, max: 5000 }),
        status: faker.helpers.arrayElement(statuses),
        errorMessage: faker.datatype.boolean(0.2) ? faker.lorem.sentence() : null,
      };

      await this.db.insert(aiLogs).values(newLog);
    }
  }

  async seedAll(): Promise<void> {
    console.log('🌱 Iniciando seed do banco de dados...');

    try {
      console.log('👥 Criando usuários...');
      const userIds = await this.seedUsers(10);

      console.log('💬 Criando conversas...');
      const conversationIds = await this.seedConversations(userIds, 20);

      console.log('📝 Criando mensagens...');
      await this.seedMessages(conversationIds, 100);

      console.log('📄 Criando documentos...');
      const documentIds = await this.seedDocuments(userIds, 30);

      console.log('📋 Criando formulários...');
      await this.seedForms(userIds, documentIds, 15);

      console.log('📊 Criando logs de IA...');
      await this.seedAiLogs(50);

      console.log('✅ Seed concluído com sucesso!');
    } catch (error) {
      console.error('❌ Erro durante o seed:', error);
      throw error;
    }
  }

  private generateCPF(): string {
    const digits: number[] = [];

    for (let i = 0; i < 9; i++) {
      digits.push(faker.number.int({ min: 0, max: 9 }));
    }

    let sum = 0;
    for (let i = 0; i < 9; i++) {
      sum += digits[i]! * (10 - i);
    }
    const firstDigit = 11 - (sum % 11);
    digits.push(firstDigit >= 10 ? 0 : firstDigit);

    sum = 0;
    for (let i = 0; i < 10; i++) {
      sum += digits[i]! * (11 - i);
    }
    const secondDigit = 11 - (sum % 11);
    digits.push(secondDigit >= 10 ? 0 : secondDigit);

    return `${digits.slice(0, 3).join('')}.${digits.slice(3, 6).join('')}.${digits.slice(6, 9).join('')}-${digits.slice(9).join('')}`;
  }
}