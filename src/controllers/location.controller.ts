import {
  Body,
  Controller,
  Get,
  Post,
  Param,
  ParseIntPipe,
  Query,
} from '@nestjs/common';
import { ApiBody } from '@nestjs/swagger';
import {
  CreateLocationRequestDto,
  CreateLocationResponseDto,
} from '@/dtos/location/createLocation.dto';
import {
  GetLocationsQueryDto,
  GetLocationsResponseDto,
  LocationDetailResponseDto,
  LocationTypeResponseDto,
} from '@/dtos/location/getLocations.dto';
import { LocationService } from '@/services/location.service';
import { Public } from '@/common/jwt/public.decorator';
import { User } from '@/user.decorator';
import { UserRole } from '@assets/enum/user.enum';

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

  @Post()
  public async createLocation(
    @User('id') ownerId: number,
    @User('role') userRole: UserRole,
    @Body() payload: CreateLocationRequestDto,
  ): Promise<CreateLocationResponseDto> {
    return await this.locationService.createLocation(
      ownerId,
      userRole,
      payload,
    );
  }

  @Get('location-types')
  @Public()
  public async getLocationTypes(): Promise<LocationTypeResponseDto[]> {
    return await this.locationService.getLocationTypes();
  }

  @Get('owner/me')
  public async getOwnerLocations(
    @User('id') ownerId: number,
  ): Promise<GetLocationsResponseDto> {
    return await this.locationService.getOwnerLocations(ownerId);
  }

  @Get(':id')
  @Public()
  public async getLocationById(
    @Param('id', ParseIntPipe) id: number,
  ): Promise<LocationDetailResponseDto> {
    return await this.locationService.getLocationById(id);
  }

  @Get(':id/related')
  @Public()
  public async getRelatedLocations(
    @Param('id', ParseIntPipe) id: number,
  ): Promise<GetLocationsResponseDto> {
    return await this.locationService.getRelatedLocations(id);
  }
}
