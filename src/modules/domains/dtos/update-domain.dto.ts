import { IsString, IsBoolean, IsOptional } from 'class-validator';

export class UpdateDomainDto {
  @IsOptional()
  @IsString()
  default_subtenant_id?: string;

  @IsOptional()
  @IsString()
  client_id?: string;

  @IsOptional()
  @IsBoolean()
  enabled?: boolean;
}

