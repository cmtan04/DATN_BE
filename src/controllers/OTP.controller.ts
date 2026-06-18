// src/otp/otp.controller.ts
import { Controller, Post, Body, BadRequestException } from '@nestjs/common';
import { OtpService } from '@/services/OTP.service';
import { Public } from '@/common/decorators/public.decorator';
import { OtpRequestDto, VerifyOtpDto } from '@/dtos/OTP.dto';

@Controller('otp')
export class OtpController {
  constructor(private readonly otpService: OtpService) {}

  @Post('send')
  @Public()
  async sendOtp(
    @Body() payload: OtpRequestDto,
  ): Promise<{ success: boolean; message: string }> {
    if (!payload.email) {
      throw new BadRequestException('Vui lòng cung cấp email hợp lệ!');
    }
    return this.otpService.sendOtp(payload.email);
  }

  @Post('verify')
  @Public()
  async verifyOtp(
    @Body() payload: VerifyOtpDto,
  ): Promise<{ success: boolean; message: string; resetToken?: string }> {
    if (!payload.email || !payload.otp) {
      throw new BadRequestException('Vui lòng cung cấp đầy đủ email và OTP!');
    }
    return this.otpService.verifyOtp(payload);
  }
}
