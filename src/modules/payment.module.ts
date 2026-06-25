import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { PaymentController } from '@/controllers/payment.controller';
import { PaymentService } from '@/services/payment.service';
import { PaymentPricingService } from '@/services/payment-pricing.service';
import { BookingModule } from './booking.module';
import { TBPayment } from '@/entities/payment.entity';
import { TBLocation } from '@/entities/location/location.entity';

@Module({
  imports: [
    TypeOrmModule.forFeature([TBPayment, TBLocation]),
    BookingModule,
  ],
  controllers: [PaymentController],
  providers: [PaymentService, PaymentPricingService],
  exports: [PaymentService],
})
export class PaymentModule {}
