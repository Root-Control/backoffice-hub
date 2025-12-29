import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document, Types } from 'mongoose';

export type TenantDocument = Tenant & Document;

@Schema({ collection: 'tenants', timestamps: true })
export class Tenant {
  // _id is ObjectId by default - MongoDB handles it automatically

  @Prop({ required: true })
  name: string;

  @Prop({ required: true, default: true })
  enabled: boolean;

  @Prop({ required: true })
  password_check_endpoint: string;

  @Prop({ required: true })
  user_migrated_endpoint: string;

  @Prop({ required: true })
  lookup_email_endpoint: string;

  @Prop({ required: true })
  forgot_password_endpoint: string;

  @Prop({ required: true })
  slug: string;

  @Prop({ required: true })
  logo: string;

  @Prop({ required: true, default: true })
  allow_auto_link: boolean;

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

export const TenantSchema = SchemaFactory.createForClass(Tenant);
