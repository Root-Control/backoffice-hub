import { Injectable, NotFoundException, Logger } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { Tenant, TenantDocument } from './schemas/tenant.schema';
import { CreateTenantDto } from './dtos/create-tenant.dto';
import { UpdateTenantDto } from './dtos/update-tenant.dto';
import { SyncService } from '../../shared/sync/sync.service';

@Injectable()
export class TenantsService {
  private readonly logger = new Logger(TenantsService.name);

  constructor(
    @InjectModel(Tenant.name) private tenantModel: Model<TenantDocument>,
    private syncService: SyncService,
  ) {}

  async create(
    dto: CreateTenantDto,
    requestId?: string,
  ): Promise<TenantDocument> {
    const tenant = new this.tenantModel({
      name: dto.name,
      enabled: dto.enabled !== undefined ? dto.enabled : true,
      password_check_endpoint: dto.password_check_endpoint,
      user_migrated_endpoint: dto.user_migrated_endpoint,
      slug: dto.slug,
    });

    const saved = await tenant.save();

    // Sync to lambda (non-blocking)
    try {
      const lastSync = await this.syncService.syncTenant(
        saved.toObject() as any,
        requestId,
      );
      saved.last_sync = lastSync;
      await saved.save();
    } catch (error) {
      this.logger.error(`Sync failed for tenant ${saved._id}: ${error}`);
      // Don't fail the create operation
    }

    return saved;
  }

  async find(): Promise<TenantDocument[]> {
    return this.tenantModel.find({ deleted_at: null }).exec();
  }

  async findOne(id: string): Promise<TenantDocument> {
    const tenant = await this.tenantModel
      .findById(id)
      .where('deleted_at')
      .equals(null)
      .exec();
    if (!tenant) {
      throw new NotFoundException(`Tenant with id ${id} not found`);
    }
    return tenant;
  }

  async update(
    id: string,
    dto: UpdateTenantDto,
    requestId?: string,
  ): Promise<TenantDocument> {
    const tenant = await this.tenantModel
      .findById(id)
      .where('deleted_at')
      .equals(null)
      .exec();
    if (!tenant) {
      throw new NotFoundException(`Tenant with id ${id} not found`);
    }

    Object.assign(tenant, dto);
    const updated = await tenant.save();

    // Sync to lambda (non-blocking)
    try {
      const lastSync = await this.syncService.syncTenant(
        updated.toObject() as any,
        requestId,
      );
      updated.last_sync = lastSync;
      await updated.save();
    } catch (error) {
      this.logger.error(`Sync failed for tenant ${id}: ${error}`);
      // Don't fail the update operation
    }

    return updated;
  }

  async delete(id: string, requestId?: string): Promise<void> {
    const tenant = await this.tenantModel
      .findById(id)
      .where('deleted_at')
      .equals(null)
      .exec();
    if (!tenant) {
      throw new NotFoundException(`Tenant with id ${id} not found`);
    }

    // Soft delete
    tenant.enabled = false;
    tenant.deleted_at = new Date();
    const updated = await tenant.save();

    // Sync to lambda (non-blocking)
    try {
      const lastSync = await this.syncService.syncTenant(
        updated.toObject() as any,
        requestId,
      );
      updated.last_sync = lastSync;
      await updated.save();
    } catch (error) {
      this.logger.error(`Sync failed for tenant ${id}: ${error}`);
      // Don't fail the delete operation
    }
  }
}
