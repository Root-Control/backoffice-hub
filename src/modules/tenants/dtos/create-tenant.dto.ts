import { IsString, IsBoolean, IsOptional } from 'class-validator';

export class CreateTenantDto {
  @IsString()
  client_id: string;

  @IsString()
  name: string;

  @IsOptional()
  @IsBoolean()
  enabled?: boolean;

  @IsString()
  logo: string;
}
