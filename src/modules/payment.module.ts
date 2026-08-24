import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { PaymentController } from '@/controllers/payment.controller';
import { PaymentService } from '@/services/payment.service';
import { PaymentPricingService } from '@/services/payment-pricing.service';
import { AuthModule } from './auth.module';
import { TBPayment } from '@/entities/payment.entity';
import { TBLocation } from '@/entities/location/location.entity';
import { TBPayosWebhookEvent } from '@/entities/payos-webhook-event.entity';
import { TBBooking } from '@/entities/booking.entity';
import { MailModule } from './mail.module';
import { TBUserDefault } from '@/entities/user/user_default.entity';
import { TBUserProfile } from '@/entities/user/user_profile.entity';
import { PayOSModule } from './payOS.module';

import { PaymentRepository } from '@/repositories/payment.repository';
import { TBRefundRequest } from '@/entities/refund_request.entity';
@Module({
  imports: [
    TypeOrmModule.forFeature([
      TBPayment,
      TBLocation,
      TBPayosWebhookEvent,
      TBBooking,
      TBUserDefault,
      TBUserProfile,
      TBRefundRequest,
    ]),
    AuthModule,
    MailModule,
    PayOSModule,
  ],
  controllers: [PaymentController],
  providers: [PaymentService, PaymentRepository, PaymentPricingService],
  exports: [PaymentService],
})
export class PaymentModule {}
