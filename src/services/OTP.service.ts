// src/otp/otp.service.ts
import {
  Injectable,
  InternalServerErrorException,
  BadRequestException,
  NotFoundException,
} from '@nestjs/common';
import { OtpRepository } from '@/repositories/otp.repository';
import * as nodemailer from 'nodemailer';
import 'dotenv/config';
import * as crypto from 'node:crypto';
import { VerifyOtpDto, VerifyResetTokenDto } from '@/dtos/OTP.dto';

@Injectable()
export class OtpService {
  private readonly transporter: nodemailer.Transporter;

  constructor(
    // Inject Custom Repository thay vì Repository mặc định
    private readonly otpRepository: OtpRepository,
  ) {
    this.transporter = nodemailer.createTransport({
      host: 'smtp.gmail.com',
      port: 465,
      secure: true,
      auth: {
        user: process.env.NODEMAILER_USER,
        pass: process.env.NODEMAILER_PASS,
      },
    });
  }

  public async deleteOldOtps(email: string): Promise<void> {
    await this.otpRepository.deleteOldOtps(email);
  }

  private async saveNewOtp(email: string): Promise<string> {
    await this.deleteOldOtps(email); // Xóa OTP cũ trước khi lưu OTP mới
    const otpCode = Math.floor(100000 + Math.random() * 900000).toString();
    const expiresAt = new Date();
    expiresAt.setMinutes(expiresAt.getMinutes() + 5);
    await this.otpRepository.saveNewOtp(email, otpCode, expiresAt);
    return otpCode; // Trả về OTP để sử dụng trong email
  }

  private async findValidOtp(email: string): Promise<string> {
    const validOtp = await this.otpRepository.findValidOtp(email);
    if (!validOtp) {
      throw new NotFoundException(
        'Không tìm thấy OTP hợp lệ cho email này hoặc đã hết hạn!',
      );
    }
    return validOtp.otp;
  }

  public async saveNewToken(email: string): Promise<string> {
    // 1. Tạo chuỗi token ngẫu nhiên bảo mật cao (độ dài 64 ký tự)
    const resetToken = crypto.randomBytes(32).toString('hex');
    // 2. Thiết lập thời gian hết hạn cho Token (Hiện tại + 5 phút)
    const tokenExpiresAt = new Date();
    tokenExpiresAt.setMinutes(tokenExpiresAt.getMinutes() + 5);
    await this.otpRepository.saveNewToken(email, resetToken, tokenExpiresAt);
    return resetToken;
  }

  public async sendOtp(
    email: string,
  ): Promise<{ success: boolean; message: string }> {
    const otpCode = await this.saveNewOtp(email);

    const mailOptions = {
      from: `"Hệ thống Xác thực" <${process.env.NODEMAILER_USER}>`,
      to: email,
      subject: '[Hostings] Mã xác thực OTP của bạn ',
      html: `
          <div style="font-family: Arial, sans-serif; max-width: 500px; margin: auto; padding: 20px; border: 1px solid #ddd; border-radius: 10px;">
            <h2 style="color: #1a73e8; text-align: center;">MÃ XÁC THỰC OTP</h2>
            <p>Mã OTP của bạn là:</p>
            <div style="text-align: center; margin: 25px 0;">
              <span style="font-size: 30px; font-weight: bold; color: #202124; background: #f1f3f4; padding: 10px 20px; border-radius: 5px; letter-spacing: 4px; border: 1px dashed #1a73e8;">
                ${otpCode}
              </span>
            </div>
            <p style="color: #5f6368; font-size: 13px;">⚠️ Mã chỉ có hiệu lực trong vòng <b>5 phút</b>.</p>
          </div>
        `,
    };
    try {
      await this.transporter.sendMail(mailOptions);

      return {
        success: true,
        message: 'Mã OTP đã được gửi thành công!',
      };
    } catch (error) {
      console.error('Lỗi sendOtp:', error);
      throw new InternalServerErrorException(
        'Không thể gửi OTP, vui lòng thử lại sau.',
      );
    }
  }

  public async verifyOtp({ email, otp }: VerifyOtpDto): Promise<{
    success: boolean;
    message: string;
    resetToken?: string;
  }> {
    const validOtp = await this.findValidOtp(email);
    if (validOtp !== otp) {
      throw new BadRequestException('Mã OTP không chính xác hoặc đã hết hạn!');
    }

    const resetToken = await this.saveNewToken(email);

    return {
      success: true,
      message: 'Xác thực mã OTP thành công!',
      resetToken,
    };
  }

  public async getEmailFromToken({
    resetToken,
  }: VerifyResetTokenDto): Promise<string> {
    const record = await this.otpRepository.getRecordFromToken(resetToken);
    if (!record) {
      throw new NotFoundException(
        'Không tìm thấy token hợp lệ cho email này hoặc đã hết hạn!',
      );
    }

    return record.email;
  }
}
