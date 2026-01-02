import { IsString, IsBoolean, IsOptional } from 'class-validator';

export class UpdateDomainDto {
  @IsOptional()
  @IsString()
  default_tenant_id?: string;

  @IsOptional()
  @IsString()
  application_id?: string;

  @IsOptional()
  @IsBoolean()
  enabled?: boolean;
}

