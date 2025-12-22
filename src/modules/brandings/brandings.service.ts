import {
  Injectable,
  NotFoundException,
  Logger,
} from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
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

  async create(dto: CreateBrandingDto, requestId?: string): Promise<BrandingDocument> {
    const branding = new this.brandingModel({
      scope: dto.scope,
      tenant_id: dto.tenant_id,
      subtenant_id: dto.subtenant_id,
      enabled: dto.enabled !== undefined ? dto.enabled : true,
    });

    const saved = await branding.save();

    try {
      const lastSync = await this.syncService.syncBranding(
        saved.toObject() as any,
        requestId,
      );
      saved.last_sync = lastSync;
      await saved.save();
    } catch (error) {
      this.logger.error(`Sync failed for branding ${saved._id}: ${error}`);
    }

    return saved;
  }

  async find(): Promise<BrandingDocument[]> {
    return this.brandingModel.find({ deleted_at: null }).exec();
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
    requestId?: string,
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

    try {
      const lastSync = await this.syncService.syncBranding(
        updated.toObject() as any,
        requestId,
      );
      updated.last_sync = lastSync;
      await updated.save();
    } catch (error) {
      this.logger.error(`Sync failed for branding ${id}: ${error}`);
    }

    return updated;
  }

  async delete(id: string, requestId?: string): Promise<void> {
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

    try {
      const lastSync = await this.syncService.syncBranding(
        updated.toObject() as any,
        requestId,
      );
      updated.last_sync = lastSync;
      await updated.save();
    } catch (error) {
      this.logger.error(`Sync failed for branding ${id}: ${error}`);
    }
  }
}

