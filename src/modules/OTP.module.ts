import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { TBOTP } from '@/entities/otp.entity';
import { OtpRepository } from '@/repositories/otp.repository';
import { OtpService } from '@/services/OTP.service';
import { OtpController } from '@/controllers/OTP.controller';
import { MailModule } from './mail.module';

@Module({
  imports: [TypeOrmModule.forFeature([TBOTP]), MailModule],
  providers: [OtpService, OtpRepository],
  controllers: [OtpController],
  exports: [OtpService],
})
export class OtpModule {}
