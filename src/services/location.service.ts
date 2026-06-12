import { BadRequestException, Injectable } from '@nestjs/common';
import {
  CreateLocationRequestDto,
  CreateLocationResponseDto,
} from '@/dtos/location/createLocation.dto';
import {
  GetLocationsQueryDto,
  GetLocationsResponseDto,
  GetLocationDetailResponseDto,
  LocationSortBy,
  LocationSortOrder,
  GetLocationTypeResponseDto,
} from '@/dtos/location/getLocations.dto';
import { LocationRepository } from '@/repositories/location.repository';
import { ServiceRepository } from '@/repositories/service.repository';
const MAX_LIMIT = 100;
const DEFAULT_SORT_BY: LocationSortBy = 'createdAt';
const DEFAULT_SORT_ORDER: LocationSortOrder = 'DESC';

@Injectable()
export class LocationService {
  constructor(private readonly locationRepository: LocationRepository) {}

  public async getOwnerLocations(
    ownerId: number,
  ): Promise<GetLocationsResponseDto> {
    return await this.locationRepository.getLocations(
      {
        page: 1,
        limit: MAX_LIMIT,

        sortBy: DEFAULT_SORT_BY,
        sortOrder: DEFAULT_SORT_ORDER,
      },
      ownerId,
    );
  }

  public async createLocation(
    ownerId: number,
    payload: CreateLocationRequestDto,
  ): Promise<CreateLocationResponseDto> {
    return await this.locationRepository.createLocation({
      ...payload,
      ownerId,
    });
  }

  public async getLocations(
    query: GetLocationsQueryDto,
  ): Promise<GetLocationsResponseDto> {
    return await this.locationRepository.getLocations(query);
  }

  public async getLocationDetail(
    id: number,
  ): Promise<GetLocationDetailResponseDto | null> {
    if (id <= 0) {
      throw new BadRequestException('Invalid location ID');
    }
    return await this.locationRepository.getLocationDetail(id);
  }

  public async getLocationTypes(): Promise<GetLocationTypeResponseDto[]> {
    return await this.locationRepository.getAllLocationTypes();
  }

  // public async getRelatedLocations(
  //   id: number,
  // ): Promise<GetLocationsResponseDto> {
  //   if (id <= 0) {
  //     throw new BadRequestException('Invalid location ID');
  //   }
  //   return await this.locationRepository.findRelatedLocations(id);
  // }
}
