import {
  Injectable,
  NotFoundException,
  Logger,
} from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { Application, ApplicationDocument } from './schemas/application.schema';
import { CreateApplicationDto } from './dtos/create-application.dto';
import { UpdateApplicationDto } from './dtos/update-application.dto';
import { SyncService } from '../../shared/sync/sync.service';

@Injectable()
export class ApplicationsService {
  private readonly logger = new Logger(ApplicationsService.name);

  constructor(
    @InjectModel(Application.name) private applicationModel: Model<ApplicationDocument>,
    private syncService: SyncService,
  ) {}

  async create(dto: CreateApplicationDto): Promise<ApplicationDocument> {
    const application = new this.applicationModel({
      name: dto.name,
      enabled: dto.enabled !== undefined ? dto.enabled : true,
      redirect_uris: dto.redirect_uris,
      pkce_required: dto.pkce_required,
    });

    const saved = await application.save();

    // Sync to lambda (non-blocking)
    try {
      const lastSync = await this.syncService.syncApplication(
        saved.toObject() as any,
        'create',
      );
      saved.last_sync = lastSync;
      await saved.save();
    } catch (error) {
      this.logger.error(`Sync failed for application ${saved._id}: ${error}`);
      // Don't fail the create operation
    }

    return saved;
  }

  async find(): Promise<ApplicationDocument[]> {
    return this.applicationModel.find({ deleted_at: null }).exec();
  }

  async findOne(id: string): Promise<ApplicationDocument> {
    const application = await this.applicationModel
      .findById(id)
      .where('deleted_at')
      .equals(null)
      .exec();
    if (!application) {
      throw new NotFoundException(`Application with id ${id} not found`);
    }
    return application;
  }

  async update(
    id: string,
    dto: UpdateApplicationDto,
  ): Promise<ApplicationDocument> {
    const application = await this.applicationModel
      .findById(id)
      .where('deleted_at')
      .equals(null)
      .exec();
    if (!application) {
      throw new NotFoundException(`Application with id ${id} not found`);
    }

    Object.assign(application, dto);
    const updated = await application.save();

    // Sync to lambda (non-blocking)
    try {
      const lastSync = await this.syncService.syncApplication(
        updated.toObject() as any,
        'update',
      );
      updated.last_sync = lastSync;
      await updated.save();
    } catch (error) {
      this.logger.error(`Sync failed for application ${id}: ${error}`);
      // Don't fail the update operation
    }

    return updated;
  }

  async delete(id: string): Promise<void> {
    const application = await this.applicationModel
      .findById(id)
      .where('deleted_at')
      .equals(null)
      .exec();
    if (!application) {
      throw new NotFoundException(`Application with id ${id} not found`);
    }

    application.enabled = false;
    application.deleted_at = new Date();
    const updated = await application.save();

    // Sync to lambda (non-blocking)
    try {
      const lastSync = await this.syncService.syncApplication(
        updated.toObject() as any,
        'delete',
      );
      updated.last_sync = lastSync;
      await updated.save();
    } catch (error) {
      this.logger.error(`Sync failed for application ${id}: ${error}`);
      // Don't fail the delete operation
    }
  }
}

