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
      // Gera datas de cadastro distribuídas pelos últimos 12 meses
      const createdAt = faker.date.recent({ days: 365 });

      // Gera idades com distribuição realista
      const ageGroups = [
        { min: 18, max: 25, weight: 20 }, // Jovens
        { min: 26, max: 35, weight: 30 }, // Adultos jovens (maior volume)
        { min: 36, max: 45, weight: 25 }, // Adultos
        { min: 46, max: 60, weight: 20 }, // Adultos maduros
        { min: 61, max: 80, weight: 5 },  // Idosos
      ];

      const selectedAgeGroup = faker.helpers.arrayElement(ageGroups);
      const birthDate = faker.date.birthdate({
        min: selectedAgeGroup.min,
        max: selectedAgeGroup.max,
        mode: 'age'
      });

      const newUser: NewUser = {
        name: faker.person.fullName(),
        email: faker.internet.email(),
        cpf: this.generateCPF(),
        rg: faker.string.numeric(9),
        phone: `(${faker.string.numeric(2)}) ${faker.string.numeric(1)}.${faker.string.numeric(4)}-${faker.string.numeric(4)}`,
        birthDate,
        address: this.generateRealisticAddress(),
        createdAt,
        updatedAt: createdAt,
      };

      const [user] = await this.db.insert(users).values(newUser).returning();
      userIds.push(user.id);
    }

    return userIds;
  }

  async seedConversations(userIds: string[], count: number = 20): Promise<string[]> {
    const conversationIds: string[] = [];

    for (let i = 0; i < count; i++) {
      // Conversas distribuídas pelos últimos 6 meses
      const createdAt = faker.date.recent({ days: 180 });

      const newConversation: NewConversation = {
        userId: faker.helpers.arrayElement(userIds),
        title: faker.helpers.arrayElement([
          'Análise de Documentos Pessoais',
          'Preenchimento de Formulário',
          'Consulta sobre Relatórios',
          'Suporte Técnico',
          'Análise de Dados',
          'Exportação de CSV',
          'Chat sobre Estatísticas',
          'Ajuda com Sistema'
        ]),
        metadata: {
          model: faker.helpers.arrayElement(['gpt-4o', 'gpt-3.5-turbo']),
          language: 'pt-BR',
          category: faker.helpers.arrayElement(['support', 'analysis', 'report', 'form']),
        },
        createdAt,
        updatedAt: createdAt,
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
      { type: 'application/pdf', name: 'rg-completo.pdf', category: 'identidade' },
      { type: 'image/jpeg', name: 'rg-frente.jpg', category: 'identidade' },
      { type: 'image/jpeg', name: 'rg-verso.jpg', category: 'identidade' },
      { type: 'application/pdf', name: 'cpf.pdf', category: 'identidade' },
      { type: 'image/jpeg', name: 'cnh-frente.jpg', category: 'identidade' },
      { type: 'application/pdf', name: 'comprovante-residencia.pdf', category: 'endereco' },
      { type: 'image/jpeg', name: 'conta-luz.jpg', category: 'endereco' },
      { type: 'application/pdf', name: 'contrato-trabalho.pdf', category: 'profissional' },
      { type: 'application/pdf', name: 'holerite.pdf', category: 'profissional' },
      { type: 'application/pdf', name: 'declaracao-ir.pdf', category: 'financeiro' },
      { type: 'image/png', name: 'cartao-vacina.png', category: 'saude' },
      { type: 'application/pdf', name: 'certidao-nascimento.pdf', category: 'civil' },
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
    const requestTypes = [
      { type: 'chat', weight: 40, avgDuration: 3000, successRate: 95 },
      { type: 'document_analysis', weight: 30, avgDuration: 8000, successRate: 88 },
      { type: 'form_fill', weight: 20, avgDuration: 5000, successRate: 92 },
      { type: 'export', weight: 10, avgDuration: 12000, successRate: 98 }
    ];

    const models = ['gpt-4o', 'gpt-3.5-turbo'];
    const statuses = ['success', 'error', 'partial'];

    for (let i = 0; i < count; i++) {
      const requestType = faker.helpers.arrayElement(requestTypes);

      // Status baseado na taxa de sucesso do tipo de request
      const isSuccess = faker.number.float() * 100 < requestType.successRate;
      const status = isSuccess ? 'success' : faker.helpers.arrayElement(['error', 'partial']);

      // Duração baseada no tipo com variação realista
      const baseDuration = requestType.avgDuration;
      const duration = faker.number.int({
        min: Math.floor(baseDuration * 0.5),
        max: Math.floor(baseDuration * 2)
      });

      const newLog: NewAiLog = {
        sessionId: faker.string.uuid(),
        requestType: requestType.type,
        inputData: {
          type: requestType.type,
          timestamp: faker.date.recent(),
          size: faker.number.int({ min: 100, max: 10000 }),
          userAgent: faker.internet.userAgent(),
        },
        outputData: {
          success: status === 'success',
          confidence: status === 'success' ?
            faker.number.float({ min: 0.8, max: 0.99 }) :
            faker.number.float({ min: 0.3, max: 0.7 }),
          processingTime: duration,
        },
        model: faker.helpers.arrayElement(['gpt-4o', 'gpt-3.5-turbo']),
        tokens: faker.number.int({
          min: requestType.type === 'chat' ? 50 : 200,
          max: requestType.type === 'export' ? 8000 : 4000
        }),
        duration,
        status,
        errorMessage: status !== 'success' ?
          faker.helpers.arrayElement([
            'Timeout na análise do documento',
            'Formato de arquivo não suportado',
            'Erro de conectividade com OpenAI',
            'Rate limit excedido',
            'Dados insuficientes para análise'
          ]) : null,
      };

      await this.db.insert(aiLogs).values(newLog);
    }
  }

  async seedAll(): Promise<void> {
    console.log('🌱 Iniciando seed do banco de dados...');

    try {
      console.log('👥 Criando usuários...');
      const userIds = await this.seedUsers(200); // Aumento para análises por faixa etária

      console.log('💬 Criando conversas...');
      const conversationIds = await this.seedConversations(userIds, 300); // Mais conversas

      console.log('📝 Criando mensagens...');
      await this.seedMessages(conversationIds, 1500); // Mais mensagens para análise

      console.log('📄 Criando documentos...');
      const documentIds = await this.seedDocuments(userIds, 250); // Mais documentos processados

      console.log('📋 Criando formulários...');
      await this.seedForms(userIds, documentIds, 180); // Mais formulários

      console.log('📊 Criando logs de IA...');
      await this.seedAiLogs(500); // Mais logs para análise de performance

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

  private generateRealisticAddress() {
    // Distribuição realista por estados brasileiros
    const estados = [
      { estado: 'SP', cidade: 'São Paulo', peso: 25 },
      { estado: 'SP', cidade: 'Campinas', peso: 8 },
      { estado: 'SP', cidade: 'Santos', peso: 7 },
      { estado: 'RJ', cidade: 'Rio de Janeiro', peso: 15 },
      { estado: 'RJ', cidade: 'Niterói', peso: 5 },
      { estado: 'MG', cidade: 'Belo Horizonte', peso: 10 },
      { estado: 'MG', cidade: 'Uberlândia', peso: 5 },
      { estado: 'RS', cidade: 'Porto Alegre', peso: 8 },
      { estado: 'PR', cidade: 'Curitiba', peso: 6 },
      { estado: 'BA', cidade: 'Salvador', peso: 5 },
      { estado: 'DF', cidade: 'Brasília', peso: 4 },
      { estado: 'GO', cidade: 'Goiânia', peso: 2 },
    ];

    const totalPeso = estados.reduce((sum, e) => sum + e.peso, 0);
    const random = faker.number.int({ min: 1, max: totalPeso });

    let acumulado = 0;
    const estadoEscolhido = estados.find(e => {
      acumulado += e.peso;
      return random <= acumulado;
    }) || estados[0];

    // CEPs realistas por estado
    const cepRanges = {
      'SP': [1000000, 19999999],
      'RJ': [20000000, 28999999],
      'MG': [30000000, 39999999],
      'RS': [90000000, 99999999],
      'PR': [80000000, 87999999],
      'BA': [40000000, 48999999],
      'DF': [70000000, 72999999],
      'GO': [72800000, 76999999]
    };

    const range = cepRanges[estadoEscolhido.estado] || [1000000, 99999999];
    const cepBase = faker.number.int({ min: range[0], max: range[1] });
    const cep = cepBase.toString().padStart(8, '0');
    const cepFormatado = `${cep.slice(0, 5)}-${cep.slice(5, 8)}`;

    return {
      cep: cepFormatado,
      endereco: faker.location.streetAddress(),
      numero: faker.string.numeric({ length: { min: 1, max: 4 } }),
      bairro: faker.helpers.arrayElement([
        'Centro', 'Vila Madalena', 'Copacabana', 'Ipanema', 'Savassi',
        'Batel', 'Moinhos de Vento', 'Asa Norte', 'Jardins', 'Leblon'
      ]),
      cidade: estadoEscolhido.cidade,
      estado: estadoEscolhido.estado,
    };
  }
}