import {
  Injectable,
  NotFoundException,
  ConflictException,
  Logger,
} from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model, Types } from 'mongoose';
import { Branding, BrandingDocument } from './schemas/branding.schema';
import { CreateBrandingDto } from './dtos/create-branding.dto';
import { UpdateBrandingDto } from './dtos/update-branding.dto';
import { SyncService } from '../../shared/sync/sync.service';

@Injectable()
export class BrandingsService {
  private readonly logger = new Logger(BrandingsService.name);

  constructor(
    @InjectModel(Branding.name) private brandingModel: Model<BrandingDocument>,
    private syncService: SyncService,
  ) {}

  async create(dto: CreateBrandingDto): Promise<BrandingDocument> {
    // Check if branding already exists for this subtenant
    const existing = await this.brandingModel
      .findOne({ subtenant_id: new Types.ObjectId(dto.subtenant_id), deleted_at: null })
      .exec();

    if (existing) {
      throw new ConflictException('BRANDING_ALREADY_EXISTS_FOR_SUBTENANT');
    }

    const branding = new this.brandingModel({
      subtenant_id: new Types.ObjectId(dto.subtenant_id),
      enabled: dto.enabled !== undefined ? dto.enabled : true,
    });

    const saved = await branding.save();

    // Sync to lambda (non-blocking)
    try {
      const lastSync = await this.syncService.syncBranding(
        saved.toObject() as any,
        'create',
      );
      saved.last_sync = lastSync;
      await saved.save();
    } catch (error) {
      this.logger.error(`Sync failed for branding ${saved._id}: ${error}`);
      // Don't fail the create operation
    }

    return saved;
  }

  async find(subtenantId?: string, enabled?: boolean): Promise<BrandingDocument[]> {
    const query: any = { deleted_at: null };

    if (subtenantId) {
      query.subtenant_id = new Types.ObjectId(subtenantId);
    }

    if (enabled !== undefined) {
      query.enabled = enabled;
    }

    return this.brandingModel.find(query).exec();
  }

  async findOne(id: string): Promise<BrandingDocument> {
    const branding = await this.brandingModel
      .findById(id)
      .where('deleted_at')
      .equals(null)
      .exec();
    if (!branding) {
      throw new NotFoundException(`Branding with id ${id} not found`);
    }
    return branding;
  }

  async update(
    id: string,
    dto: UpdateBrandingDto,
  ): Promise<BrandingDocument> {
    const branding = await this.brandingModel
      .findById(id)
      .where('deleted_at')
      .equals(null)
      .exec();
    if (!branding) {
      throw new NotFoundException(`Branding with id ${id} not found`);
    }

    Object.assign(branding, dto);
    const updated = await branding.save();

    // Sync to lambda (non-blocking)
    try {
      const lastSync = await this.syncService.syncBranding(
        updated.toObject() as any,
        'update',
      );
      updated.last_sync = lastSync;
      await updated.save();
    } catch (error) {
      this.logger.error(`Sync failed for branding ${id}: ${error}`);
      // Don't fail the update operation
    }

    return updated;
  }

  async delete(id: string): Promise<void> {
    const branding = await this.brandingModel
      .findById(id)
      .where('deleted_at')
      .equals(null)
      .exec();
    if (!branding) {
      throw new NotFoundException(`Branding with id ${id} not found`);
    }

    branding.enabled = false;
    branding.deleted_at = new Date();
    const updated = await branding.save();

    // Sync to lambda (non-blocking)
    try {
      const lastSync = await this.syncService.syncBranding(
        updated.toObject() as any,
        'delete',
      );
      updated.last_sync = lastSync;
      await updated.save();
    } catch (error) {
      this.logger.error(`Sync failed for branding ${id}: ${error}`);
      // Don't fail the delete operation
    }
  }
}
