import { Body, Controller, Get, Patch, Post } from '@nestjs/common';
import {
  UpdateCurrentUserRequestDto,
  User as UserDto,
} from '@/dtos/user/user.dto';
import { UserService } from '@/services/user.service';
import { User } from '@/common/decorators/user.decorator';
import { ChangePasswordDto } from '@/dtos/auth/changePassword.dto';

@Controller('users')
export class UserController {
  constructor(private readonly userService: UserService) {}

  @Get('me')
  public async getCurrentUser(@User('id') userId: number): Promise<UserDto> {
    return await this.userService.getCurrentUser(userId);
  }

  @Patch('me')
  public async updateCurrentUser(
    @User('id') userId: number,
    @Body() payload: UpdateCurrentUserRequestDto,
  ): Promise<UserDto> {
    return await this.userService.updateCurrentUser(userId, payload);
  }

  // @Post('me/owner-request')
  // public async submitOwnerRequest(
  //   @User('id') userId: number,
  // ): Promise<{ message: string }> {
  //   return await this.userService.submitOwnerRequest(userId);
  // }

  @Post('/me/change-password')
  public async changePassword(
    @Body() payload: ChangePasswordDto,
    @User('id') userId: number,
  ): Promise<{ message: string }> {
    await this.userService.changePassword(payload, userId);
    return { message: 'Password changed successfully' };
  }
}
