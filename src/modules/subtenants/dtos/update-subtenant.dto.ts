import { IsString, IsBoolean, IsOptional } from 'class-validator';

export class UpdateSubtenantDto {
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

