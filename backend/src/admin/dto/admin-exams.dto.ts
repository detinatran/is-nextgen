import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { Type } from 'class-transformer';
import {
  ArrayMaxSize,
  ArrayMinSize,
  IsBoolean,
  IsDateString,
  IsIn,
  IsInt,
  IsNumber,
  IsOptional,
  IsString,
  IsUUID,
  Matches,
  Max,
  MaxLength,
  Min,
  MinLength,
  ValidateNested,
} from 'class-validator';

export class CreatePoolDto {
  @ApiProperty({ example: 'SOLIEU' })
  @Matches(/^[A-Za-z0-9_-]{2,30}$/)
  code!: string;

  @ApiProperty({ example: 'Tư duy số liệu' })
  @IsString()
  @MinLength(1)
  @MaxLength(100)
  name!: string;
}

export class OptionInputDto {
  @ApiProperty()
  @IsString()
  @MaxLength(1000)
  text!: string;

  @ApiProperty()
  @IsBoolean()
  isCorrect!: boolean;
}

export class QuestionDto {
  @ApiProperty()
  @IsUUID()
  poolId!: string;

  @ApiProperty()
  @IsString()
  @MinLength(3)
  @MaxLength(4000)
  prompt!: string;

  @ApiProperty({ enum: ['EASY', 'MEDIUM', 'HARD'] })
  @IsIn(['EASY', 'MEDIUM', 'HARD'])
  difficulty!: 'EASY' | 'MEDIUM' | 'HARD';

  @ApiProperty({ type: [OptionInputDto] })
  @ValidateNested({ each: true })
  @Type(() => OptionInputDto)
  @ArrayMinSize(2)
  @ArrayMaxSize(8)
  options!: OptionInputDto[];
}

export class CreateExamDto {
  @ApiPropertyOptional({ example: 'ISNG-2026' })
  @IsOptional()
  @IsString()
  @MaxLength(50)
  competition?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  @MaxLength(200)
  name?: string;
}

export class BlueprintItemDto {
  @ApiProperty()
  @IsUUID()
  poolId!: string;

  @ApiProperty()
  @IsInt()
  @Min(1)
  @Max(500)
  count!: number;

  @ApiProperty()
  @IsNumber()
  @Min(0)
  @Max(100)
  points!: number;
}

export class BlueprintDto {
  @ApiProperty({ type: [BlueprintItemDto] })
  @ValidateNested({ each: true })
  @Type(() => BlueprintItemDto)
  @ArrayMinSize(1)
  @ArrayMaxSize(20)
  items!: BlueprintItemDto[];
}

export class ScheduleDto {
  @ApiProperty()
  @IsDateString()
  opensAt!: string;

  @ApiProperty()
  @IsDateString()
  closesAt!: string;

  @ApiProperty()
  @IsInt()
  @Min(1)
  @Max(1000)
  capacity!: number;
}

export class ScheduleUpdateDto {
  @ApiPropertyOptional()
  @IsOptional()
  @IsDateString()
  opensAt?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsDateString()
  closesAt?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsInt()
  @Min(1)
  @Max(1000)
  capacity?: number;
}

export class MoveAssignmentDto {
  @ApiProperty()
  @IsUUID()
  scheduleId!: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  @MaxLength(300)
  reason?: string;
}

export class InviteDto {
  @ApiPropertyOptional({ description: 'Only this schedule (default: all)' })
  @IsOptional()
  @IsUUID()
  scheduleId?: string;
}
