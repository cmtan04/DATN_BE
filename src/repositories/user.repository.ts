import {
  AdminHostResponseDto,
  AdminHostStatusQuery,
} from '@/dtos/admin/host.dto';
import {
  GetCurrentUserResponseDto,
  UserProfileResponseDto,
} from '@/dtos/user/user.dto';
import { TBUserDefault } from '@/entities/user/user_default.entity';
import { TBUserProfile } from '@/entities/user/user_profile.entity';
import { OwnerRequestStatus, UserRole } from '@assets/enum/user.enum';
import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { In, Repository } from 'typeorm';

export interface UpdateUserProfileData {
  fullName?: string;
  phoneNumber?: string;
  avatarUrl?: string | null;
}

export interface UpdateOwnerRequestData {
  ownerRequestStatus: OwnerRequestStatus;
  userRole?: UserRole;
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

  public async findAdmins(): Promise<TBUserDefault[]> {
    return await this.user.find({
      where: { userRole: UserRole.ADMIN },
    });
  }

  public async updateProfile(
    profileId: number,
    data: UpdateUserProfileData,
  ): Promise<void> {
    await this.userProfile.update(profileId, data);
  }

  public async updateOwnerRequest(
    userId: number,
    data: UpdateOwnerRequestData,
  ): Promise<void> {
    await this.user.update(userId, {
      ownerRequestStatus: data.ownerRequestStatus,
      isApplyingForOwner:
        data.ownerRequestStatus === OwnerRequestStatus.PENDING,
      ...(data.userRole !== undefined ? { userRole: data.userRole } : {}),
    });
  }

  public async findHosts(
    status?: AdminHostStatusQuery,
  ): Promise<AdminHostResponseDto[]> {
    const ownerRequestStatus = status
      ? this.mapHostStatusQuery(status)
      : [
          OwnerRequestStatus.PENDING,
          OwnerRequestStatus.APPROVED,
          OwnerRequestStatus.REJECTED,
        ];

    const users = await this.user.find({
      where: {
        ownerRequestStatus: Array.isArray(ownerRequestStatus)
          ? In(ownerRequestStatus)
          : ownerRequestStatus,
      },
      order: { updatedAt: 'DESC' },
    });

    const profileIds = users
      .map((user) => user.userProfileId)
      .filter(
        (profileId): profileId is number => typeof profileId === 'number',
      );
    const profiles = profileIds.length
      ? await this.userProfile.find({ where: { id: In(profileIds) } })
      : [];
    const profileById = new Map(
      profiles.map((profile) => [profile.id, profile]),
    );

    return users.map((user) =>
      this.mapToAdminHostResponse(
        user,
        user.userProfileId ? profileById.get(user.userProfileId) ?? null : null,
      ),
    );
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
      ownerRequestStatus: user.ownerRequestStatus,
      profile: profile ? this.mapProfile(profile) : null,
    };
  }

  public mapToAdminHostResponse(
    user: TBUserDefault,
    profile: TBUserProfile | null,
  ): AdminHostResponseDto {
    return {
      id: user.id,
      email: user.email,
      userRole: user.userRole,
      ownerRequestStatus: user.ownerRequestStatus,
      profile: profile ? this.mapProfile(profile) : null,
      updatedAt: user.updatedAt,
    };
  }

  private mapHostStatusQuery(status: AdminHostStatusQuery): OwnerRequestStatus {
    const statusMap: Record<AdminHostStatusQuery, OwnerRequestStatus> = {
      pending: OwnerRequestStatus.PENDING,
      approved: OwnerRequestStatus.APPROVED,
      rejected: OwnerRequestStatus.REJECTED,
    };

    return statusMap[status];
  }

  private mapProfile(profile: TBUserProfile): UserProfileResponseDto {
    return {
      fullName: profile.fullName,
      phoneNumber: profile.phoneNumber,
      avatarUrl: profile.avatarUrl ?? undefined,
    };
  }
}
