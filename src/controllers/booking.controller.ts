import {
  Controller,
  Get,
  Query,
  Post,
  Body,
  Patch,
  Param,
  Delete,
} from '@nestjs/common';
import { BookingService } from '@/services/booking.service';
import {
  CreateBookingRequestDto,
  CreateBookingResponseDto,
  GetAvailableRoomsRequestDto,
  GetAvailableRoomsResponseDto,
} from '@/dtos/booking.dto';
import { Public } from '@/common/decorators/public.decorator';
import { User } from '@/common/decorators/user.decorator';
import { BookingStatus } from '@/assets/enum/payment.enum';

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

  @Get()
  public async getUserBookings(
    @User('id') userId: number,
  ): Promise<any[]> {
    return await this.bookingService.getUserBookings(userId);
  }

  @Post()
  public async createBooking(
    @Body() payload: CreateBookingRequestDto,
    @User('id') userId: number,
  ): Promise<CreateBookingResponseDto> {
    return await this.bookingService.createBooking(payload, userId);
  }

  @Patch(':id/status')
  public async updateBookingStatus(
    @Param('id') bookingId: number,
    @Body('status') status: BookingStatus,
    @User('id') userId: number,
  ): Promise<void> {
    await this.bookingService.updateBookingStatus(bookingId, status, userId);
  }

  @Delete(':id')
  public async cancelBooking(
    @Param('id') bookingId: number,
    @User('id') userId: number,
  ): Promise<void> {
    await this.bookingService.cancelBooking(bookingId, userId);
  }
}
