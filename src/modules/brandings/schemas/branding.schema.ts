import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document, Types } from 'mongoose';

export type BrandingDocument = Branding & Document;

@Schema({
  collection: 'brandings',
  timestamps: { createdAt: 'created_at', updatedAt: 'updated_at' },
})
export class Branding {
  // _id is ObjectId by default - MongoDB handles it automatically

  @Prop({
    required: true,
    type: Types.ObjectId,
    ref: 'Tenant',
    unique: true,
  })
  tenant_id: Types.ObjectId;

  @Prop({ required: true, default: true })
  enabled: boolean;

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

export const BrandingSchema = SchemaFactory.createForClass(Branding);
BrandingSchema.index({ tenant_id: 1 }, { unique: true });
BrandingSchema.index({ enabled: 1 });
