import { LocationController } from '@/controllers/owner/location.controller';
import { LocationService } from '@/services/owner/location.service';
import { Module } from '@nestjs/common';
import { LocationModule } from './location.module';

@Module({
  imports: [LocationModule],
  controllers: [LocationController],
  providers: [LocationService],
})
export class OwnerModule {}
