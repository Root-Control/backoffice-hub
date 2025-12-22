import { IsString, IsBoolean, IsOptional } from 'class-validator';

export class UpdateTenantDto {
  @IsOptional()
  @IsString()
  name?: string;

  @IsOptional()
  @IsBoolean()
  enabled?: boolean;

  @IsOptional()
  @IsString()
  password_check_endpoint?: string;

  @IsOptional()
  @IsString()
  user_migrated_endpoint?: string;

  @IsOptional()
  @IsString()
  slug?: string;
}

