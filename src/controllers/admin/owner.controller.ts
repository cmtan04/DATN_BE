import {
  Body,
  Controller,
  Get,
  Param,
  ParseIntPipe,
  Patch,
  Query,
} from '@nestjs/common';
import { ApiTags } from '@nestjs/swagger';
import { OwnerService } from '@/services/admin/owner.service';
import {
  AdminOwnerListQueryDto,
  AdminOwnerListResponseDto,
  AdminOwnerResponseDto,
  UpdateOwnerStatusRequestDto,
} from '@/dtos/admin/owner.dto';
import { User } from '@/common/decorators/user.decorator';
import { UserRole } from '@assets/enum/user.enum';
import { Role } from '@/common/decorators/role.decorator';

@Controller('admin')
@ApiTags('Admin')
@Role(UserRole.ADMIN)
export class OwnerController {
  constructor(private readonly ownerService: OwnerService) {}

  @Get('/owners')
  public async getOwners(
    @User('role') adminRole: UserRole,
    @Query() query: AdminOwnerListQueryDto,
  ): Promise<AdminOwnerListResponseDto> {
    return await this.ownerService.getOwners(adminRole, query);
  }

  @Patch('/owners/:userId/status')
  public async updateOwnerStatus(
    @User('role') adminRole: UserRole,
    @Param('userId', ParseIntPipe) userId: number,
    @Body() payload: UpdateOwnerStatusRequestDto,
  ): Promise<AdminOwnerResponseDto> {
    return await this.ownerService.updateOwnerStatus(
      adminRole,
      userId,
      payload,
    );
  }
}
