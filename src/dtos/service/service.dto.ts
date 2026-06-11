import { Trim } from "@/common/validators/validators";
import { ApiProperty } from '@nestjs/swagger';
import { IsString } from 'class-validator';

export class CreateServiceRequestDto {
  @ApiProperty({ example: 'Wifi' })
  @Trim()
  @IsString()
  name: string;
}

export interface ServiceResponseDto {
  id: number;
  name: string;
}
