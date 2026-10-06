import { ApiPropertyOptional } from '@nestjs/swagger';
import { Type } from 'class-transformer';
import { IsIn, IsInt, IsOptional, IsString, Max, MaxLength, Min } from 'class-validator';

export class ListRegistrationsQuery {
  @ApiPropertyOptional({ example: 'ISNG-2026', description: 'Competition code (default ISNG-2026)' })
  @IsOptional()
  @IsString()
  @MaxLength(50)
  competition?: string;

  @ApiPropertyOptional({ enum: ['SUBMITTED', 'DRAFT', 'ALL'], description: 'Default SUBMITTED' })
  @IsOptional()
  @IsIn(['SUBMITTED', 'DRAFT', 'ALL'])
  state?: 'SUBMITTED' | 'DRAFT' | 'ALL';

  @ApiPropertyOptional({ description: 'Exact school name (from the schools facet)' })
  @IsOptional()
  @IsString()
  @MaxLength(200)
  school?: string;

  @ApiPropertyOptional({ description: 'Search name, email, student ID, phone or candidate code' })
  @IsOptional()
  @IsString()
  @MaxLength(100)
  q?: string;

  @ApiPropertyOptional({ default: 1 })
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  page?: number;

  @ApiPropertyOptional({ default: 50, maximum: 200 })
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  @Max(200)
  pageSize?: number;
}
