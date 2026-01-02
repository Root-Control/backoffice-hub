import { IsString, IsBoolean, IsOptional, IsArray } from 'class-validator';

export class UpdateApplicationDto {
  @IsOptional()
  @IsString()
  name?: string;

  @IsOptional()
  @IsBoolean()
  enabled?: boolean;

  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  redirect_uris?: string[];

  @IsOptional()
  @IsBoolean()
  pkce_required?: boolean;
}

