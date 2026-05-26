import { Controller, Get, Query } from '@nestjs/common';
import {
  GetLocationsQueryDto,
  GetLocationsResponseDto,
} from '@/dtos/location/getLocations.dto';
import { LocationService } from '@/services/location.service';
import { Public } from "@/common/jwt/public.decorator";

@Controller('locations')
export class LocationController {
  constructor(private readonly locationService: LocationService) {}

  @Get()
  @Public()
  public async getLocations(
    @Query() query: GetLocationsQueryDto,
  ): Promise<GetLocationsResponseDto> {
    return await this.locationService.getLocations(query);
  }

  @Get(':id')
  @Public()
  public async getLocationById(
    @Query('id') id: number,
  ): Promise<GetLocationsResponseDto> {
    return await this.locationService.getLocationById(id);
  }
  
}
