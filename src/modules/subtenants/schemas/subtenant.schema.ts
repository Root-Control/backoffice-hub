import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document } from 'mongoose';

export type SubtenantDocument = Subtenant & Document;

@Schema({ collection: 'subtenants', timestamps: true })
export class Subtenant {
  // _id is ObjectId by default - MongoDB handles it automatically

  @Prop({ required: true })
  tenant_id: string;

  @Prop({ required: true })
  name: string;

  @Prop({ required: true, default: true })
  enabled: boolean;

  @Prop({ required: true })
  logo: string;

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

export const SubtenantSchema = SchemaFactory.createForClass(Subtenant);
SubtenantSchema.index({ tenant_id: 1 });
