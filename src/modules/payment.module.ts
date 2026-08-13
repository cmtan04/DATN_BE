import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { PaymentController } from '@/controllers/payment.controller';
import { PaymentService } from '@/services/payment.service';
import { PaymentPricingService } from '@/services/payment-pricing.service';
import { BookingModule } from './booking.module';
import { AuthModule } from './auth.module';
import { TBPayment } from '@/entities/payment.entity';
import { TBLocation } from '@/entities/location/location.entity';
import { PayosService } from '@/services/payos.service';
import { TBPayosWebhookEvent } from '@/entities/payos-webhook-event.entity';
import { TBBooking } from '@/entities/booking.entity';
import { MailModule } from './mail.module';
import { TBUserDefault } from '@/entities/user/user_default.entity';

@Module({
  imports: [
    TypeOrmModule.forFeature([
      TBPayment,
      TBLocation,
      TBPayosWebhookEvent,
      TBBooking,
      TBUserDefault,
    ]),
    BookingModule,
    AuthModule,
    MailModule,
  ],
  controllers: [PaymentController],
  providers: [PaymentService, PaymentPricingService, PayosService],
  exports: [PaymentService],
})
export class PaymentModule {}
