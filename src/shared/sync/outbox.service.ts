import { Injectable, Logger } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { Outbox, OutboxDocument } from './outbox.schema';
import { HubLambdaClient } from '../hub-lambda-client/hub-lambda-client';

@Injectable()
export class OutboxService {
  private readonly logger = new Logger(OutboxService.name);

  constructor(
    @InjectModel(Outbox.name) private outboxModel: Model<OutboxDocument>,
    private hubLambdaClient: HubLambdaClient,
  ) {}

  /**
   * Enqueue a sync event to outbox
   */
  async enqueue(
    entityType: Outbox['entity_type'],
    entityKey: string,
    requestId: string,
    payload: Record<string, unknown>,
    error?: string,
  ): Promise<void> {
    await this.outboxModel.create({
      entity_type: entityType,
      entity_key: entityKey,
      request_id: requestId,
      payload,
      status: error ? 'FAILED' : 'PENDING',
      attempts: 0,
      last_error: error,
      next_retry_at: new Date(),
    });
  }

  /**
   * Process pending outbox items (simple retry loop for dev)
   */
  async processPending(): Promise<void> {
    const pending = await this.outboxModel
      .find({
        status: { $in: ['PENDING', 'FAILED'] },
        $or: [
          { next_retry_at: { $exists: false } },
          { next_retry_at: { $lte: new Date() } },
        ],
      })
      .limit(10)
      .exec();

    for (const item of pending) {
      try {
        await this.processItem(item);
      } catch (error) {
        this.logger.error(
          `Failed to process outbox item ${item._id}: ${error}`,
        );
      }
    }
  }

  private async processItem(item: OutboxDocument): Promise<void> {
    const maxAttempts = 5;
    if (item.attempts >= maxAttempts) {
      item.status = 'FAILED';
      item.last_error = 'Max attempts reached';
      await item.save();
      return;
    }

    item.attempts += 1;
    const delay = Math.min(1000 * Math.pow(2, item.attempts - 1), 30000); // Exponential backoff, max 30s
    item.next_retry_at = new Date(Date.now() + delay);

    try {
      const response = await this.callLambda(item.entity_type, item.payload);

      if (response.ok) {
        item.status = 'SENT';
        item.last_error = undefined;
        await item.save();
        this.logger.log(
          `Outbox item ${item._id} processed successfully after ${item.attempts} attempts`,
        );
      } else {
        item.status = 'FAILED';
        item.last_error = response.error?.message || 'Unknown error';
        await item.save();
      }
    } catch (error) {
      item.status = 'FAILED';
      item.last_error =
        error instanceof Error ? error.message : 'Unknown error';
      await item.save();
    }
  }

  private async callLambda(
    entityType: Outbox['entity_type'],
    payload: Record<string, unknown>,
  ) {
    switch (entityType) {
      case 'tenant':
        return this.hubLambdaClient.upsertTenant(
          payload as unknown as Parameters<
            typeof this.hubLambdaClient.upsertTenant
          >[0],
        );
      case 'application':
        return this.hubLambdaClient.upsertApplication(
          payload as unknown as Parameters<
            typeof this.hubLambdaClient.upsertApplication
          >[0],
        );
      case 'client':
        return this.hubLambdaClient.upsertClient(
          payload as unknown as Parameters<
            typeof this.hubLambdaClient.upsertClient
          >[0],
        );
      case 'domain':
        return this.hubLambdaClient.upsertDomain(
          payload as unknown as Parameters<
            typeof this.hubLambdaClient.upsertDomain
          >[0],
        );
      case 'branding':
        return this.hubLambdaClient.upsertBranding(
          payload as unknown as Parameters<
            typeof this.hubLambdaClient.upsertBranding
          >[0],
        );
      default:
        throw new Error(`Unknown entity type: ${entityType}`);
    }
  }
}
