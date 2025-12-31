import { IsBoolean, IsOptional } from 'class-validator';

export class UpdateBrandingDto {
  @IsOptional()
  @IsBoolean()
  enabled?: boolean;
}
