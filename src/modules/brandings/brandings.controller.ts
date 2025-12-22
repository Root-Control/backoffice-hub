import {
  Controller,
  Get,
  Post,
  Patch,
  Delete,
  Body,
  Param,
  Headers,
  HttpCode,
  HttpStatus,
} from '@nestjs/common';
import { BrandingsService } from './brandings.service';
import { CreateBrandingDto } from './dtos/create-branding.dto';
import { UpdateBrandingDto } from './dtos/update-branding.dto';
import { ParseObjectIdPipe } from '../../shared/pipes/parse-object-id.pipe';

@Controller('admin/brandings')
export class BrandingsController {
  constructor(private readonly brandingsService: BrandingsService) {}

  @Post()
  async create(
    @Body() dto: CreateBrandingDto,
    @Headers('x-request-id') requestId?: string,
  ) {
    return this.brandingsService.create(dto, requestId);
  }

  @Get()
  async find() {
    return this.brandingsService.find();
  }

  @Get(':id')
  async findOne(@Param('id', ParseObjectIdPipe) id: string) {
    return this.brandingsService.findOne(id);
  }

  @Patch(':id')
  async update(
    @Param('id', ParseObjectIdPipe) id: string,
    @Body() dto: UpdateBrandingDto,
    @Headers('x-request-id') requestId?: string,
  ) {
    return this.brandingsService.update(id, dto, requestId);
  }

  @Delete(':id')
  @HttpCode(HttpStatus.NO_CONTENT)
  async delete(
    @Param('id', ParseObjectIdPipe) id: string,
    @Headers('x-request-id') requestId?: string,
  ) {
    await this.brandingsService.delete(id, requestId);
  }
}
