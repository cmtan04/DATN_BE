import { BookingStatus } from '@/assets/enum/payment.enum';
import { ApiProperty } from '@nestjs/swagger';
import { Type } from 'class-transformer';
import { IsDate, IsInt, IsOptional, IsString, Min } from 'class-validator';
import { DateRangeDto } from './dateRange.dto';

export class GetAvailableRoomsRequestDto extends DateRangeDto {
  @ApiProperty({ description: 'ID dia diem', example: 1 })
  @Type(() => Number)
  @IsInt()
  locationId: number;
}

export class GetAvailableRoomsResponseDto {
  availableRooms: number;
}

export class CreateBookingRequestDto extends DateRangeDto {
  @ApiProperty({ description: 'ID dia diem', example: 1 })
  @Type(() => Number)
  @IsInt()
  locationId: number;

  @ApiProperty({ description: 'So phong da dat', example: 2 })
  @Type(() => Number)
  @IsInt()
  @Min(1)
  roomNumber: number;

  @ApiProperty({ description: 'Tong so tien', example: 500000 })
  @Type(() => Number)
  @IsInt()
  totalAmount: number;

  @ApiProperty({ description: 'Don vi tien te', example: 'vnd' })
  @IsOptional()
  @IsString()
  currency: string;
}

export class ConfirmBookingRequestDto extends CreateBookingRequestDto {
  @ApiProperty({ description: 'Ghi chu', example: 'Yeu cau phong tang cao' })
  @IsOptional()
  @IsString()
  note?: string;
}

export class CreateBookingResponseDto {
  id: number;
  bookingCode: string;
  locationId: number;
  startDate: Date;
  endDate: Date;
  roomNumber: number;
  status: BookingStatus;
  totalAmount: number;
  currency: string;
}

export class ConfirmBookingResponseDto extends CreateBookingResponseDto {
  note?: string;
}

export class CancelBookingRequestDto {
  @ApiProperty({ description: 'Mã đặt phòng', example: 'BK123456' })
  @IsString()
  bookingCode: string;

  @ApiProperty({
    description: 'Lý do hủy',
    example: 'Thay đổi kế hoạch',
    required: false,
  })
  @IsOptional()
  @IsString()
  reason?: string;

  @ApiProperty({
    description: 'Tên ngân hàng nhận refund',
    example: 'MBBank',
    required: false,
  })
  @IsOptional()
  @IsString()
  bankName?: string;

  @ApiProperty({
    description: 'Số tài khoản nhận refund',
    example: '0123456789',
    required: false,
  })
  @IsOptional()
  @IsString()
  accountNumber?: string;

  @ApiProperty({
    description: 'Tên chủ tài khoản nhận refund',
    example: 'NGUYEN VAN A',
    required: false,
  })
  @IsOptional()
  @IsString()
  accountHolder?: string;
}

export class CancelBookingResponseDto {
  @ApiProperty({ description: 'Mã đặt phòng', example: 'BK123456' })
  bookingCode: string;

  @ApiProperty({
    description: 'Trạng thái booking sau khi hủy',
    example: BookingStatus.CANCELLED,
  })
  bookingStatus: BookingStatus;

  @ApiProperty({ description: 'Trạng thái payment', example: 'REFUND_PENDING' })
  paymentStatus: string;

  @ApiProperty({ description: 'Số tiền hoàn lại', example: 500000 })
  refundAmount: number;

  @ApiProperty({ description: 'Phí hủy booking', example: 0 })
  cancellationFee: number;

  @ApiProperty({ description: 'Tỷ lệ hoàn tiền (%)', example: 100 })
  refundPercentage: number;

  @ApiProperty({
    description: 'ID yêu cầu hoàn tiền (nếu có)',
    example: 1,
    required: false,
  })
  refundRequestId?: number | null;

  @ApiProperty({ description: 'Thông báo', example: 'Hủy booking thành công' })
  message: string;
}
