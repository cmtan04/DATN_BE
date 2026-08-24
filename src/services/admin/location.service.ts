import { Injectable } from '@nestjs/common';
import { LocationRepository } from '@/repositories/location.repository';
import { GetLocationsQueryDto } from '@/dtos/location/getLocations.dto';
import { AdminLocationListResponseDto } from '@/dtos/admin/location.dto';

@Injectable()
export class LocationService {
  constructor(private readonly locationRepository: LocationRepository) {}

  public async getAllLocations(
    filter: GetLocationsQueryDto,
  ): Promise<AdminLocationListResponseDto> {
    return await this.locationRepository.getAdminLocations(filter);
  }
}

