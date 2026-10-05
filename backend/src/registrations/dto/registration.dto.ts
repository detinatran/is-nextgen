import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import {
  IsBoolean, IsDefined, ValidateNested,
  IsDateString,
  IsEmail,
  IsNotEmpty,
  IsOptional,
  IsString,
  Matches,
  MaxLength,
  MinLength,
} from 'class-validator';
import { Type } from 'class-transformer';

/** Controlled-text rule: no control characters; service trims and normalizes. */
// eslint-disable-next-line no-control-regex -- deliberate control-character rejection
const SAFE_TEXT = /^[^\u0000-\u001f\u007f]*$/;

export class ConsentInputDto {
  @ApiProperty({ example: 'MEDIA-V1-2026', description: 'Wording version the candidate actually saw' })
  @IsString()
  @MinLength(1)
  @MaxLength(50)
  @Matches(SAFE_TEXT)
  wordingVersion!: string;

  @ApiProperty()
  @IsBoolean()
  granted!: boolean;
}

export class CreateRegistrationDraftDto {
  @ApiProperty({ example: 'ISNG-2026' })
  @IsString()
  @MinLength(1)
  @MaxLength(50)
  competitionCode!: string;

  @ApiProperty({ example: 'Nguyen Van A' })
  @IsString()
  @MinLength(1)
  @MaxLength(200)
  @Matches(SAFE_TEXT, { message: 'full_name contains control characters' })
  fullName!: string;

  @ApiProperty({ format: 'date', example: '2004-05-12' })
  @IsDateString({}, { message: 'date_of_birth must be an ISO date (YYYY-MM-DD)' })
  dateOfBirth!: string;

  @ApiProperty({ example: '20211234' })
  @IsString()
  @MinLength(1)
  @MaxLength(50)
  @Matches(SAFE_TEXT)
  studentId!: string;

  @ApiProperty()
  @IsString()
  @MinLength(1)
  @MaxLength(200)
  @Matches(SAFE_TEXT)
  school!: string;

  @ApiProperty()
  @IsString()
  @MinLength(1)
  @MaxLength(200)
  @Matches(SAFE_TEXT)
  department!: string;

  @ApiProperty()
  @IsString()
  @MinLength(1)
  @MaxLength(200)
  @Matches(SAFE_TEXT)
  major!: string;

  @ApiProperty({ example: 'candidate@example.com' })
  @IsEmail({}, { message: 'email is not valid' })
  @MaxLength(255)
  email!: string;

  @ApiProperty({ example: '0901234567' })
  @IsString()
  @Matches(/^[+]?[\d\s()-]{6,20}$/, { message: 'phone is not valid' })
  phone!: string;

  @ApiProperty({ example: 'https://facebook.com/candidate' })
  @IsString()
  @MinLength(1)
  @MaxLength(300)
  @Matches(SAFE_TEXT)
  facebook!: string;

  @ApiProperty({ type: ConsentInputDto })
  @IsDefined()
  @ValidateNested()
  @Type(() => ConsentInputDto)
  consent!: ConsentInputDto;

  @ApiProperty({ type: ConsentInputDto, description: 'Media usage consent (agree = true / decline = false); declining only excludes the Favorite Candidate award' })
  @IsDefined()
  @ValidateNested()
  @Type(() => ConsentInputDto)
  mediaUsageConsent!: ConsentInputDto;

  @ApiProperty({ type: ConsentInputDto, description: 'Event coverage commitment (BTC records/photographs at events; 1-year retention); must be true' })
  @IsDefined()
  @ValidateNested()
  @Type(() => ConsentInputDto)
  eventCoverageConsent!: ConsentInputDto;
}

export class UpdateRegistrationDto {
  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  @MinLength(1)
  @MaxLength(200)
  @Matches(SAFE_TEXT)
  fullName?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsDateString({}, { message: 'date_of_birth must be an ISO date (YYYY-MM-DD)' })
  dateOfBirth?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  @MinLength(1)
  @MaxLength(50)
  @Matches(SAFE_TEXT)
  studentId?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  @MinLength(1)
  @MaxLength(200)
  @Matches(SAFE_TEXT)
  school?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  @MinLength(1)
  @MaxLength(200)
  @Matches(SAFE_TEXT)
  department?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  @MinLength(1)
  @MaxLength(200)
  @Matches(SAFE_TEXT)
  major?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsEmail({}, { message: 'email is not valid' })
  @MaxLength(255)
  email?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  @Matches(/^[+]?[\d\s()-]{6,20}$/, { message: 'phone is not valid' })
  phone?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  @MinLength(1)
  @MaxLength(300)
  @Matches(SAFE_TEXT)
  facebook?: string;

  @ApiPropertyOptional({ type: ConsentInputDto, description: 'New media usage answer; consent rows are append-only' })
  @IsOptional()
  @ValidateNested()
  @Type(() => ConsentInputDto)
  mediaUsageConsent?: ConsentInputDto;

  @ApiPropertyOptional({ type: ConsentInputDto, description: 'New event coverage answer; consent rows are append-only' })
  @IsOptional()
  @ValidateNested()
  @Type(() => ConsentInputDto)
  eventCoverageConsent?: ConsentInputDto;
}

export class SubmitRegistrationDto {
  @IsNotEmpty({ message: 'Idempotency-Key header is required' })
  @IsString()
  @MinLength(16)
  @MaxLength(128)
  @Matches(/^[\w.-]+$/, { message: 'Idempotency-Key must contain only word characters' })
  idempotencyKey!: string;
}

export interface RegistrationCapabilityResponse {
  registrationId: string;
  status: 'DRAFT';
  capability: {
    profileToken: string;
    uploadToken: string;
    expiresAt: string;
  };
}

export interface RegistrationResponse {
  registrationId: string;
  status: 'DRAFT' | 'SUBMITTED';
  revision: number;
  competition: { code: string; registrationClosesAt: string };
  profile: {
    fullName: string;
    dateOfBirth: string | null;
    studentId: string;
    school: string;
    department: string;
    major: string;
    email: string;
    phone: string;
    facebook: string;
    revision: number;
  };
  video: {
    state: string;
    mediaObjectId: string | null;
    sizeBytes: number | null;
    durationSeconds: number | null;
  } | null;
  photo: {
    uploadId: string;
    state: 'READY' | 'EXPIRED';
  } | null;
  consents: {
    purpose: 'DATA_PROCESSING' | 'MEDIA_USAGE' | 'EVENT_COVERAGE';
    granted: boolean;
    wordingVersion: string;
    recordedAt: string;
  }[];
  favoriteCandidateEligible: boolean;
  candidateCode: string | null;
}

export interface SubmissionResponse {
  candidateCode: string;
  status: 'SUBMITTED';
  submittedAt: string;
  favoriteCandidateEligible: boolean;
  nextSteps: string[];
}

export interface RegistrationFormConfig {
  video: { maxBytes: number; maxDurationSeconds: number; acceptedType: string };
  photo: { maxBytes: number; acceptedTypes: string[]; statement: string };
  consents: {
    eventCoverage: { wordingVersion: string; statement: string; required: boolean };
    mediaUsage: {
      wordingVersion: string;
      statement: string;
      declineStatement: string;
      withdrawalNotice: string;
      required: boolean;
    };
  };
  favoriteCandidateNotice: string;
}
