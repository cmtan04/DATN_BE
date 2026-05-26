import { Body, Controller, Get, Patch } from '@nestjs/common';
import {
  GetCurrentUserResponseDto,
  UpdateCurrentUserRequestDto,
  UpdateCurrentUserResponseDto,
} from '@/dtos/user/user.dto';
import { UserService } from '@/services/user.service';
import { User } from '@/user.decorator';

@Controller('users')
export class UserController {
  constructor(private readonly userService: UserService) {}

  @Get('me')
  public async getCurrentUser(
    @User('id') userId: number,
  ): Promise<GetCurrentUserResponseDto> {
    return await this.userService.getCurrentUser(userId);
  }

  @Patch('me')
  public async updateCurrentUser(
    @User('id') userId: number,
    @Body() payload: UpdateCurrentUserRequestDto,
  ): Promise<UpdateCurrentUserResponseDto> {
    return await this.userService.updateCurrentUser(userId, payload);
  }
}
