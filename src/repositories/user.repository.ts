import {
  GetCurrentUserResponseDto,
  UserProfileResponseDto,
} from '@/dtos/user/user.dto';
import { TBUserDefault } from '@/entities/user/user_default.entity';
import { TBUserProfile } from '@/entities/user/user_profile.entity';
import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';

export interface UpdateUserProfileData {
  fullName?: string;
  phoneNumber?: string;
  avatarUrl?: string | null;
}

@Injectable()
export class UserRepository {
  @InjectRepository(TBUserDefault)
  private readonly user: Repository<TBUserDefault>;

  @InjectRepository(TBUserProfile)
  private readonly userProfile: Repository<TBUserProfile>;

  public async findById(userId: number): Promise<TBUserDefault | null> {
    return await this.user.findOne({ where: { id: userId } });
  }

  public async findProfileById(
    profileId: number,
  ): Promise<TBUserProfile | null> {
    return await this.userProfile.findOne({ where: { id: profileId } });
  }

  public async updateProfile(
    profileId: number,
    data: UpdateUserProfileData,
  ): Promise<void> {
    await this.userProfile.update(profileId, data);
  }

  public mapToCurrentUserResponse(
    user: TBUserDefault,
    profile: TBUserProfile | null,
  ): GetCurrentUserResponseDto {
    return {
      id: user.id,
      email: user.email,
      userRole: user.userRole,
      status: user.status,
      profile: profile ? this.mapProfile(profile) : null,
    };
  }

  private mapProfile(profile: TBUserProfile): UserProfileResponseDto {
    return {
      fullName: profile.fullName,
      phoneNumber: profile.phoneNumber,
      avatarUrl: profile.avatarUrl ?? undefined,
    };
  }
}
