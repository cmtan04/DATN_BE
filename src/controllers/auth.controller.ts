import { Body, Controller, Post, Get } from '@nestjs/common';
import {
  RefreshTokenRequestDto,
  SignInRequestDto,
  SignInResponseDto,
} from '@/dtos/auth/signIn.dto';
import { SignUpRequestDto, SignUpResponseDto } from '@/dtos/auth/signUp.dto';
import { AuthService } from '@/services/auth.service';
import { Public } from '@/common/decorators/public.decorator';
import { ResetPasswordDto } from '@/dtos/auth/forgotPassword.dto';

@Controller('auth')
@Public()
export class AuthController {
  constructor(private readonly authService: AuthService) {}

  @Post('sign-up')
  public async signUp(
    @Body() payload: SignUpRequestDto,
  ): Promise<SignUpResponseDto> {
    return await this.authService.signUp(payload);
  }

  @Post('sign-in')
  public async signIn(
    @Body() payload: SignInRequestDto,
  ): Promise<SignInResponseDto> {
    return await this.authService.signIn(payload);
  }

  @Post('refresh-token')
  public async refreshToken(
    @Body() payload: RefreshTokenRequestDto,
  ): Promise<SignInResponseDto> {
    return await this.authService.refreshToken(payload.refreshToken);
  }

  @Get('health')
  public async healthCheck(): Promise<{ status: string }> {
    await this.authService.pingDatabase();
    return { status: 'OK' };
  }

  @Post('reset-password')
  public async resetPassword(
    @Body() payload: ResetPasswordDto,
  ): Promise<{ message: string }> {
    await this.authService.resetPassword(payload);
    return { message: 'Password reset successfully' };
  }
}
