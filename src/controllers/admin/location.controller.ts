import { UserRole } from '@/assets/enum/user.enum';
import { Role } from '@/common/decorators/role.decorator';
import { Controller, Get, Query } from '@nestjs/common';
import { GetLocationsQueryDto } from '@/dtos/location/getLocations.dto';
import { AdminLocationListResponseDto } from '@/dtos/admin/location.dto';
import { LocationService } from '@/services/admin/location.service';

@Controller('admin/locations')
@Role(UserRole.ADMIN)
export class LocationController {
  constructor(private readonly locationService: LocationService) {}

  @Get()
  public async getAllLocations(
    @Query() query: GetLocationsQueryDto,
  ): Promise<AdminLocationListResponseDto> {
    return await this.locationService.getAllLocations(query);
  }
}
