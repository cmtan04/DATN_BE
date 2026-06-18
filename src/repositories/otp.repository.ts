import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { TBOTP } from '@/entities/otp.entity';
import { MoreThan, Repository } from 'typeorm';

@Injectable()
export class OtpRepository {
  constructor(
    @InjectRepository(TBOTP)
    private readonly otpRepository: Repository<TBOTP>,
  ) {}

  async deleteOldOtps(email: string): Promise<void> {
    await this.otpRepository.delete({ email });
  }

  async saveNewOtp(
    email: string,
    otp: string,
    expiresAt: Date,
  ): Promise<TBOTP> {
    const newOtp = this.otpRepository.create({ email, otp, expiresAt });
    return await this.otpRepository.save(newOtp);
  }

  async saveNewToken(
    email: string,
    resetToken: string,
    tokenExpiresAt: Date,
  ): Promise<TBOTP> {
    const newToken = this.otpRepository.create({
      email,
      resetToken,
      tokenExpiresAt,
    });
    return await this.otpRepository.save(newToken);
  }

  async findValidOtp(email: string): Promise<TBOTP | null> {
    return await this.otpRepository.findOne({
      where: {
        email,
        expiresAt: MoreThan(new Date()),
      },
    });
  }

  async getRecordFromToken(resetToken: string): Promise<TBOTP | null> {
    return await this.otpRepository.findOne({
      where: { resetToken, tokenExpiresAt: MoreThan(new Date()) },
    });
  }
}
