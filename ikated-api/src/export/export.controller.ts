import { Controller, Post, Get, Param, Res, Query } from '@nestjs/common';
import { Response } from 'express';
import { ExportService } from './export.service';
import * as fs from 'fs';
import * as path from 'path';

@Controller('api/export')
export class ExportController {
  constructor(private readonly exportService: ExportService) {}

  @Post('forms/csv')
  async exportFormsToCSV(@Res() res: Response) {
    try {
      const filePath = await this.exportService.exportFormsToCSV();
      const fileName = path.basename(filePath);

      res.setHeader('Content-Type', 'text/csv');
      res.setHeader('Content-Disposition', `attachment; filename="${fileName}"`);

      const fileStream = fs.createReadStream(filePath);
      fileStream.pipe(res);

      fileStream.on('end', () => {
        fs.unlinkSync(filePath);
      });
    } catch (error) {
      res.status(500).json({ error: 'Erro ao exportar CSV' });
    }
  }

  @Post('conversations/pdf')
  async exportConversationsToPDF(@Query('conversationId') conversationId: string, @Res() res: Response) {
    try {
      const filePath = await this.exportService.exportConversationsToPDF(conversationId);
      const fileName = path.basename(filePath);

      res.setHeader('Content-Type', 'application/pdf');
      res.setHeader('Content-Disposition', `attachment; filename="${fileName}"`);

      const fileStream = fs.createReadStream(filePath);
      fileStream.pipe(res);

      fileStream.on('end', () => {
        fs.unlinkSync(filePath);
      });
    } catch (error) {
      res.status(500).json({ error: 'Erro ao exportar PDF' });
    }
  }

  @Post('documents/pdf')
  async exportDocumentsToPDF(@Res() res: Response) {
    try {
      const filePath = await this.exportService.exportDocumentsToPDF();
      const fileName = path.basename(filePath);

      res.setHeader('Content-Type', 'application/pdf');
      res.setHeader('Content-Disposition', `attachment; filename="${fileName}"`);

      const fileStream = fs.createReadStream(filePath);
      fileStream.pipe(res);

      fileStream.on('end', () => {
        fs.unlinkSync(filePath);
      });
    } catch (error) {
      res.status(500).json({ error: 'Erro ao exportar PDF de documentos' });
    }
  }
}