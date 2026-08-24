import { BookingStatus, PaymentStatus } from '@assets/enum/payment.enum';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { Transform, Type } from 'class-transformer';
import {
  IsInt,
  IsNotEmpty,
  IsOptional,
  IsString,
  MaxLength,
  Min,
} from 'class-validator';
import { DateRangeDto } from '../dateRange.dto';
import { CreatePayosPaymentLinkResponse } from './payos.dto';

export class CheckoutPaymentRequestDto {
  @ApiProperty({ example: 'BK123456', description: 'Mã đặt phòng' })
  @Transform(({ value }: { value: unknown }) =>
    typeof value === 'string' ? value.trim() : (value as string),
  )
  @IsString()
  @IsNotEmpty()
  bookingCode: string;

  @ApiPropertyOptional({ example: 1 })
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  locationId?: number;

  @ApiPropertyOptional({ example: 1 })
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  roomNumber?: number;

  @ApiPropertyOptional({ example: 500000 })
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(0)
  totalAmount?: number;

  @ApiPropertyOptional({ example: 'Can xem phong truoc khi nhan phong' })
  @IsOptional()
  @Transform(({ value }: { value: unknown }) =>
    typeof value === 'string' ? value.trim() : (value as string),
  )
  @IsString()
  @MaxLength(2000)
  note?: string;
}

export interface CheckoutPaymentResponseDto extends CreatePayosPaymentLinkResponse {}
