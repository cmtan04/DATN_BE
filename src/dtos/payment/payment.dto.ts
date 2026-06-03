import { BookingStatus, PaymentStatus } from '@assets/enum/payment.enum';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class CheckoutPaymentRequestDto {
  @ApiProperty({ example: 1 })
  locationId: number;

  @ApiProperty({ example: '2026-07-01' })
  startDate: string;

  @ApiProperty({ example: '2026-08-01' })
  endDate: string;

  @ApiProperty({ example: 2 })
  guestCount: number;

  @ApiProperty({ example: 'Nguyen Van A' })
  contactName: string;

  @ApiProperty({ example: '0901234567' })
  contactPhone: string;

  @ApiProperty({ example: 'customer@example.com' })
  contactEmail: string;

  @ApiPropertyOptional({ example: 'Can xem phong truoc khi nhan phong' })
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
