import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { BookingController } from '@/controllers/booking.controller';
import { BookingService } from '@/services/booking.service';
import { BookingRepository } from '@/repositories/booking.repository';
import { TBBooking } from '@/entities/booking.entity';
import { TBLocationAvailability } from '@/entities/location_availability.entity';
import { LocationModule } from './location.module';

@Module({
  imports: [
    TypeOrmModule.forFeature([TBBooking, TBLocationAvailability]),
    LocationModule,
  ],
  controllers: [BookingController],
  providers: [BookingService, BookingRepository],
  exports: [BookingService],
})
export class BookingModule {}
