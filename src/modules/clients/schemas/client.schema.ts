import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document } from 'mongoose';

export type ClientDocument = Client & Document;

@Schema({ collection: 'clients', timestamps: true })
export class Client {
  // _id is ObjectId by default - MongoDB handles it automatically

  @Prop({ required: true })
  name: string;

  @Prop({ required: true, default: true })
  enabled: boolean;

  @Prop({ required: true, type: [String] })
  redirect_uris: string[];

  @Prop({ type: Boolean })
  pkce_required?: boolean;

  @Prop({ type: Date })
  deleted_at?: Date;

  @Prop({
    type: {
      ok: Boolean,
      http_status: Number,
      sync_id: String,
      error_code: String,
      error_message: String,
      updated_at: Date,
      request_id: String,
    },
  })
  last_sync?: {
    ok: boolean;
    http_status: number;
    sync_id?: string;
    error_code?: string;
    error_message?: string;
    updated_at: Date;
    request_id: string;
  };
}

export const ClientSchema = SchemaFactory.createForClass(Client);
