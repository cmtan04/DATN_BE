import { Trim } from '@/common/validators/validators';
import { ApiProperty } from '@nestjs/swagger';
import { IsNotEmpty, IsString, MaxLength } from 'class-validator';

export class CreateServiceRequestDto {
  @ApiProperty({ example: 'Wifi' })
  @Trim()
  @IsString()
  @IsNotEmpty()
  @MaxLength(50)
  name: string;
}

export interface ServiceResponseDto {
  id: number;
  name: string;
}
