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
import { DomainsService } from './domains.service';
import { CreateDomainDto } from './dtos/create-domain.dto';
import { UpdateDomainDto } from './dtos/update-domain.dto';

@Controller('admin/domains')
export class DomainsController {
  constructor(private readonly domainsService: DomainsService) {}

  @Post()
  async create(
    @Body() dto: CreateDomainDto,
    @Headers('x-request-id') requestId?: string,
  ) {
    return this.domainsService.create(dto, requestId);
  }

  @Get()
  async find() {
    return this.domainsService.find();
  }

  @Get(':host')
  async findOne(@Param('host') host: string) {
    return this.domainsService.findOne(host);
  }

  @Patch(':host')
  async update(
    @Param('host') host: string,
    @Body() dto: UpdateDomainDto,
    @Headers('x-request-id') requestId?: string,
  ) {
    return this.domainsService.update(host, dto, requestId);
  }

  @Delete(':host')
  @HttpCode(HttpStatus.NO_CONTENT)
  async delete(
    @Param('host') host: string,
    @Headers('x-request-id') requestId?: string,
  ) {
    await this.domainsService.delete(host, requestId);
  }
}

