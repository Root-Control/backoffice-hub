import { Module } from '@nestjs/common';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { MongooseModule } from '@nestjs/mongoose';
import { ClientsModule } from './modules/clients/clients.module';
import { ApplicationsModule } from './modules/applications/applications.module';
import { TenantsModule } from './modules/tenants/tenants.module';
import { DomainsModule } from './modules/domains/domains.module';
import { BrandingsModule } from './modules/brandings/brandings.module';

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
    }),
    MongooseModule.forRootAsync({
      imports: [ConfigModule],
      useFactory: (configService: ConfigService) => {
        const uri = configService.get<string>('MONGODB_URI');
        const dbName = configService.get<string>('MONGODB_DB');
        if (!uri || !dbName) {
          throw new Error('MONGODB_URI and MONGODB_DB are required');
        }
        return {
          uri,
          dbName,
        };
      },
      inject: [ConfigService],
    }),
    ClientsModule,
    ApplicationsModule,
    TenantsModule,
    DomainsModule,
    BrandingsModule,
  ],
})
export class AppModule {}
