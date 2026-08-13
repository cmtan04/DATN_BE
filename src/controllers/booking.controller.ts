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
  CancelBookingRequestDto,
  CancelBookingResponseDto,
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

  @Post()
  public async createBooking(
    @User('id') userId: number,
    @Body() payload: CreateBookingRequestDto,
  ): Promise<CreateBookingResponseDto> {
    return await this.bookingService.createBooking(userId, payload);
  }

  @Post('cancel')
  public async cancelBooking(
    @User('id') userId: number,
    @Body() payload: CancelBookingRequestDto,
  ): Promise<CancelBookingResponseDto> {
    return await this.bookingService.cancelBooking(payload, userId);
  }
}
