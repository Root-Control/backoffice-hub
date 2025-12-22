import {
  Injectable,
  NotFoundException,
  Logger,
} from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { Client, ClientDocument } from './schemas/client.schema';
import { CreateClientDto } from './dtos/create-client.dto';
import { UpdateClientDto } from './dtos/update-client.dto';
import { SyncService } from '../../shared/sync/sync.service';

@Injectable()
export class ClientsService {
  private readonly logger = new Logger(ClientsService.name);

  constructor(
    @InjectModel(Client.name) private clientModel: Model<ClientDocument>,
    private syncService: SyncService,
  ) {}

  async create(dto: CreateClientDto, requestId?: string): Promise<ClientDocument> {
    const client = new this.clientModel({
      name: dto.name,
      enabled: dto.enabled !== undefined ? dto.enabled : true,
      redirect_uris: dto.redirect_uris,
      pkce_required: dto.pkce_required,
    });

    const saved = await client.save();

    try {
      const lastSync = await this.syncService.syncClient(
        saved.toObject() as any,
        requestId,
      );
      saved.last_sync = lastSync;
      await saved.save();
    } catch (error) {
      this.logger.error(`Sync failed for client ${saved._id}: ${error}`);
    }

    return saved;
  }

  async find(): Promise<ClientDocument[]> {
    return this.clientModel.find({ deleted_at: null }).exec();
  }

  async findOne(id: string): Promise<ClientDocument> {
    const client = await this.clientModel
      .findById(id)
      .where('deleted_at')
      .equals(null)
      .exec();
    if (!client) {
      throw new NotFoundException(`Client with id ${id} not found`);
    }
    return client;
  }

  async update(
    id: string,
    dto: UpdateClientDto,
    requestId?: string,
  ): Promise<ClientDocument> {
    const client = await this.clientModel
      .findById(id)
      .where('deleted_at')
      .equals(null)
      .exec();
    if (!client) {
      throw new NotFoundException(`Client with id ${id} not found`);
    }

    Object.assign(client, dto);
    const updated = await client.save();

    try {
      const lastSync = await this.syncService.syncClient(
        updated.toObject() as any,
        requestId,
      );
      updated.last_sync = lastSync;
      await updated.save();
    } catch (error) {
      this.logger.error(`Sync failed for client ${id}: ${error}`);
    }

    return updated;
  }

  async delete(id: string, requestId?: string): Promise<void> {
    const client = await this.clientModel
      .findById(id)
      .where('deleted_at')
      .equals(null)
      .exec();
    if (!client) {
      throw new NotFoundException(`Client with id ${id} not found`);
    }

    client.enabled = false;
    client.deleted_at = new Date();
    const updated = await client.save();

    try {
      const lastSync = await this.syncService.syncClient(
        updated.toObject() as any,
        requestId,
      );
      updated.last_sync = lastSync;
      await updated.save();
    } catch (error) {
      this.logger.error(`Sync failed for client ${id}: ${error}`);
    }
  }
}

