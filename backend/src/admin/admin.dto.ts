import { Type } from "class-transformer";
import {
  ArrayMaxSize,
  ArrayMinSize,
  IsArray,
  IsEmail,
  IsIn,
  IsInt,
  IsISO8601,
  IsNumber,
  IsOptional,
  IsString,
  IsUUID,
  Max,
  MaxLength,
  Min,
  MinLength,
  ValidateNested,
} from "class-validator";

export class CandidateDto {
  @IsString() @MinLength(1) @MaxLength(200) fullName!: string;
  @IsEmail() @MaxLength(255) email!: string;
  @IsString() @MinLength(1) @MaxLength(80) studentId!: string;
  @IsString() @MinLength(1) @MaxLength(200) school!: string;
}
export class AccountActionDto {
  @IsIn(["PROVISION", "DISABLE", "ENABLE", "RESET", "DELETE"]) action!: string;
  @IsOptional() @IsString() @MaxLength(500) reason?: string;
}
export class QuestionDto {
  @IsString() @MinLength(1) @MaxLength(10000) prompt!: string;
  @IsArray()
  @ArrayMinSize(2)
  @ArrayMaxSize(8)
  @IsString({ each: true })
  @MaxLength(5000, { each: true })
  options!: string[];
  @IsInt() @Min(0) @Max(7) answer!: number;
  @IsIn(["EASY", "MEDIUM", "HARD"]) difficulty!: string;
  @IsString() @MinLength(1) @MaxLength(120) pool!: string;
  @IsOptional() @IsInt() @Min(1) expectedVersion?: number;
}
export class ScheduleDto {
  @IsUUID() competitionId!: string;
  @IsString() @MinLength(1) @MaxLength(200) name!: string;
  @IsISO8601() opensAt!: string;
  @IsISO8601() closesAt!: string;
  @IsInt() @Min(60) @Max(14400) durationSeconds!: number;
  @IsInt() @Min(1) @Max(100000) capacity!: number;
  @IsInt() @Min(1) @Max(500) questionCount!: number;
  @IsUUID() poolId!: string;
}
export class AssignmentDto {
  @IsUUID() candidateId!: string;
  @IsUUID() scheduleId!: string;
  @IsOptional() @IsString() @MaxLength(500) reason?: string;
}
class CriterionDto {
  @IsString() @MaxLength(40) code!: string;
  @IsNumber() @Min(0.000001) @Max(1) weight!: number;
  @IsNumber() @Min(0.000001) @Max(10000) max!: number;
}
export class PolicyDto {
  @IsUUID() competitionId!: string;
  @IsIn([2, 4]) round!: number;
  @IsString() @MinLength(1) @MaxLength(200) label!: string;
  @IsNumber() @Min(0.000001) @Max(10000) maxScore!: number;
  @IsArray()
  @ArrayMinSize(1)
  @ArrayMaxSize(30)
  @ValidateNested({ each: true })
  @Type(() => CriterionDto)
  criteria!: CriterionDto[];
}
export class TeamDto {
  @IsUUID() competitionId!: string;
  @IsString() @MinLength(1) @MaxLength(80) code!: string;
}
