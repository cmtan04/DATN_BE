import { Injectable } from '@nestjs/common';
import { BookingRepository } from '@/repositories/booking.repository';
import {
  GetAvailableRoomsRequestDto,
  GetAvailableRoomsResponseDto,
} from '@/dtos/booking.dto';

@Injectable()
export class BookingService {
  constructor(private readonly bookingRepository: BookingRepository) {}

  public async getAvailableRooms(
    payload: GetAvailableRoomsRequestDto,
  ): Promise<GetAvailableRoomsResponseDto> {
    return await this.bookingRepository.getAvailableRooms(payload);
  }
}
