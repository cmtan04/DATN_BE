import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { UserController } from '@/controllers/user.controller';
import { TBUserDefault } from '@/entities/user/user_default.entity';
import { TBUserProfile } from '@/entities/user/user_profile.entity';
import { UserRepository } from '@/repositories/user.repository';
import { UserService } from '@/services/user.service';

@Module({
  imports: [TypeOrmModule.forFeature([TBUserDefault, TBUserProfile])],
  controllers: [UserController],
  providers: [UserService, UserRepository],
})
export class UserModule {}
