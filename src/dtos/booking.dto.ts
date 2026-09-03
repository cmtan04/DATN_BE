import { AdminLocationListResponseDto } from '@/dtos/admin/location.dto';
import { BookingStatus, PaymentStatus } from '@/assets/enum/payment.enum';
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
  @IsOptional()
  @IsString()
  bookingCode?: string;

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
  })
  @IsOptional()
  @IsString()
  bankName?: string;

  @ApiProperty({
    description: 'Số tài khoản nhận refund',
    example: '0123456789',
  })
  @IsOptional()
  @IsString()
  accountNumber?: string;

  @ApiProperty({
    description: 'Tên chủ tài khoản nhận refund',
    example: 'NGUYEN VAN A',
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
  paymentStatus: PaymentStatus;

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

export class GetUserBookingsRequestDto {
  @ApiProperty({ description: 'Số trang', example: 1, required: false })
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  page?: number = 1;

  @ApiProperty({
    description: 'Số lượng bản ghi mỗi trang',
    example: 6,
    required: false,
  })
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  limit?: number = 6;

  @ApiProperty({
    description: 'Trạng thái đặt phòng',
    example: 2,
    required: false,
    enum: BookingStatus,
  })
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  status?: BookingStatus;

  @ApiProperty({
    description: 'Từ khóa tìm kiếm (tên KS, mã phòng)',
    example: 'Hotel',
    required: false,
  })
  @IsOptional()
  @IsString()
  search?: string;
}

export interface RawBookingData {
  id: number;
  bookingCode: string;
  startDate: Date;
  endDate: Date;
  roomNumber: number;
  note: string;
  status: BookingStatus;
  totalAmount: number;
  currency: string;
  createdAt: Date;
  locationId: number;
  locationName: string;
  price: number;
  priceUnit: string;
  area: number;
  fullAddress: string;
  thumbnailUrl: string;
}

export class LocationSummaryDto {
  id: number;
  name: string;
  price: number;
  priceUnit: string;
  area: number;
  address: string;
  thumbnailUrl: string;
}

export class UserBookingItemDto {
  id: number;
  bookingCode: string;
  startDate: Date;
  endDate: Date;
  roomNumber: number;
  note?: string;
  status: BookingStatus;
  totalAmount: number;
  currency: string;
  createdAt: Date;
  location: LocationSummaryDto;
}

export class GetUserBookingsMetaDto {
  page: number;
  limit: number;
  total: number;
  totalPages: number;
}

export class GetUserBookingsSummaryDto {
  allCount: number;
  confirmedCount: number;
  completedCount: number;
  cancelledCount: number;
}

export class GetUserBookingsResponseDto {
  data: UserBookingItemDto[];
  meta: GetUserBookingsMetaDto;
  summary: GetUserBookingsSummaryDto;
}
