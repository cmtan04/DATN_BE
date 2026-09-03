import {
  BadRequestException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import {
  GetLocationsQueryDto,
  GetLocationsResponseDto,
  GetLocationDetailResponseDto,
  GetLocationTypeResponseDto,
} from '@/dtos/location/getLocations.dto';
import { LocationRepository } from '@/repositories/location.repository';

@Injectable()
export class LocationService {
  constructor(private readonly locationRepository: LocationRepository) {}

  public async getLocations(
    query: GetLocationsQueryDto,
    userId?: number,
  ): Promise<GetLocationsResponseDto> {
    return await this.locationRepository.getLocations(query, userId);
  }

  public async getLocationDetail(
    id: number,
    userId?: number,
  ): Promise<GetLocationDetailResponseDto | null> {
    if (id <= 0) {
      throw new BadRequestException('Invalid location ID');
    }
    return await this.locationRepository.getLocationDetail(id, userId);
  }

  public async getLocationTypes(): Promise<GetLocationTypeResponseDto[]> {
    return await this.locationRepository.getAllLocationTypes();
  }

  public async getRelatedLocations(
    id: number,
    userId?: number,
  ): Promise<GetLocationsResponseDto> {
    if (id <= 0) {
      throw new BadRequestException('Invalid location ID');
    }
    return await this.locationRepository.findRelatedLocations(id, userId);
  }

  public async toggleFavouriteLocation(
    userId: number,
    locationId: number,
  ): Promise<{ isFavourite: boolean }> {
    if (locationId <= 0) {
      throw new BadRequestException('Invalid location ID');
    }
    const exists = await this.locationRepository.locationExists(locationId);
    if (!exists) {
      throw new NotFoundException('Location not found');
    }
    return await this.locationRepository.toggleFavouriteLocation(
      userId,
      locationId,
    );
  }
}
