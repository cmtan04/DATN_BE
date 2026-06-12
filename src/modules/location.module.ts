import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { LocationController } from '@/controllers/location.controller';
import { TBLocationAddress } from '@/entities/location/location-address.entity';
import { TBLocationMedia } from '@/entities/location/location_media.entity';
import { TBLocationService } from '@/entities/location/location_service.entity';
import { TBLocationType } from '@/entities/location/location_type.entity';
import { TBLocation } from '@/entities/location/location.entity';
import { TBLocationAvailability } from '@/entities/location_availability.entity';
import { LocationRepository } from '@/repositories/location.repository';
import { LocationService } from '@/services/location.service';
import { OwnerLocationController } from "@/controllers/owner/owner.location.controller";

@Module({
  imports: [
    TypeOrmModule.forFeature([
      TBLocation,
      TBLocationAvailability,
      TBLocationAddress,
      TBLocationMedia,
      TBLocationService,
      TBLocationType,
    ]),
  ],
  controllers: [LocationController, OwnerLocationController],
  providers: [LocationService, LocationRepository],
})
export class LocationModule {}
