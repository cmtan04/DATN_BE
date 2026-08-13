import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { BookingController } from '@/controllers/booking.controller';
import { BookingService } from '@/services/booking.service';
import { BookingRepository } from '@/repositories/booking.repository';
import { TBBooking } from '@/entities/booking.entity';
import { TBLocationAvailability } from '@/entities/location_availability.entity';
import { TBPayment } from '@/entities/payment.entity';
import { TBRefundRequest } from '@/entities/refund_request.entity';
import { PayosService } from '@/services/payos.service';
import { LocationModule } from './location.module';

@Module({
  imports: [
    TypeOrmModule.forFeature([
      TBBooking,
      TBLocationAvailability,
      TBPayment,
      TBRefundRequest,
    ]),
    LocationModule,
  ],
  controllers: [BookingController],
  providers: [BookingService, BookingRepository, PayosService],
  exports: [BookingService, BookingRepository, TypeOrmModule],
})
export class BookingModule {}
