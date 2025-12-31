import { IsString, IsBoolean, IsOptional } from 'class-validator';

export class CreateSubtenantDto {
  @IsString()
  tenant_id: string;

  @IsString()
  name: string;

  @IsOptional()
  @IsBoolean()
  enabled?: boolean;

  @IsString()
  logo: string;
}

