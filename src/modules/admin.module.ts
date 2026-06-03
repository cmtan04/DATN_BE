import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { AdminHostController } from '@/controllers/admin/host.controller';
import { TBUserDefault } from '@/entities/user/user_default.entity';
import { TBUserProfile } from '@/entities/user/user_profile.entity';
import { UserRepository } from '@/repositories/user.repository';
import { AdminService } from '@/services/admin/admin.service';
import { NotificationModule } from './notification.module';

@Module({
  imports: [
    TypeOrmModule.forFeature([TBUserDefault, TBUserProfile]),
    NotificationModule,
  ],
  controllers: [AdminHostController],
  providers: [AdminService, UserRepository],
})
export class AdminModule {}
