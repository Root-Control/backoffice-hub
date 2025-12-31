import {
  Injectable,
  NotFoundException,
  Logger,
} from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { Subtenant, SubtenantDocument } from './schemas/subtenant.schema';
import { CreateSubtenantDto } from './dtos/create-subtenant.dto';
import { UpdateSubtenantDto } from './dtos/update-subtenant.dto';
import { SyncService } from '../../shared/sync/sync.service';

@Injectable()
export class SubtenantsService {
  private readonly logger = new Logger(SubtenantsService.name);

  constructor(
    @InjectModel(Subtenant.name) private subtenantModel: Model<SubtenantDocument>,
    private syncService: SyncService,
  ) {}

  async create(dto: CreateSubtenantDto): Promise<SubtenantDocument> {
    const subtenant = new this.subtenantModel({
      tenant_id: dto.tenant_id,
      name: dto.name,
      enabled: dto.enabled !== undefined ? dto.enabled : true,
      logo: dto.logo,
    });

    const saved = await subtenant.save();

    // Sync to lambda (non-blocking)
    try {
      const lastSync = await this.syncService.syncSubtenant(
        saved.toObject() as any,
        'create',
      );
      saved.last_sync = lastSync;
      await saved.save();
    } catch (error) {
      this.logger.error(`Sync failed for subtenant ${saved._id}: ${error}`);
      // Don't fail the create operation
    }

    return saved;
  }

  async find(): Promise<SubtenantDocument[]> {
    return this.subtenantModel.find({ deleted_at: null }).exec();
  }

  async findOne(id: string): Promise<SubtenantDocument> {
    const subtenant = await this.subtenantModel
      .findById(id)
      .where('deleted_at')
      .equals(null)
      .exec();
    if (!subtenant) {
      throw new NotFoundException(`Subtenant with id ${id} not found`);
    }
    return subtenant;
  }

  async update(
    id: string,
    dto: UpdateSubtenantDto,
  ): Promise<SubtenantDocument> {
    const subtenant = await this.subtenantModel
      .findById(id)
      .where('deleted_at')
      .equals(null)
      .exec();
    if (!subtenant) {
      throw new NotFoundException(`Subtenant with id ${id} not found`);
    }

    Object.assign(subtenant, dto);
    const updated = await subtenant.save();

    // Sync to lambda (non-blocking)
    try {
      const lastSync = await this.syncService.syncSubtenant(
        updated.toObject() as any,
        'update',
      );
      updated.last_sync = lastSync;
      await updated.save();
    } catch (error) {
      this.logger.error(`Sync failed for subtenant ${id}: ${error}`);
      // Don't fail the update operation
    }

    return updated;
  }

  async delete(id: string): Promise<void> {
    const subtenant = await this.subtenantModel
      .findById(id)
      .where('deleted_at')
      .equals(null)
      .exec();
    if (!subtenant) {
      throw new NotFoundException(`Subtenant with id ${id} not found`);
    }

    subtenant.enabled = false;
    subtenant.deleted_at = new Date();
    const updated = await subtenant.save();

    // Sync to lambda (non-blocking)
    try {
      const lastSync = await this.syncService.syncSubtenant(
        updated.toObject() as any,
        'delete',
      );
      updated.last_sync = lastSync;
      await updated.save();
    } catch (error) {
      this.logger.error(`Sync failed for subtenant ${id}: ${error}`);
      // Don't fail the delete operation
    }
  }
}

