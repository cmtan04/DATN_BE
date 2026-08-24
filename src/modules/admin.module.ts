import { Module } from '@nestjs/common';
import { OwnerController } from '@/controllers/admin/owner.controller';
import { OwnerService } from '@/services/admin/owner.service';
import { NotificationModule } from './notification.module';
import { UserModule } from './user.module';
import { LocationController } from '@/controllers/admin/location.controller';
import { LocationModule } from './location.module';
import { LocationService } from '@/services/admin/location.service';

@Module({
  imports: [UserModule, LocationModule, NotificationModule],
  controllers: [OwnerController, LocationController],
  providers: [OwnerService, LocationService],
})
export class AdminModule {}
