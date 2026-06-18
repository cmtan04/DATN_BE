import { ApiProperty } from '@nestjs/swagger';
import { IsEmail, IsString } from 'class-validator';

export class OtpRequestDto {
  @ApiProperty({ example: 'caotancaotan2206@gmail.com' })
  @IsEmail({}, { message: 'Vui lòng cung cấp email hợp lệ!' })
  email: string;
}

export class VerifyOtpDto extends OtpRequestDto {
  @ApiProperty()
  @IsString({ message: 'Mã OTP phải là một chuỗi hợp lệ!' })
  otp: string;
}

export class VerifyResetTokenDto {
  @ApiProperty()
  @IsString({ message: 'Mã token xác thực phải là một chuỗi hợp lệ!' })
  resetToken: string;
}
