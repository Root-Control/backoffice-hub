import { IsString, IsBoolean, IsOptional } from 'class-validator';

export class UpdateTenantDto {
  @IsOptional()
  @IsString()
  client_id?: string;

  @IsOptional()
  @IsString()
  name?: string;

  @IsOptional()
  @IsBoolean()
  enabled?: boolean;

  @IsOptional()
  @IsString()
  logo?: string;
}
