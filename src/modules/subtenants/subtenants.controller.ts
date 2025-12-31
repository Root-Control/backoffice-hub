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
import { SubtenantsService } from './subtenants.service';
import { CreateSubtenantDto } from './dtos/create-subtenant.dto';
import { UpdateSubtenantDto } from './dtos/update-subtenant.dto';
import { ParseObjectIdPipe } from '../../shared/pipes/parse-object-id.pipe';

@Controller('admin/subtenants')
export class SubtenantsController {
  constructor(private readonly subtenantsService: SubtenantsService) {}

  @Post()
  async create(@Body() dto: CreateSubtenantDto) {
    return this.subtenantsService.create(dto);
  }

  @Get()
  async find() {
    return this.subtenantsService.find();
  }

  @Get(':id')
  async findOne(@Param('id', ParseObjectIdPipe) id: string) {
    return this.subtenantsService.findOne(id);
  }

  @Patch(':id')
  async update(
    @Param('id', ParseObjectIdPipe) id: string,
    @Body() dto: UpdateSubtenantDto,
  ) {
    return this.subtenantsService.update(id, dto);
  }

  @Delete(':id')
  @HttpCode(HttpStatus.NO_CONTENT)
  async delete(@Param('id', ParseObjectIdPipe) id: string) {
    await this.subtenantsService.delete(id);
  }
}

