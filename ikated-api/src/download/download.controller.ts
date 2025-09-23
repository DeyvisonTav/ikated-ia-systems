import { Controller, Get, Param, Res, NotFoundException } from '@nestjs/common';
import { Response } from 'express';
import { RedisService } from '../redis/redis.service';
import * as fs from 'fs';
import * as path from 'path';

@Controller('api/download')
export class DownloadController {
  constructor(private readonly redisService: RedisService) {}

  @Get(':key')
  async downloadFile(@Param('key') key: string, @Res() res: Response) {
    try {
      // Busca informações do arquivo no Redis
      const fileInfo = await this.redisService.getJson<{
        filePath: string;
        filename: string;
        type: string;
        generatedAt: string;
        recordCount: number;
      }>(`download:${key}`);

      if (!fileInfo) {
        throw new NotFoundException('Arquivo não encontrado ou expirado');
      }

      // Verifica se o arquivo existe no sistema de arquivos
      if (!fs.existsSync(fileInfo.filePath)) {
        throw new NotFoundException('Arquivo não encontrado no sistema');
      }

      // Define o tipo de conteúdo baseado no tipo do arquivo
      const contentType = fileInfo.type === 'csv' ? 'text/csv' : 'application/octet-stream';

      // Configura headers para download
      res.setHeader('Content-Type', contentType);
      res.setHeader('Content-Disposition', `attachment; filename="${fileInfo.filename}"`);
      res.setHeader('X-Generated-At', fileInfo.generatedAt);
      res.setHeader('X-Record-Count', fileInfo.recordCount.toString());

      // Envia o arquivo
      const fileStream = fs.createReadStream(fileInfo.filePath);
      fileStream.pipe(res);

      // Remove o arquivo após o download
      fileStream.on('end', () => {
        try {
          fs.unlinkSync(fileInfo.filePath);
          // Remove a entrada do Redis
          this.redisService.del(`download:${key}`);
        } catch (error) {
          console.error('Erro ao limpar arquivo temporário:', error);
        }
      });

    } catch (error) {
      if (error instanceof NotFoundException) {
        throw error;
      }

      console.error('Erro no download:', error);
      res.status(500).json({
        error: 'Erro interno do servidor',
        message: 'Falha ao processar download'
      });
    }
  }

  @Get('info/:key')
  async getFileInfo(@Param('key') key: string) {
    try {
      const fileInfo = await this.redisService.getJson<{
        filePath: string;
        filename: string;
        type: string;
        generatedAt: string;
        recordCount: number;
      }>(`download:${key}`);

      if (!fileInfo) {
        throw new NotFoundException('Arquivo não encontrado ou expirado');
      }

      return {
        filename: fileInfo.filename,
        type: fileInfo.type,
        generatedAt: fileInfo.generatedAt,
        recordCount: fileInfo.recordCount,
        downloadUrl: `/api/download/${key}`,
      };
    } catch (error) {
      if (error instanceof NotFoundException) {
        throw error;
      }

      throw new NotFoundException('Erro ao buscar informações do arquivo');
    }
  }
}