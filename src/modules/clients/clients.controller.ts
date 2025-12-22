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
import { ClientsService } from './clients.service';
import { CreateClientDto } from './dtos/create-client.dto';
import { UpdateClientDto } from './dtos/update-client.dto';
import { ParseObjectIdPipe } from '../../shared/pipes/parse-object-id.pipe';

@Controller('admin/clients')
export class ClientsController {
  constructor(private readonly clientsService: ClientsService) {}

  @Post()
  async create(
    @Body() dto: CreateClientDto,
    @Headers('x-request-id') requestId?: string,
  ) {
    return this.clientsService.create(dto, requestId);
  }

  @Get()
  async find() {
    return this.clientsService.find();
  }

  @Get(':id')
  async findOne(@Param('id', ParseObjectIdPipe) id: string) {
    return this.clientsService.findOne(id);
  }

  @Patch(':id')
  async update(
    @Param('id', ParseObjectIdPipe) id: string,
    @Body() dto: UpdateClientDto,
    @Headers('x-request-id') requestId?: string,
  ) {
    return this.clientsService.update(id, dto, requestId);
  }

  @Delete(':id')
  @HttpCode(HttpStatus.NO_CONTENT)
  async delete(
    @Param('id', ParseObjectIdPipe) id: string,
    @Headers('x-request-id') requestId?: string,
  ) {
    await this.clientsService.delete(id, requestId);
  }
}

