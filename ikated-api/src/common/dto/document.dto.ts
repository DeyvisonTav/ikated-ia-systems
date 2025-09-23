import { IsString, IsOptional, IsNumber, IsObject } from 'class-validator';

export class DocumentAnalysisResponseDto {
  @IsObject()
  extractedData: {
    nomeCompleto?: string;
    cpf?: string;
    rg?: string;
    dataNascimento?: string;
    email?: string;
    telefone?: string;
    cep?: string;
    endereco?: string;
    numero?: string;
    bairro?: string;
    cidade?: string;
    estado?: string;
  };

  @IsNumber()
  confidence: number;

  @IsString({ each: true })
  processedFiles: string[];
}

export class DocumentUploadResponseDto {
  @IsString()
  fileId: string;

  @IsString()
  filename: string;

  @IsString()
  uploadedAt: string;
}