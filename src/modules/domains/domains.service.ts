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

  async create(dto: CreateDomainDto, requestId?: string): Promise<DomainDocument> {
    const existing = await this.domainModel.findOne({ host: dto.host }).exec();
    if (existing) {
      throw new ConflictException(`Domain with host ${dto.host} already exists`);
    }

    const domain = new this.domainModel({
      host: dto.host,
      tenant_id: dto.tenant_id,
      default_subtenant_id: dto.default_subtenant_id,
      client_id: dto.client_id,
      enabled: dto.enabled !== undefined ? dto.enabled : true,
    });

    const saved = await domain.save();

    try {
      const lastSync = await this.syncService.syncDomain(
        saved.toObject() as any,
        requestId,
      );
      saved.last_sync = lastSync;
      await saved.save();
    } catch (error) {
      this.logger.error(`Sync failed for domain ${dto.host}: ${error}`);
    }

    return saved;
  }

  async find(): Promise<DomainDocument[]> {
    return this.domainModel.find({ deleted_at: null }).exec();
  }

  async findOne(host: string): Promise<DomainDocument> {
    const domain = await this.domainModel
      .findOne({ host, deleted_at: null })
      .exec();
    if (!domain) {
      throw new NotFoundException(`Domain with host ${host} not found`);
    }
    return domain;
  }

  async update(
    host: string,
    dto: UpdateDomainDto,
    requestId?: string,
  ): Promise<DomainDocument> {
    const domain = await this.domainModel
      .findOne({ host, deleted_at: null })
      .exec();
    if (!domain) {
      throw new NotFoundException(`Domain with host ${host} not found`);
    }

    Object.assign(domain, dto);
    const updated = await domain.save();

    try {
      const lastSync = await this.syncService.syncDomain(
        updated.toObject() as any,
        requestId,
      );
      updated.last_sync = lastSync;
      await updated.save();
    } catch (error) {
      this.logger.error(`Sync failed for domain ${host}: ${error}`);
    }

    return updated;
  }

  async delete(host: string, requestId?: string): Promise<void> {
    const domain = await this.domainModel
      .findOne({ host, deleted_at: null })
      .exec();
    if (!domain) {
      throw new NotFoundException(`Domain with host ${host} not found`);
    }

    domain.enabled = false;
    domain.deleted_at = new Date();
    const updated = await domain.save();

    try {
      const lastSync = await this.syncService.syncDomain(
        updated.toObject() as any,
        requestId,
      );
      updated.last_sync = lastSync;
      await updated.save();
    } catch (error) {
      this.logger.error(`Sync failed for domain ${host}: ${error}`);
    }
  }
}

