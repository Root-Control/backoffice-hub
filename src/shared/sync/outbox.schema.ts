import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document } from 'mongoose';

export type OutboxDocument = Outbox & Document;

@Schema({ collection: 'sync_outbox', timestamps: true })
export class Outbox {
  @Prop({ required: true })
  entity_type: 'tenant' | 'application' | 'client' | 'domain' | 'branding';

  @Prop({ required: true })
  entity_key: string; // id or host

  @Prop({ required: true })
  request_id: string;

  @Prop({ type: Object, required: true })
  payload: Record<string, unknown>;

  @Prop({
    required: true,
    enum: ['PENDING', 'SENT', 'FAILED'],
    default: 'PENDING',
  })
  status: 'PENDING' | 'SENT' | 'FAILED';

  @Prop({ default: 0 })
  attempts: number;

  @Prop({ type: String })
  last_error?: string;

  @Prop({ type: Date })
  next_retry_at?: Date;
}

export const OutboxSchema = SchemaFactory.createForClass(Outbox);
OutboxSchema.index({ status: 1, next_retry_at: 1 });
OutboxSchema.index({ entity_type: 1, entity_key: 1 });

