import {
  OwnerRequestStatus,
  UserRole,
  UserStatus,
} from '@assets/enum/user.enum';
import { Transform, Type } from 'class-transformer';
import {
  IsNotEmpty,
  IsOptional,
  IsString,
  MaxLength,
  IsInt,
  Min,
} from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';
import { BookingStatus } from '@/assets/enum/payment.enum';

export class UserDecoratorDtoResponse {
  id: number;
  email: string;
  phone?: string;
  fullName?: string;
  dateOfBirth?: Date;
  status: UserStatus;
  role: UserRole;
}

export class UserProfile {
  fullName: string;
  phoneNumber: string;
  avatarUrl?: string;
}

export class User {
  id: number;
  email: string;
  userRole: UserRole;
  status: UserStatus;
  ownerRequestStatus: OwnerRequestStatus;
  profile: UserProfile;
}

export class UpdateCurrentUserRequestDto {
  @IsOptional()
  @Transform(({ value }) => (typeof value === 'string' ? value.trim() : value))
  @IsString()
  @IsNotEmpty()
  @MaxLength(255)
  fullName?: string;

  @IsOptional()
  @Transform(({ value }) => (typeof value === 'string' ? value.trim() : value))
  @IsString()
  @IsNotEmpty()
  @MaxLength(50)
  phoneNumber?: string;
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
    example: 'confirmed',
    required: false,
  })
  @IsOptional()
  @IsString()
  status?: string;

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
  confirmedCount: number;
  completedCount: number;
  cancelledCount: number;
}

export class GetUserBookingsResponseDto {
  data: UserBookingItemDto[];
  meta: GetUserBookingsMetaDto;
  summary: GetUserBookingsSummaryDto;
}
