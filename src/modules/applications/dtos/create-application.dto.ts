import { IsString, IsBoolean, IsOptional, IsArray } from 'class-validator';

export class CreateApplicationDto {
  @IsString()
  name: string;

  @IsOptional()
  @IsBoolean()
  enabled?: boolean;

  @IsArray()
  @IsString({ each: true })
  redirect_uris: string[];

  @IsOptional()
  @IsBoolean()
  pkce_required?: boolean;
}

