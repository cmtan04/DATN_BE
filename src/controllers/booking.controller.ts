import { Controller, Get, Query } from '@nestjs/common';
import { BookingService } from '@/services/booking.service';
import {
  GetAvailableRoomsRequestDto,
  GetAvailableRoomsResponseDto,
} from '@/dtos/booking.dto';
import { Public } from '@/common/decorators/public.decorator';

@Controller('booking')
export class BookingController {
  constructor(private readonly bookingService: BookingService) {}

  @Get('available-rooms')
  @Public()
  public async getAvailableRooms(
    @Query() payload: GetAvailableRoomsRequestDto,
  ): Promise<GetAvailableRoomsResponseDto> {
    return await this.bookingService.getAvailableRooms(payload);
  }
}
