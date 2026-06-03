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
import { AdminService } from '@/services/admin/admin.service';
import { UpdateHostStatusRequestDto } from '@/dtos/admin/host.dto';
import type {
  AdminHostResponseDto,
  AdminHostStatusQuery,
} from '@/dtos/admin/host.dto';
import { User } from '@/user.decorator';
import { UserRole } from '@assets/enum/user.enum';

@Controller('admin')
@ApiTags('Admin')
export class AdminHostController {
  constructor(private readonly adminService: AdminService) {}

  @Get('/hosts')
  public async getHosts(
    @User('role') adminRole: UserRole,
    @Query('status') status?: AdminHostStatusQuery,
  ): Promise<AdminHostResponseDto[]> {
    return await this.adminService.getHosts(adminRole, status);
  }

  @Patch('/hosts/:userId/status')
  public async updateHostStatus(
    @User('role') adminRole: UserRole,
    @Param('userId', ParseIntPipe) userId: number,
    @Body() payload: UpdateHostStatusRequestDto,
  ): Promise<AdminHostResponseDto> {
    return await this.adminService.updateHostStatus(adminRole, userId, payload);
  }
}
