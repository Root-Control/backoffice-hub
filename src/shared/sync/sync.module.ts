import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { HubLambdaClient } from '../hub-lambda-client/hub-lambda-client';
import { SyncService } from './sync.service';
import { OutboxService } from './outbox.service';
import { Outbox, OutboxSchema } from './outbox.schema';

@Module({
  imports: [
    MongooseModule.forFeature([{ name: Outbox.name, schema: OutboxSchema }]),
  ],
  providers: [HubLambdaClient, SyncService, OutboxService],
  exports: [SyncService, OutboxService],
})
export class SyncModule {}

