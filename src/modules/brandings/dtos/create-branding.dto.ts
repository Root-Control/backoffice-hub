import { IsMongoId, IsBoolean, IsOptional } from 'class-validator';

export class CreateBrandingDto {
  @IsMongoId()
  subtenant_id: string;

  @IsOptional()
  @IsBoolean()
  enabled?: boolean;
}
