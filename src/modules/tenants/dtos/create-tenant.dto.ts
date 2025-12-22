import { IsString, IsBoolean, IsOptional } from 'class-validator';

export class CreateTenantDto {
  @IsString()
  name: string;

  @IsOptional()
  @IsBoolean()
  enabled?: boolean; // default: true

  @IsString()
  password_check_endpoint: string;

  @IsString()
  user_migrated_endpoint: string;

  @IsString()
  slug: string;
}
