import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { DomainsController } from './domains.controller';
import { DomainsService } from './domains.service';
import { Domain, DomainSchema } from './schemas/domain.schema';
import { SyncModule } from '../../shared/sync/sync.module';

@Module({
  imports: [
    MongooseModule.forFeature([{ name: Domain.name, schema: DomainSchema }]),
    SyncModule,
  ],
  controllers: [DomainsController],
  providers: [DomainsService],
})
export class DomainsModule {}

