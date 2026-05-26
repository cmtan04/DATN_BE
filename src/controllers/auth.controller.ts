import { Body, Controller, Post } from '@nestjs/common';
import { SignInRequestDto, SignInResponseDto } from '@/dtos/auth/signIn.dto';
import { SignUpRequestDto, SignUpResponseDto } from '@/dtos/auth/signUp.dto';
import { AuthService } from '@/services/auth.service';
import { Public } from "@/common/jwt/public.decorator";

@Controller('auth')
export class AuthController {
  constructor(private readonly authService: AuthService) {}

  @Post('sign-up')
  @Public()
  public async signUp(
    @Body() payload: SignUpRequestDto,
  ): Promise<SignUpResponseDto> {
    return await this.authService.signUp(payload);
  }

  @Post('sign-in')
  @Public()
  public async signIn(
    @Body() payload: SignInRequestDto,
  ): Promise<SignInResponseDto> {
    return await this.authService.signIn(payload);
  }

  @Post('refresh-token')
  @Public()
  public async refreshToken(
    @Body() payload: { refreshToken: string },
  ): Promise<SignInResponseDto> {
    return await this.authService.refreshToken(payload.refreshToken);
  }
}
