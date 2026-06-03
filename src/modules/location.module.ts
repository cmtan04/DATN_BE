import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { LocationController } from '@/controllers/location.controller';
import { TBLocationAddress } from '@/entities/location/location-address.entity';
import { TBLocationMedia } from '@/entities/location/location_media.entity';
import { TBLocationService } from '@/entities/location/location_service.entity';
import { TBLocationType } from '@/entities/location/location_type.entity';
import { TBLocation } from '@/entities/location/location.entity';
import { TBService } from '@/entities/service.entity';
import { LocationRepository } from '@/repositories/location.repository';
import { LocationService } from '@/services/location.service';

@Module({
  imports: [
    TypeOrmModule.forFeature([
      TBLocation,
      TBLocationAddress,
      TBLocationMedia,
      TBLocationService,
      TBLocationType,
      TBService,
    ]),
  ],
  controllers: [LocationController],
  providers: [LocationService, LocationRepository],
})
export class LocationModule {}
