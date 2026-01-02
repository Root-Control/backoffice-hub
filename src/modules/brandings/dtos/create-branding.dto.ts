import { IsMongoId, IsBoolean, IsOptional } from 'class-validator';

export class CreateBrandingDto {
  @IsMongoId()
  tenant_id: string;

  @IsOptional()
  @IsBoolean()
  enabled?: boolean;
}
