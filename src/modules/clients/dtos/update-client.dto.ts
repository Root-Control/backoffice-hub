import { IsString, IsBoolean, IsOptional, IsUrl, MaxLength } from 'class-validator';

export class UpdateClientDto {
  @IsOptional()
  @IsString()
  name?: string;

  @IsOptional()
  @IsBoolean()
  enabled?: boolean;

  @IsOptional()
  @IsString()
  password_check_endpoint?: string;

  @IsOptional()
  @IsString()
  user_migrated_endpoint?: string;

  @IsOptional()
  @IsUrl(
    { require_protocol: true, require_tld: false },
    {
      message:
        'lookup_email_endpoint must be a valid URL with protocol (http:// or https://)',
    },
  )
  @MaxLength(2048, {
    message: 'lookup_email_endpoint must not exceed 2048 characters',
  })
  lookup_email_endpoint?: string;

  @IsOptional()
  @IsString()
  slug?: string;

  @IsOptional()
  @IsString()
  logo?: string;

  @IsOptional()
  @IsBoolean()
  allow_auto_link?: boolean;
}
