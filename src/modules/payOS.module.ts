import { Module } from '@nestjs/common';
import { PayOSService } from '@/services/payos.service';

@Module({
  providers: [PayOSService],
  exports: [PayOSService],
})
export class PayOSModule {}
