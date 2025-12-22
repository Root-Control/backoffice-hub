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
import { TenantsService } from './tenants.service';
import { CreateTenantDto } from './dtos/create-tenant.dto';
import { UpdateTenantDto } from './dtos/update-tenant.dto';
import { ParseObjectIdPipe } from '../../shared/pipes/parse-object-id.pipe';

@Controller('admin/tenants')
export class TenantsController {
  constructor(private readonly tenantsService: TenantsService) {}

  @Post()
  async create(
    @Body() dto: CreateTenantDto,
    @Headers('x-request-id') requestId?: string,
  ) {
    return this.tenantsService.create(dto, requestId);
  }

  @Get()
  async find() {
    return this.tenantsService.find();
  }

  @Get(':id')
  async findOne(@Param('id', ParseObjectIdPipe) id: string) {
    return this.tenantsService.findOne(id);
  }

  @Patch(':id')
  async update(
    @Param('id', ParseObjectIdPipe) id: string,
    @Body() dto: UpdateTenantDto,
    @Headers('x-request-id') requestId?: string,
  ) {
    return this.tenantsService.update(id, dto, requestId);
  }

  @Delete(':id')
  @HttpCode(HttpStatus.NO_CONTENT)
  async delete(
    @Param('id', ParseObjectIdPipe) id: string,
    @Headers('x-request-id') requestId?: string,
  ) {
    await this.tenantsService.delete(id, requestId);
  }
}
