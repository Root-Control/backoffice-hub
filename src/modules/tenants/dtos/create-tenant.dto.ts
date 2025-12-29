import {
  IsString,
  IsBoolean,
  IsOptional,
  IsUrl,
  MaxLength,
} from 'class-validator';

export class CreateTenantDto {
  @IsString()
  name: string;

  @IsOptional()
  @IsBoolean()
  enabled?: boolean; // default: true

  @IsString()
  password_check_endpoint: string;

  @IsString()
  user_migrated_endpoint: string;

  @IsUrl(
    { require_protocol: true },
    {
      message:
        'lookup_email_endpoint must be a valid URL with protocol (http:// or https://)',
    },
  )
  @MaxLength(2048, {
    message: 'lookup_email_endpoint must not exceed 2048 characters',
  })
  lookup_email_endpoint: string;

  @IsUrl(
    { require_protocol: true },
    {
      message:
        'forgot_password_endpoint must be a valid URL with protocol (http:// or https://)',
    },
  )
  @MaxLength(2048, {
    message: 'forgot_password_endpoint must not exceed 2048 characters',
  })
  forgot_password_endpoint: string;

  @IsString()
  slug: string;

  @IsString()
  logo: string;

  @IsBoolean()
  allow_auto_link: boolean;
}
