import { UserRole } from '@/assets/enum/user.enum';
import { Role } from '@/common/decorators/role.decorator';
import { User } from '@/common/decorators/user.decorator';
import {
  CreateLocationRequestDto,
  CreateLocationResponseDto,
} from '@/dtos/location/createLocation.dto';
import {
  GetLocationsQueryDto,
  GetLocationsResponseDto,
} from '@/dtos/location/getLocations.dto';
import { LocationService } from '@/services/owner/location.service';
import { Body, Get, Post, Controller, Query } from '@nestjs/common';

@Controller('owner/location')
@Role(UserRole.OWNER)
export class LocationController {
  constructor(private readonly locationService: LocationService) {}
  @Post()
  public async createLocation(
    @User('id') ownerId: number,
    @Body() payload: CreateLocationRequestDto,
  ): Promise<CreateLocationResponseDto> {
    return await this.locationService.createLocation(ownerId, payload);
  }

  @Get()
  public async getOwnerLocations(
    @Query() query: GetLocationsQueryDto,
    @User('id') ownerId: number,
  ): Promise<GetLocationsResponseDto> {
    return await this.locationService.getOwnerLocations(ownerId, query);
  }
}
