import { ApiProperty } from '@nestjs/swagger';
import { Type } from 'class-transformer';
import { IsDate, IsInt } from 'class-validator';

export class GetAvailableRoomsRequestDto {
  @ApiProperty({ description: 'ID dia diem', example: 1 })
  @Type(() => Number)
  @IsInt()
  locationId: number;

  @ApiProperty({ description: 'Ngay bat dau', example: '2023-01-01' })
  @Type(() => Date)
  @IsDate()
  startDate: Date;

  @ApiProperty({ description: 'Ngay ket thuc', example: '2023-01-02' })
  @Type(() => Date)
  @IsDate()
  endDate: Date;
}

export class GetAvailableRoomsResponseDto {
  availableRooms: number;
}
