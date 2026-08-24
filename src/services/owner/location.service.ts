import { Injectable } from '@nestjs/common';
import { LocationRepository } from '@/repositories/location.repository';
import {
  GetLocationsResponseDto,
  GetLocationsQueryDto,
} from '@/dtos/location/getLocations.dto';
import {
  CreateLocationRequestDto,
  CreateLocationResponseDto,
} from '@/dtos/location/createLocation.dto';
import { Transactional } from 'typeorm-transactional';

@Injectable()
export class LocationService {
  constructor(private readonly locationRepository: LocationRepository) {}

  public async getOwnerLocations(
    ownerId: number,
    filter: GetLocationsQueryDto,
  ): Promise<GetLocationsResponseDto> {
    return await this.locationRepository.getLocations(
      filter,
      undefined,
      ownerId,
    );
  }

  @Transactional()
  public async createLocation(
    ownerId: number,
    payload: CreateLocationRequestDto,
  ): Promise<CreateLocationResponseDto> {
    return await this.locationRepository.createLocation({
      ...payload,
      ownerId,
    });
  }
}
