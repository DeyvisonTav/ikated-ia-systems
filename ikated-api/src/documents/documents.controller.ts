import { Controller, Post, UploadedFiles, UseInterceptors, UploadedFile, Get, Param } from '@nestjs/common';
import { FilesInterceptor, FileInterceptor } from '@nestjs/platform-express';
import { DocumentsService } from './documents.service';
import { DocumentAnalysisResponseDto, DocumentUploadResponseDto } from '../common/dto/document.dto';

@Controller('api/documents')
export class DocumentsController {
  constructor(private readonly documentsService: DocumentsService) {}

  @Post('analyze')
  @UseInterceptors(FilesInterceptor('documents', 10))
  async analyzeDocuments(@UploadedFiles() files: Express.Multer.File[]): Promise<DocumentAnalysisResponseDto> {
    return this.documentsService.analyzeDocuments(files);
  }

  @Post('upload')
  @UseInterceptors(FileInterceptor('file'))
  async uploadDocument(@UploadedFile() file: Express.Multer.File): Promise<DocumentUploadResponseDto> {
    return this.documentsService.uploadDocument(file);
  }

  @Get(':id')
  async getDocument(@Param('id') id: string) {
    return this.documentsService.getDocumentById(id);
  }
}