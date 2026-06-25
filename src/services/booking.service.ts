import { Injectable } from '@nestjs/common';
import { BookingRepository } from '@/repositories/booking.repository';
import {
  CreateBookingRequestDto,
  CreateBookingResponseDto,
  GetAvailableRoomsRequestDto,
  GetAvailableRoomsResponseDto,
} from '@/dtos/booking.dto';
import { TBBooking } from '@/entities/booking.entity';
import { BookingStatus } from '@/assets/enum/payment.enum';

@Injectable()
export class BookingService {
  constructor(private readonly bookingRepository: BookingRepository) {}

  public async getAvailableRooms(
    payload: GetAvailableRoomsRequestDto,
  ): Promise<GetAvailableRoomsResponseDto> {
    return await this.bookingRepository.getAvailableRooms(payload);
  }

  public async createBooking(
    payload: CreateBookingRequestDto,
    userId: number,
  ): Promise<CreateBookingResponseDto> {
    return await this.bookingRepository.createBooking(payload, userId);
  }

  public async updateBookingStatus(
    bookingId: number,
    status: BookingStatus,
    userId: number,
  ): Promise<void> {
    await this.bookingRepository.updateBooking(bookingId, status, userId);
  }

  public async cancelBooking(bookingId: number, userId: number): Promise<void> {
    await this.bookingRepository.cancelBooking(bookingId, userId);
  }

  public async getUserBookings(userId: number): Promise<any[]> {
    const rawBookings = await this.bookingRepository.getUserBookings(userId);
    return rawBookings.map((b) => ({
      id: b.id,
      bookingCode: b.bookingCode,
      startDate: b.startDate,
      endDate: b.endDate,
      roomNumber: b.roomNumber,
      guestCount: b.guestCount,
      note: b.note,
      status: b.status,
      totalAmount: b.totalAmount,
      currency: b.currency,
      createdAt: b.createdAt,
      location: {
        id: b.locationId,
        name: b.locationName,
        price: b.price,
        priceUnit: b.priceUnit,
        area: b.area,
        address: b.fullAddress,
        thumbnailUrl: b.thumbnailUrl,
      },
    }));
  }
}
