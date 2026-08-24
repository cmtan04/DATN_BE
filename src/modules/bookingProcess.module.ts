import { Module } from '@nestjs/common';
import { BookingProcessController } from '@/controllers/bookingProcess.controller';
import { BookingProcessService } from '@/services/bookingProcess.service';
import { BookingModule } from './booking.module';
import { PaymentModule } from './payment.module';
import { PayOSModule } from './payOS.module';
import { AuthModule } from './auth.module';
import { UserModule } from './user.module';

@Module({
  imports: [BookingModule, PaymentModule, PayOSModule, AuthModule, UserModule],
  controllers: [BookingProcessController],
  providers: [BookingProcessService],
  exports: [BookingProcessService],
})
export class BookingProcessModule {}
