import {
  Controller,
  Get,
  Post,
  Patch,
  Delete,
  Body,
  Param,
  HttpCode,
  HttpStatus,
} from '@nestjs/common';
import { DomainsService } from './domains.service';
import { CreateDomainDto } from './dtos/create-domain.dto';
import { UpdateDomainDto } from './dtos/update-domain.dto';
import { ParseObjectIdPipe } from '../../shared/pipes/parse-object-id.pipe';

@Controller('admin/domains')
export class DomainsController {
  constructor(private readonly domainsService: DomainsService) {}

  @Post()
  async create(@Body() dto: CreateDomainDto) {
    return this.domainsService.create(dto);
  }

  @Get()
  async find() {
    return this.domainsService.find();
  }

  @Get(':id')
  async findOne(@Param('id', ParseObjectIdPipe) id: string) {
    return this.domainsService.findOne(id);
  }

  @Patch(':id')
  async update(
    @Param('id', ParseObjectIdPipe) id: string,
    @Body() dto: UpdateDomainDto,
  ) {
    return this.domainsService.update(id, dto);
  }

  @Delete(':id')
  @HttpCode(HttpStatus.NO_CONTENT)
  async delete(@Param('id', ParseObjectIdPipe) id: string) {
    await this.domainsService.delete(id);
  }
}

