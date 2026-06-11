import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { TypeOrmModule } from '@nestjs/typeorm';
import { PaymentController } from '@/controllers/payment.controller';
import { TBBooking } from '@/entities/booking.entity';
import { TBLocation } from '@/entities/location/location.entity';
import { TBLocationAvailability } from '@/entities/location_availability.entity';
import { TBPayosWebhookEvent } from '@/entities/payos-webhook-event.entity';
import { TBPayment } from '@/entities/payment.entity';
import { NotificationModule } from '@/modules/notification.module';
import { PaymentRepository } from '@/repositories/payment.repository';
import { PaymentPricingService } from '@/services/payment-pricing.service';
import { PaymentService } from '@/services/payment.service';
import { PayosService } from '@/services/payos.service';

@Module({
  imports: [
    ConfigModule,
    NotificationModule,
    TypeOrmModule.forFeature([
      TBBooking,
      TBLocation,
      TBLocationAvailability,
      TBPayment,
      TBPayosWebhookEvent,
    ]),
  ],
  controllers: [PaymentController],
  providers: [
    PaymentService,
    PaymentPricingService,
    PaymentRepository,
    PayosService,
  ],
})
export class PaymentModule {}
