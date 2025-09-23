import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { DatabaseModule } from './database/database.module';
import { RedisModule } from './redis/redis.module';
import { AIModule } from './ai/ai.module';
import { ChatModule } from './chat/chat.module';
import { DocumentsModule } from './documents/documents.module';
import { FormsModule } from './forms/forms.module';
import { ExportModule } from './export/export.module';
import { DownloadModule } from './download/download.module';
import { SeederService } from './database/seeder.service';

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
      envFilePath: '.env',
    }),
    DatabaseModule,
    RedisModule,
    AIModule,
    ChatModule,
    DocumentsModule,
    FormsModule,
    ExportModule,
    DownloadModule,
  ],
  providers: [SeederService],
})
export class AppModule {}
