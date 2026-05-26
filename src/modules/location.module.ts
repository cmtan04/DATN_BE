import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { LocationController } from '@/controllers/location.controller';
import { TBLocation } from '@/entities/location/location.entity';
import { LocationRepository } from '@/repositories/location.repository';
import { LocationService } from '@/services/location.service';

@Module({
  imports: [TypeOrmModule.forFeature([TBLocation])],
  controllers: [LocationController],
  providers: [LocationService, LocationRepository],
})
export class LocationModule {}
