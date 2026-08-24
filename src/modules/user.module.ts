import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { UserController } from '@/controllers/user.controller';
import { TBUserDefault } from '@/entities/user/user_default.entity';
import { TBUserProfile } from '@/entities/user/user_profile.entity';
import { UserRepository } from '@/repositories/user.repository';
import { UserService } from '@/services/user.service';
import { NotificationModule } from './notification.module';
import { AuthModule } from './auth.module';
import { BookingModule } from './booking.module';

@Module({
  imports: [
    TypeOrmModule.forFeature([TBUserDefault, TBUserProfile]),
    NotificationModule,
    AuthModule,
    BookingModule,
  ],
  controllers: [UserController],
  providers: [UserService, UserRepository],
  exports: [UserService, UserRepository],
})
export class UserModule {}
