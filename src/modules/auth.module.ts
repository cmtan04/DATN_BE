import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { AuthController } from '@/controllers/auth.controller';
import { TBUserDefault } from '@/entities/user/user_default.entity';
import { TBUserProfile } from '@/entities/user/user_profile.entity';
import { AuthRepository } from '@/repositories/auth.repository';
import { AuthService } from '@/services/auth.service';

@Module({
  imports: [TypeOrmModule.forFeature([TBUserDefault, TBUserProfile])],
  controllers: [AuthController],
  providers: [AuthService, AuthRepository],
})
export class AuthModule {}
