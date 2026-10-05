import { ApiProperty } from '@nestjs/swagger';
import { IsEmail, IsString, Matches, MaxLength, MinLength } from 'class-validator';

export class ActivationDto {
  @ApiProperty({ description: 'OTP code delivered to the provisioned email', example: '123456' })
  @IsString()
  @Matches(/^\d{6}$/, { message: 'token must be a 6-digit code' })
  token!: string;

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

export class TokenDto {
  @ApiProperty({ example: '123456' })
  @IsString()
  @Matches(/^\d{6}$/, { message: 'token must be a 6-digit code' })
  token!: string;
}

export class PasswordResetDto extends TokenDto {
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
