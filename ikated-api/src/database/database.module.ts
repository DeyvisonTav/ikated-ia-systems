import { Module, Global } from '@nestjs/common';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { drizzle } from 'drizzle-orm/postgres-js';
import * as postgres from 'postgres';
import * as schema from './schema';

export const DATABASE_CONNECTION = 'DATABASE_CONNECTION';

@Global()
@Module({
  imports: [ConfigModule],
  providers: [
    {
      provide: DATABASE_CONNECTION,
      inject: [ConfigService],
      useFactory: async (configService: ConfigService) => {
        try {
          const connectionString = `postgresql://${configService.get('DB_USER', 'admin')}:${configService.get('DB_PASSWORD', 'root')}@${configService.get('DB_HOST', 'localhost')}:${configService.get('DB_PORT', 5432)}/${configService.get('DB_NAME', 'ikated')}`;

          const client = postgres(connectionString, {
            ssl: false,
            max: 10,
            idle_timeout: 20,
            connect_timeout: 10,
          });

          return drizzle(client, { schema });
        } catch (error) {
          console.error('❌ Erro ao conectar com o banco de dados:', error);
          // Retorna uma instância mock para desenvolvimento
          return {
            select: () => ({ from: () => ({ where: () => Promise.resolve([]) }) }),
            insert: () => ({ values: () => Promise.resolve({}) }),
            update: () => ({ set: () => ({ where: () => Promise.resolve({}) }) }),
            delete: () => ({ where: () => Promise.resolve({}) }),
          } as any;
        }
      },
    },
  ],
  exports: [DATABASE_CONNECTION],
})
export class DatabaseModule { }