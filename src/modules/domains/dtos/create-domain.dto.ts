import { IsString, IsBoolean, IsOptional } from 'class-validator';

export class CreateDomainDto {
  @IsString()
  host: string; // required, used as _id

  @IsString()
  tenant_id: string;

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

