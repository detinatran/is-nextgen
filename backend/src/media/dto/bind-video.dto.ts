import { ApiProperty } from '@nestjs/swagger';
import { IsUUID } from 'class-validator';

export class BindVideoDto {
  @ApiProperty({ format: 'uuid' })
  @IsUUID()
  mediaObjectId!: string;
}
