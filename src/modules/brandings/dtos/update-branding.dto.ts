import { IsString, IsBoolean, IsOptional } from 'class-validator';

export class UpdateBrandingDto {
  @IsOptional()
  @IsString()
  scope?: string;

  @IsOptional()
  @IsString()
  tenant_id?: string;

  @IsOptional()
  @IsString()
  subtenant_id?: string;

  @IsOptional()
  @IsBoolean()
  enabled?: boolean;
}

