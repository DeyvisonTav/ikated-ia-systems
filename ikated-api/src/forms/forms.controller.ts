import { Controller, Post, Body, Get, Param, Query } from '@nestjs/common';
import { FormsService } from './forms.service';
import { FormFillRequestDto, FormFillResponseDto } from '../common/dto/form.dto';

@Controller('api/forms')
export class FormsController {
  constructor(private readonly formsService: FormsService) {}

  @Post('fill-with-ai')
  async fillWithAI(@Body() body: FormFillRequestDto): Promise<FormFillResponseDto> {
    return this.formsService.fillFormWithAI(body);
  }

  @Get(':id')
  async getForm(@Param('id') id: string) {
    return this.formsService.getFormById(id);
  }

  @Get()
  async getAllForms(@Query('userId') userId?: string) {
    return this.formsService.getAllForms(userId);
  }
}