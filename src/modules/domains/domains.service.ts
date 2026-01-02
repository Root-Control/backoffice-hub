import {
  Injectable,
  NotFoundException,
  ConflictException,
  Logger,
} from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { Domain, DomainDocument } from './schemas/domain.schema';
import { CreateDomainDto } from './dtos/create-domain.dto';
import { UpdateDomainDto } from './dtos/update-domain.dto';
import { SyncService } from '../../shared/sync/sync.service';

@Injectable()
export class DomainsService {
  private readonly logger = new Logger(DomainsService.name);

  constructor(
    @InjectModel(Domain.name) private domainModel: Model<DomainDocument>,
    private syncService: SyncService,
  ) {}

  async create(dto: CreateDomainDto): Promise<DomainDocument> {
    const existing = await this.domainModel.findOne({ host: dto.host }).exec();
    if (existing) {
      throw new ConflictException(`Domain with host ${dto.host} already exists`);
    }

    const domain = new this.domainModel({
      host: dto.host,
      tenant_id: dto.tenant_id,
      default_tenant_id: dto.default_tenant_id,
      application_id: dto.application_id,
      enabled: dto.enabled !== undefined ? dto.enabled : true,
    });

    const saved = await domain.save();

    // Sync to lambda (non-blocking)
    try {
      const lastSync = await this.syncService.syncDomain(
        saved.toObject() as any,
        'create',
      );
      saved.last_sync = lastSync;
      await saved.save();
    } catch (error) {
      this.logger.error(`Sync failed for domain ${dto.host}: ${error}`);
      // Don't fail the create operation
    }

    return saved;
  }

  async find(): Promise<DomainDocument[]> {
    return this.domainModel.find({ deleted_at: null }).exec();
  }

  async findOne(id: string): Promise<DomainDocument> {
    const domain = await this.domainModel
      .findById(id)
      .where('deleted_at')
      .equals(null)
      .exec();
    if (!domain) {
      throw new NotFoundException(`Domain with id ${id} not found`);
    }
    return domain;
  }

  async update(
    id: string,
    dto: UpdateDomainDto,
  ): Promise<DomainDocument> {
    const domain = await this.domainModel
      .findById(id)
      .where('deleted_at')
      .equals(null)
      .exec();
    if (!domain) {
      throw new NotFoundException(`Domain with id ${id} not found`);
    }

    Object.assign(domain, dto);
    const updated = await domain.save();

    // Sync to lambda (non-blocking)
    try {
      const lastSync = await this.syncService.syncDomain(
        updated.toObject() as any,
        'update',
      );
      updated.last_sync = lastSync;
      await updated.save();
    } catch (error) {
      this.logger.error(`Sync failed for domain ${id}: ${error}`);
      // Don't fail the update operation
    }

    return updated;
  }

  async delete(id: string): Promise<void> {
    const domain = await this.domainModel
      .findById(id)
      .where('deleted_at')
      .equals(null)
      .exec();
    if (!domain) {
      throw new NotFoundException(`Domain with id ${id} not found`);
    }

    domain.enabled = false;
    domain.deleted_at = new Date();
    const updated = await domain.save();

    // Sync to lambda (non-blocking)
    try {
      const lastSync = await this.syncService.syncDomain(
        updated.toObject() as any,
        'delete',
      );
      updated.last_sync = lastSync;
      await updated.save();
    } catch (error) {
      this.logger.error(`Sync failed for domain ${id}: ${error}`);
      // Don't fail the delete operation
    }
  }
}

