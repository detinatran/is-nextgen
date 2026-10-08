import { ApiProperty } from '@nestjs/swagger';
import { IsEmail, IsString, IsUUID, Matches, MaxLength, MinLength, IsOptional } from 'class-validator';

/** Six-digit email OTP verifiers. The challengeId travels beside them as the locator. */
const OTP_CODE = /^\d{6}$/;

export class ActivationDto {
  @ApiProperty({ format: 'uuid', description: 'Challenge locator issued with the activation OTP' })
  @IsUUID()
  challengeId!: string;

  @ApiProperty({ example: '123456' })
  @IsString()
  @Matches(OTP_CODE, { message: 'code must be a 6-digit OTP' })
  code!: string;

  @ApiProperty({ minLength: 10 })
  @IsString()
  @MinLength(10, { message: 'password must be at least 10 characters' })
  @MaxLength(128)
  @Matches(/^(?=.*[A-Za-z])(?=.*\d).+$/, { message: 'password must contain letters and digits' })
  password!: string;
}

export class LoginDto {
  @ApiProperty({ description: 'Candidate code or email', example: 'candidate@example.com' })
  @IsString()
  @MinLength(3)
  @MaxLength(255)
  identifier!: string;

  @IsString()
  @MinLength(1)
  @MaxLength(128)
  password!: string;
}

export class EmailRequestDto {
  @ApiProperty({ example: 'candidate@example.com' })
  @IsEmail({}, { message: 'email is not valid' })
  @MaxLength(255)
  email!: string;
}

export class VerificationDto {
  @ApiProperty({ format: 'uuid', description: 'Challenge locator returned by the request endpoint' })
  @IsUUID()
  challengeId!: string;

  @ApiProperty({ example: '123456' })
  @IsString()
  @Matches(OTP_CODE, { message: 'code must be a 6-digit OTP' })
  code!: string;
}

/**
 * F01 contract: the reset identifies ONE challenge explicitly.
 * `token` is a deprecated alias kept only so legacy token-only requests
 * fail closed with AUTH_REQUIRED instead of a validation error.
 */
export class PasswordResetDto {
  @ApiProperty({ format: 'uuid', required: true })
  @IsOptional()
  @IsUUID()
  challengeId?: string;

  @ApiProperty({ example: '123456' })
  @IsOptional()
  @IsString()
  @Matches(OTP_CODE, { message: 'code must be a 6-digit OTP' })
  code?: string;

  @ApiProperty({ example: '123456', deprecated: true, description: 'Legacy alias of code; requests without challengeId always fail closed' })
  @IsOptional()
  @IsString()
  @Matches(OTP_CODE, { message: 'token must be a 6-digit OTP' })
  token?: string;

  @ApiProperty({ minLength: 10 })
  @IsString()
  @MinLength(10, { message: 'password must be at least 10 characters' })
  @MaxLength(128)
  @Matches(/^(?=.*[A-Za-z])(?=.*\d).+$/, { message: 'password must contain letters and digits' })
  newPassword!: string;
}

export class ReauthenticationDto {
  @IsString()
  @MinLength(1)
  @MaxLength(128)
  password!: string;
}
