import {
  Body,
  Controller,
  Get,
  Param,
  ParseIntPipe,
  Post,
  Query,
  UploadedFiles,
  UseInterceptors,
} from '@nestjs/common';
import { FilesInterceptor } from '@nestjs/platform-express';
import {
  CreateLocationResponseDto,
  CreateServiceRequestDto,
  LocationUploadFile,
  ServiceResponseDto,
} from '@/dtos/location/createLocation.dto';
import type { CreateLocationPayloadInput } from '@/dtos/location/createLocation.dto';
import {
  GetLocationsQueryDto,
  GetLocationsResponseDto,
  LocationDetailResponseDto,
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

  @Get('location-types')
  @Public()
  public async getLocationTypes(): Promise<any> {
    return await this.locationService.getLocationTypes();
  }

  @Get('services')
  public async getServices(): Promise<ServiceResponseDto[]> {
    return await this.locationService.getServices();
  }

  @Post('services')
  public async createService(
    @Body() payload: CreateServiceRequestDto,
  ): Promise<ServiceResponseDto> {
    return await this.locationService.createService(payload);
  }

  @Get('owner/me')
  public async getOwnerLocations(
    @User('id') ownerId: number,
  ): Promise<GetLocationsResponseDto> {
    return await this.locationService.getOwnerLocations(ownerId);
  }

  @Post()
  @UseInterceptors(FilesInterceptor('images', 8))
  public async createLocation(
    @User('id') ownerId: number,
    @User('role') userRole: UserRole,
    @Body() payload: CreateLocationPayloadInput,
    @UploadedFiles() images?: LocationUploadFile[],
  ): Promise<CreateLocationResponseDto> {
    return await this.locationService.createLocation(
      ownerId,
      userRole,
      payload,
      images,
    );
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
