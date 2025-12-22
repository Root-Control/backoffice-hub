import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { BrandingsController } from './brandings.controller';
import { BrandingsService } from './brandings.service';
import { Branding, BrandingSchema } from './schemas/branding.schema';
import { SyncModule } from '../../shared/sync/sync.module';

@Module({
  imports: [
    MongooseModule.forFeature([
      { name: Branding.name, schema: BrandingSchema },
    ]),
    SyncModule,
  ],
  controllers: [BrandingsController],
  providers: [BrandingsService],
})
export class BrandingsModule {}

