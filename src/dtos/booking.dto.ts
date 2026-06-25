import { BookingStatus } from '@/assets/enum/payment.enum';
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

export class CreateBookingRequestDto {
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

  @ApiProperty({ description: 'So phong da dat', example: 2 })
  @Type(() => Number)
  @IsInt()
  roomNumber: number;

  @ApiProperty({ description: 'So luong khach', example: 2 })
  @Type(() => Number)
  @IsInt()
  guestCount: number;

  @ApiProperty({ description: 'Ghi chu', example: 'Yeu cau phong tang cao' })
  note?: string;

  @ApiProperty({ description: 'Tong so tien', example: 500000 })
  @Type(() => Number)
  @IsInt()
  totalAmount: number;

  @ApiProperty({ description: 'Don vi tien te', example: 'vnd' })
  currency: string;
}

export class CreateBookingResponseDto {
  id: number;
  bookingCode: string;
  locationId: number;
  startDate: Date;
  endDate: Date;
  roomNumber: number;
  guestCount: number;
  note?: string;
  status: BookingStatus;
  totalAmount: number;
  currency: string;
}
