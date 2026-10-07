import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import {
  IsBoolean, IsDefined, IsInt, Min, ValidateNested,
  IsDateString,
  IsEmail,
  IsNotEmpty,
  IsOptional,
  IsString,
  IsUUID,
  Matches,
  MaxLength,
  MinLength,
} from 'class-validator';
import { Type, Transform } from 'class-transformer';

/** Controlled-text rule: no control characters; service trims and normalizes. */
// eslint-disable-next-line no-control-regex -- deliberate control-character rejection
const SAFE_TEXT = /^[^\u0000-\u001f\u007f]*$/;
const TRIM_TEXT = ({ value }: { value: unknown }) => (typeof value === 'string' ? value.trim() : value);
const PHONE_DIGITS = /^(?=(?:[^\d]*\d){6,20}$)[+]?[\d\s()-]{6,20}$/;
const HTTP_URL = /^https?:\/\/.+/i;

export class ConsentInputDto {
  @ApiProperty({ example: 'MEDIA-V1-2026', description: 'Wording version the candidate actually saw' })
  @Transform(TRIM_TEXT)
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
  @Transform(TRIM_TEXT)
  @IsString()
  @MinLength(1)
  @MaxLength(50)
  competitionCode!: string;

  @ApiProperty({ example: 'Nguyen Van A' })
  @Transform(TRIM_TEXT)
  @IsString()
  @MinLength(1)
  @MaxLength(200)
  @Matches(SAFE_TEXT, { message: 'full_name contains control characters' })
  fullName!: string;

  @ApiProperty({ format: 'date', example: '2004-05-12' })
  @Transform(TRIM_TEXT)
  @IsDateString({}, { message: 'date_of_birth must be an ISO date (YYYY-MM-DD)' })
  dateOfBirth!: string;

  @ApiProperty({ example: '20211234' })
  @Transform(TRIM_TEXT)
  @IsString()
  @MinLength(1)
  @MaxLength(50)
  @Matches(SAFE_TEXT)
  studentId!: string;

  @ApiProperty()
  @Transform(TRIM_TEXT)
  @IsString()
  @MinLength(1)
  @MaxLength(200)
  @Matches(SAFE_TEXT)
  school!: string;

  @ApiProperty()
  @Transform(TRIM_TEXT)
  @IsString()
  @MinLength(1)
  @MaxLength(200)
  @Matches(SAFE_TEXT)
  department!: string;

  @ApiProperty()
  @Transform(TRIM_TEXT)
  @IsString()
  @MinLength(1)
  @MaxLength(200)
  @Matches(SAFE_TEXT)
  major!: string;

  @ApiProperty({ example: 'candidate@example.com' })
  @Transform(TRIM_TEXT)
  @IsEmail({}, { message: 'email is not valid' })
  @MaxLength(255)
  email!: string;

  @ApiProperty({ example: '0901234567' })
  @Transform(TRIM_TEXT)
  @IsString()
  @Matches(PHONE_DIGITS, { message: 'phone is not valid' })
  phone!: string;

  @ApiProperty({ example: 'https://facebook.com/candidate' })
  @Transform(TRIM_TEXT)
  @IsString()
  @MinLength(1)
  @MaxLength(300)
  @Matches(HTTP_URL, { message: 'facebook must be a valid http or https URL' })
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

  @ApiPropertyOptional({ type: ConsentInputDto, deprecated: true, description: 'Legacy evidence only; MEDIA_USAGE is the communication decision, agree or decline' })
  @IsOptional()
  @ValidateNested()
  @Type(() => ConsentInputDto)
  eventCoverageConsent?: ConsentInputDto;
}

export class UpdateRegistrationDto {
  @ApiProperty({ description: 'Registration revision the client last read; stale or absent revisions are rejected with REVISION_CONFLICT' })
  @IsOptional()
  @IsInt()
  @Min(0)
  expectedRevision?: number;

  @ApiPropertyOptional()
  @IsOptional()
  @Transform(TRIM_TEXT)
  @IsString()
  @MinLength(1)
  @MaxLength(200)
  @Matches(SAFE_TEXT)
  fullName?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @Transform(TRIM_TEXT)
  @IsDateString({}, { message: 'date_of_birth must be an ISO date (YYYY-MM-DD)' })
  dateOfBirth?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @Transform(TRIM_TEXT)
  @IsString()
  @MinLength(1)
  @MaxLength(50)
  @Matches(SAFE_TEXT)
  studentId?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @Transform(TRIM_TEXT)
  @IsString()
  @MinLength(1)
  @MaxLength(200)
  @Matches(SAFE_TEXT)
  school?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @Transform(TRIM_TEXT)
  @IsString()
  @MinLength(1)
  @MaxLength(200)
  @Matches(SAFE_TEXT)
  department?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @Transform(TRIM_TEXT)
  @IsString()
  @MinLength(1)
  @MaxLength(200)
  @Matches(SAFE_TEXT)
  major?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @Transform(TRIM_TEXT)
  @IsEmail({}, { message: 'email is not valid' })
  @MaxLength(255)
  email?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @Transform(TRIM_TEXT)
  @IsString()
  @Matches(PHONE_DIGITS, { message: 'phone is not valid' })
  phone?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @Transform(TRIM_TEXT)
  @IsString()
  @MinLength(1)
  @MaxLength(300)
  @Matches(HTTP_URL, { message: 'facebook must be a valid http or https URL' })
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

class RegistrationProfileDto {
  @ApiProperty()
  fullName!: string;
  @ApiProperty({ nullable: true, type: String, example: '2004-05-12' })
  dateOfBirth!: string | null;
  @ApiProperty()
  studentId!: string;
  @ApiProperty()
  school!: string;
  @ApiProperty()
  department!: string;
  @ApiProperty()
  major!: string;
  @ApiProperty()
  email!: string;
  @ApiProperty()
  phone!: string;
  @ApiProperty()
  facebook!: string;
  @ApiProperty()
  revision!: number;
}

class RegistrationVideoDto {
  @ApiProperty({ example: 'BOUND' })
  state!: string;
  @ApiProperty({ nullable: true, type: String, format: 'uuid' })
  mediaObjectId!: string | null;
  @ApiProperty({ nullable: true, type: Number })
  sizeBytes!: number | null;
  @ApiProperty({ nullable: true, type: Number })
  durationSeconds!: number | null;
}

class RegistrationPhotoDto {
  @ApiProperty({ format: 'uuid' })
  uploadId!: string;
  @ApiProperty({ enum: ['READY', 'EXPIRED'] })
  state!: 'READY' | 'EXPIRED';
}

class RegistrationConsentDto {
  @ApiProperty({ enum: ['DATA_PROCESSING', 'MEDIA_USAGE', 'EVENT_COVERAGE'] })
  purpose!: 'DATA_PROCESSING' | 'MEDIA_USAGE' | 'EVENT_COVERAGE';
  @ApiProperty()
  granted!: boolean;
  @ApiProperty()
  wordingVersion!: string;
  @ApiProperty({ format: 'date-time' })
  recordedAt!: string;
}

export class RegistrationResponse {
  @ApiProperty({ format: 'uuid' })
  registrationId!: string;
  @ApiProperty({ enum: ['DRAFT', 'SUBMITTED'] })
  status!: 'DRAFT' | 'SUBMITTED';
  @ApiProperty({ description: 'ExpectedRevision source for PATCH CAS' })
  revision!: number;
  @ApiProperty({ type: Object })
  competition!: { code: string; registrationClosesAt: string };
  @ApiProperty({ type: RegistrationProfileDto })
  profile!: RegistrationProfileDto;
  @ApiProperty({ nullable: true, type: RegistrationVideoDto })
  video!: RegistrationVideoDto | null;
  @ApiProperty({ nullable: true, type: RegistrationPhotoDto })
  photo!: RegistrationPhotoDto | null;
  @ApiProperty({ type: [RegistrationConsentDto] })
  consents!: RegistrationConsentDto[];
  @ApiProperty()
  favoriteCandidateEligible!: boolean;
  @ApiProperty({ nullable: true, type: String, example: 'ISNG-2026-1A2B3C4D' })
  candidateCode!: string | null;
}

export class SubmissionResponse {
  @ApiProperty({ example: 'ISNG-2026-1A2B3C4D' })
  candidateCode!: string;
  @ApiProperty({ enum: ['SUBMITTED'] })
  status!: 'SUBMITTED';
  @ApiProperty({ format: 'date-time' })
  submittedAt!: string;
  @ApiProperty({ description: 'Derived from the active MEDIA_USAGE consent; gates the Favorite Candidate award' })
  favoriteCandidateEligible!: boolean;
  @ApiProperty({ type: [String] })
  nextSteps!: string[];
}

export interface RegistrationFormConfig {
  video: { maxBytes: number; maxDurationSeconds: number; acceptedType: string };
  photo: { maxBytes: number; acceptedTypes: string[]; statement: string };
  consents: {
    eventCoverage: { wordingVersion: string; statement: string; required: boolean; deprecated: boolean; description: string };
    mediaUsage: {
      wordingVersion: string;
      purpose: string;
      description: string;
      selectionRequired: boolean;
      defaultSelection: null;
      choices: { decision: string; granted: boolean }[];
      withdrawalContactEmail: string;
      retention: { anchor: string; period: string };
      cleanupEnforced: boolean;
      statement: string;
      declineStatement: string;
      withdrawalNotice: string;
      required: boolean;
    };
  };
  favoriteCandidateNotice: string;
}


export class RegistrationRecoveryRequestDto {
  @ApiProperty({ example: 'candidate@example.com', description: 'Current registration email; must match the registration exactly' })
  @IsEmail({}, { message: 'email is not valid' })
  @MaxLength(255)
  email!: string;
}

export class RegistrationRecoveryVerificationDto {
  @ApiProperty({ format: 'uuid', description: 'Challenge locator issued by the recovery request' })
  @IsUUID()
  challengeId!: string;

  @ApiProperty({ example: '123456' })
  @IsString()
  @Matches(/^\d{6}$/, { message: 'code must be a 6-digit OTP' })
  code!: string;
}

export class RegistrationRecoveryRequestResponse {
  @ApiProperty({ example: 'accepted' })
  status!: string;

  @ApiProperty({ format: 'uuid', description: 'Decoy locator for unknown/mismatching emails — a locator is not a verifier' })
  challengeId!: string;
}

export class RegistrationRecoveryGrantResponse {
  @ApiProperty({ format: 'uuid', description: 'The exact bound registration this grant covers' })
  registrationId!: string;

  @ApiProperty({ description: 'Opaque READ_EDIT_PROFILE capability token; store in memory only' })
  profileToken!: string;

  @ApiProperty({ format: 'date-time', description: 'Grant expiry; the grant is revocable and expires regardless' })
  expiresAt!: string;
}
