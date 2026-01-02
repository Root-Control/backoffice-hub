import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { TenantsController } from './tenants.controller';
import { TenantsService } from './tenants.service';
import { Tenant, TenantSchema } from './schemas/tenant.schema';
import { SyncModule } from '../../shared/sync/sync.module';

@Module({
  imports: [
    MongooseModule.forFeature([
      { name: Tenant.name, schema: TenantSchema },
    ]),
    SyncModule,
  ],
  controllers: [TenantsController],
  providers: [TenantsService],
})
export class TenantsModule {}
