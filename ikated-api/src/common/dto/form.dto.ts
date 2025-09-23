import { IsString, IsOptional, IsObject, IsArray, IsUUID } from 'class-validator';

export class FormFillRequestDto {
  @IsArray()
  @IsUUID('4', { each: true })
  documentIds: string[];

  @IsOptional()
  @IsObject()
  formData?: any;
}

export class FormFillResponseDto {
  @IsObject()
  filledData: {
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

  @IsOptional()
  confidence?: number;

  @IsArray()
  @IsString({ each: true })
  usedDocuments: string[];
}