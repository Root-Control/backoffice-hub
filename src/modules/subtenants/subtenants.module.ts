import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { SubtenantsController } from './subtenants.controller';
import { SubtenantsService } from './subtenants.service';
import { Subtenant, SubtenantSchema } from './schemas/subtenant.schema';
import { SyncModule } from '../../shared/sync/sync.module';

@Module({
  imports: [
    MongooseModule.forFeature([
      { name: Subtenant.name, schema: SubtenantSchema },
    ]),
    SyncModule,
  ],
  controllers: [SubtenantsController],
  providers: [SubtenantsService],
})
export class SubtenantsModule {}

