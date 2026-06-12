import {
  Body,
  Controller,
  Get,
  Post,
  Param,
  ParseIntPipe,
  Query,
} from '@nestjs/common';
import {
  CreateLocationRequestDto,
  CreateLocationResponseDto,
} from '@/dtos/location/createLocation.dto';
import {
  GetLocationsQueryDto,
  GetLocationsResponseDto,
  GetLocationDetailResponseDto,
  GetLocationTypeResponseDto,
} from '@/dtos/location/getLocations.dto';
import { LocationService } from '@/services/location.service';
import { Public } from '@/common/decorators/public.decorator';
import { User } from '@/common/decorators/user.decorator';
import { UserRole } from '@assets/enum/user.enum';
import { Role } from '@/common/decorators/role.decorator';

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

  @Get('location-types')
  @Public()
  public async getLocationTypes(): Promise<GetLocationTypeResponseDto[]> {
    return await this.locationService.getLocationTypes();
  }

  @Get(':id')
  @Public()
  public async getLocationDetail(
    @Param('id', ParseIntPipe) id: number,
  ): Promise<GetLocationDetailResponseDto | null> {
    return await this.locationService.getLocationDetail(id);
  }

  // @Get(':id/related')
  // @Public()
  // public async getRelatedLocations(
  //   @Param('id', ParseIntPipe) id: number,
  // ): Promise<GetLocationsResponseDto> {
  //   return await this.locationService.getRelatedLocations(id);
  // }
}
