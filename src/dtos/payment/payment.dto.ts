import { BookingStatus, PaymentStatus } from '@assets/enum/payment.enum';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { Transform, Type } from 'class-transformer';
import {
  IsEmail,
  IsInt,
  IsNotEmpty,
  IsOptional,
  IsString,
  Matches,
  MaxLength,
  Min,
} from 'class-validator';

export class CheckoutPaymentRequestDto {
  @ApiProperty({ example: 1 })
  @Type(() => Number)
  @IsInt()
  @Min(1)
  locationId: number;

  @ApiProperty({ example: '2026-07-01' })
  @IsString()
  @Matches(/^\d{4}-\d{2}-\d{2}$/)
  startDate: string;

  @ApiProperty({ example: '2026-08-01' })
  @IsString()
  @Matches(/^\d{4}-\d{2}-\d{2}$/)
  endDate: string;

  @ApiProperty({ example: 2 })
  @Type(() => Number)
  @IsInt()
  @Min(1)
  guestCount: number;

  @ApiProperty({ example: 'Nguyen Van A' })
  @Transform(({ value }) =>
    typeof value === 'string' ? value.trim() : value,
  )
  @IsString()
  @IsNotEmpty()
  @MaxLength(255)
  contactName: string;

  @ApiProperty({ example: '0901234567' })
  @Transform(({ value }) =>
    typeof value === 'string' ? value.trim() : value,
  )
  @IsString()
  @IsNotEmpty()
  @MaxLength(50)
  contactPhone: string;

  @ApiProperty({ example: 'customer@example.com' })
  @Transform(({ value }) =>
    typeof value === 'string' ? value.trim() : value,
  )
  @IsEmail()
  @MaxLength(255)
  contactEmail: string;

  @ApiPropertyOptional({ example: 'Can xem phong truoc khi nhan phong' })
  @IsOptional()
  @Transform(({ value }) =>
    typeof value === 'string' ? value.trim() : value,
  )
  @IsString()
  @MaxLength(2000)
  note?: string;
}

export interface CheckoutPaymentResponseDto {
  bookingId: number;
  paymentId: number;
  checkoutUrl: string;
  qrCode: string;
  status: PaymentStatus;
}

export interface PaymentCheckUpdateResponseDto {
  bookingId: number;
  paymentId: number;
  bookingStatus: BookingStatus;
  paymentStatus: PaymentStatus;
  amount: number;
  currency: string;
  checkoutUrl?: string | null;
  qrCode?: string | null;
}
