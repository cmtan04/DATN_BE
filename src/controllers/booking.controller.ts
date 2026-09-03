import { Controller, Get, Query, Post, Body } from '@nestjs/common';
import { BookingService } from '@/services/booking.service';
import {
  CreateBookingRequestDto,
  CreateBookingResponseDto,
  GetAvailableRoomsRequestDto,
  GetAvailableRoomsResponseDto,
  GetUserBookingsRequestDto,
  GetUserBookingsResponseDto,
} from '@/dtos/booking.dto';
import { Public } from '@/common/decorators/public.decorator';
import { User } from '@/common/decorators/user.decorator';

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

  @Get('me')
  public async getUserBookings(
    @User('id') userId: number,
    @Query() query: GetUserBookingsRequestDto,
  ): Promise<GetUserBookingsResponseDto> {
    return await this.bookingService.getUserBookings(userId, query);
  }

  @Post()
  public async createBooking(
    @User('id') userId: number,
    @Body() payload: CreateBookingRequestDto,
  ): Promise<CreateBookingResponseDto> {
    return await this.bookingService.createBooking(userId, payload);
  }
}
