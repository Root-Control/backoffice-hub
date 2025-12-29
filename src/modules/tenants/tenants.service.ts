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

  async create(dto: CreateTenantDto): Promise<TenantDocument> {
    const tenant = new this.tenantModel({
      name: dto.name,
      enabled: dto.enabled !== undefined ? dto.enabled : true,
      password_check_endpoint: dto.password_check_endpoint,
      user_migrated_endpoint: dto.user_migrated_endpoint,
      lookup_email_endpoint: dto.lookup_email_endpoint,
      forgot_password_endpoint: dto.forgot_password_endpoint,
      slug: dto.slug,
      logo: dto.logo,
      allow_auto_link:
        dto.allow_auto_link !== undefined ? dto.allow_auto_link : true,
    });

    const saved = await tenant.save();

    // Sync to lambda (non-blocking)
    try {
      const lastSync = await this.syncService.syncTenant(
        saved.toObject() as any,
        'create',
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
        'update',
      );
      updated.last_sync = lastSync;
      await updated.save();
    } catch (error) {
      this.logger.error(`Sync failed for tenant ${id}: ${error}`);
      // Don't fail the update operation
    }

    return updated;
  }

  async delete(id: string): Promise<void> {
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
        'delete',
      );
      updated.last_sync = lastSync;
      await updated.save();
    } catch (error) {
      this.logger.error(`Sync failed for tenant ${id}: ${error}`);
      // Don't fail the delete operation
    }
  }
}
