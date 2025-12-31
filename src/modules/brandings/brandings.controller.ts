import {
  Controller,
  Get,
  Post,
  Patch,
  Delete,
  Body,
  Param,
  Query,
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
  async create(@Body() dto: CreateBrandingDto) {
    return this.brandingsService.create(dto);
  }

  @Get()
  async find(
    @Query('subtenant_id') subtenantId?: string,
    @Query('enabled') enabled?: string,
  ) {
    const enabledBool =
      enabled === 'true' ? true : enabled === 'false' ? false : undefined;
    return this.brandingsService.find(subtenantId, enabledBool);
  }

  @Get(':id')
  async findOne(@Param('id', ParseObjectIdPipe) id: string) {
    return this.brandingsService.findOne(id);
  }

  @Patch(':id')
  async update(
    @Param('id', ParseObjectIdPipe) id: string,
    @Body() dto: UpdateBrandingDto,
  ) {
    return this.brandingsService.update(id, dto);
  }

  @Delete(':id')
  @HttpCode(HttpStatus.NO_CONTENT)
  async delete(@Param('id', ParseObjectIdPipe) id: string) {
    await this.brandingsService.delete(id);
  }
}
