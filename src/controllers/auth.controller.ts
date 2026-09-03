import { Body, Controller, Post, Get, Headers } from '@nestjs/common';
import {
  RefreshTokenRequestDto,
  SignInRequestDto,
  SignInResponseDto,
} from '@/dtos/auth/signIn.dto';
import { SignUpRequestDto, SignUpResponseDto } from '@/dtos/auth/signUp.dto';
import { AuthService } from '@/services/auth.service';
import { Public } from '@/common/decorators/public.decorator';
import { ResetPasswordDto } from '@/dtos/auth/forgotPassword.dto';
import { LogoutRequestDto } from '@/dtos/auth/logout.dto';

@Controller('auth')
export class AuthController {
  constructor(private readonly authService: AuthService) {}

  @Public()
  @Post('sign-up')
  public async signUp(
    @Body() payload: SignUpRequestDto,
  ): Promise<SignUpResponseDto> {
    return await this.authService.signUp(payload);
  }

  @Public()
  @Post('sign-in')
  public async signIn(
    @Body() payload: SignInRequestDto,
  ): Promise<SignInResponseDto> {
    return await this.authService.signIn(payload);
  }

  @Public()
  @Post('refresh-token')
  public async refreshToken(
    @Body() payload: RefreshTokenRequestDto,
  ): Promise<SignInResponseDto> {
    return await this.authService.refreshToken(payload.refreshToken);
  }

  @Public()
  @Get('health')
  public async healthCheck(): Promise<{ status: string }> {
    await this.authService.pingDatabase();
    return { status: 'OK' };
  }

  @Public()
  @Post('reset-password')
  public async resetPassword(
    @Body() payload: ResetPasswordDto,
  ): Promise<{ message: string }> {
    await this.authService.resetPassword(payload);
    return { message: 'Password reset successfully' };
  }

  @Post('logout')
  public async logout(
    @Headers('authorization') authorization: string,
    @Body() body: LogoutRequestDto,
  ): Promise<{ message: string }> {
    const accessToken = (authorization ?? '').replace('Bearer ', '');
    await this.authService.logout(accessToken, body.refreshToken);
    return { message: 'Logged out successfully' };
  }
}
