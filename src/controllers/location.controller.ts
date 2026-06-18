import {
  Controller,
  Get,
  Post,
  Param,
  ParseIntPipe,
  Query,
} from '@nestjs/common';
import {
  GetLocationsQueryDto,
  GetLocationsResponseDto,
  GetLocationDetailResponseDto,
  GetLocationTypeResponseDto,
} from '@/dtos/location/getLocations.dto';
import { LocationService } from '@/services/location.service';
import { Public } from '@/common/decorators/public.decorator';
import { User } from '@/common/decorators/user.decorator';

@Controller('locations')
export class LocationController {
  constructor(private readonly locationService: LocationService) {}

  @Get()
  @Public()
  public async getLocations(
    @Query() query: GetLocationsQueryDto,
    @User('id') userId?: number,
  ): Promise<GetLocationsResponseDto> {
    return await this.locationService.getLocations(query, userId);
  }

  @Get('location-types')
  @Public()
  public async getLocationTypes(): Promise<GetLocationTypeResponseDto[]> {
    return await this.locationService.getLocationTypes();
  }

  @Get(':id')
  @Public()
  public async getLocationDetail(
    @Param('id', ParseIntPipe) id: number,
    @User('id') userId?: number,
  ): Promise<GetLocationDetailResponseDto | null> {
    return await this.locationService.getLocationDetail(id, userId);
  }

  @Get(':id/related')
  @Public()
  public async getRelatedLocations(
    @Param('id', ParseIntPipe) id: number,
    @User('id') userId?: number,
  ): Promise<GetLocationsResponseDto> {
    return await this.locationService.getRelatedLocations(id, userId);
  }

  @Post(':id/toggle-favourite')
  public async toggleFavouriteLocation(
    @Param('id', ParseIntPipe) locationId: number,
    @User('id') userId: number,
  ): Promise<{ isFavourite: boolean }> {
    return await this.locationService.toggleFavouriteLocation(
      userId,
      locationId,
    );
  }
}
