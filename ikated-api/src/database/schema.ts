import { pgTable, text, timestamp, uuid, jsonb, integer, boolean, varchar } from 'drizzle-orm/pg-core';

// Tabela de usuários
export const users = pgTable('users', {
  id: uuid('id').defaultRandom().primaryKey(),
  name: varchar('name', { length: 255 }).notNull(),
  email: varchar('email', { length: 255 }).notNull().unique(),
  cpf: varchar('cpf', { length: 14 }),
  rg: varchar('rg', { length: 20 }),
  phone: varchar('phone', { length: 20 }),
  birthDate: timestamp('birth_date'),
  address: jsonb('address'),
  createdAt: timestamp('created_at').defaultNow(),
  updatedAt: timestamp('updated_at').defaultNow(),
});

// Tabela de conversas/chats
export const conversations = pgTable('conversations', {
  id: uuid('id').defaultRandom().primaryKey(),
  userId: uuid('user_id').references(() => users.id),
  title: varchar('title', { length: 255 }),
  metadata: jsonb('metadata'),
  createdAt: timestamp('created_at').defaultNow(),
  updatedAt: timestamp('updated_at').defaultNow(),
});

// Tabela de mensagens
export const messages = pgTable('messages', {
  id: uuid('id').defaultRandom().primaryKey(),
  conversationId: uuid('conversation_id').references(() => conversations.id),
  role: varchar('role', { length: 20 }).notNull(), // 'user' ou 'assistant'
  content: text('content').notNull(),
  metadata: jsonb('metadata'),
  createdAt: timestamp('created_at').defaultNow(),
});

// Tabela de documentos
export const documents = pgTable('documents', {
  id: uuid('id').defaultRandom().primaryKey(),
  userId: uuid('user_id').references(() => users.id),
  filename: varchar('filename', { length: 255 }).notNull(),
  originalName: varchar('original_name', { length: 255 }).notNull(),
  mimeType: varchar('mime_type', { length: 100 }),
  size: integer('size'),
  path: text('path'),
  extractedData: jsonb('extracted_data'),
  processedAt: timestamp('processed_at'),
  createdAt: timestamp('created_at').defaultNow(),
});

// Tabela de formulários preenchidos
export const forms = pgTable('forms', {
  id: uuid('id').defaultRandom().primaryKey(),
  userId: uuid('user_id').references(() => users.id),
  formType: varchar('form_type', { length: 100 }).notNull(),
  formData: jsonb('form_data').notNull(),
  documentIds: jsonb('document_ids'),
  confidence: integer('confidence'),
  isValidated: boolean('is_validated').default(false),
  createdAt: timestamp('created_at').defaultNow(),
  updatedAt: timestamp('updated_at').defaultNow(),
});

// Tabela de logs de IA
export const aiLogs = pgTable('ai_logs', {
  id: uuid('id').defaultRandom().primaryKey(),
  sessionId: varchar('session_id', { length: 255 }),
  requestType: varchar('request_type', { length: 100 }).notNull(), // 'chat', 'document_analysis', 'form_fill'
  inputData: jsonb('input_data'),
  outputData: jsonb('output_data'),
  model: varchar('model', { length: 100 }),
  tokens: integer('tokens'),
  duration: integer('duration'), // em millisegundos
  status: varchar('status', { length: 20 }).notNull(), // 'success', 'error', 'partial'
  errorMessage: text('error_message'),
  createdAt: timestamp('created_at').defaultNow(),
});

export type User = typeof users.$inferSelect;
export type NewUser = typeof users.$inferInsert;
export type Conversation = typeof conversations.$inferSelect;
export type NewConversation = typeof conversations.$inferInsert;
export type Message = typeof messages.$inferSelect;
export type NewMessage = typeof messages.$inferInsert;
export type Document = typeof documents.$inferSelect;
export type NewDocument = typeof documents.$inferInsert;
export type Form = typeof forms.$inferSelect;
export type NewForm = typeof forms.$inferInsert;
export type AiLog = typeof aiLogs.$inferSelect;
export type NewAiLog = typeof aiLogs.$inferInsert;