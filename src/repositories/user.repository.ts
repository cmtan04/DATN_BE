import {
  AdminOwnerListQueryDto,
  AdminOwnerListResponseDto,
  AdminOwnerResponseDto,
  AdminOwnerStatusQuery,
} from '@/dtos/admin/owner.dto';
import { User, UserProfile } from '@/dtos/user/user.dto';
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
  constructor(
    @InjectRepository(TBUserDefault)
    private readonly user: Repository<TBUserDefault>,

    @InjectRepository(TBUserProfile)
    private readonly userProfile: Repository<TBUserProfile>,
  ) {}

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

  public async findOwners(
    query?: AdminOwnerListQueryDto,
  ): Promise<AdminOwnerListResponseDto> {
    const page = Math.max(1, Number(query?.page) || 1);
    const limit = Math.max(1, Number(query?.limit) || 10);
    const sortBy = query?.sortBy || 'createdAt';
    const sortOrder =
      (query?.sortOrder || 'DESC').toUpperCase() === 'ASC' ? 'ASC' : 'DESC';
    const keyword = query?.keyword?.trim();

    const qb = this.user
      .createQueryBuilder('user')
      .leftJoin(TBUserProfile, 'profile', 'profile.id = user.userProfileId');

    const ownerRequestStatus = query?.status
      ? this.mapOwnerStatusQuery(query.status)
      : [
          OwnerRequestStatus.PENDING,
          OwnerRequestStatus.APPROVED,
          OwnerRequestStatus.REJECTED,
        ];

    if (Array.isArray(ownerRequestStatus)) {
      qb.andWhere('user.ownerRequestStatus IN (:...statuses)', {
        statuses: ownerRequestStatus,
      });
    } else {
      qb.andWhere('user.ownerRequestStatus = :status', {
        status: ownerRequestStatus,
      });
    }

    if (keyword) {
      qb.andWhere(
        '(user.email LIKE :keyword OR profile.fullName LIKE :keyword OR profile.phoneNumber LIKE :keyword)',
        { keyword: `%${keyword}%` },
      );
    }

    const sortColumn =
      sortBy === 'email'
        ? 'user.email'
        : sortBy === 'createdAt'
          ? 'user.createdAt'
          : sortBy === 'ownerRequestStatus'
            ? 'user.ownerRequestStatus'
            : 'user.updatedAt';

    qb.orderBy(sortColumn, sortOrder);

    const total = await qb.getCount();
    const totalPages = Math.ceil(total / limit);

    qb.skip((page - 1) * limit).take(limit);

    const users = await qb.getMany();

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

    const data = users.map((user) =>
      this.mapToAdminOwnerResponse(
        user,
        user.userProfileId
          ? (profileById.get(user.userProfileId) ?? null)
          : null,
      ),
    );

    return {
      data,
      meta: {
        page,
        limit,
        total,
        totalPages,
      },
    };
  }

  public mapToCurrentUserResponse(
    user: TBUserDefault,
    profile: TBUserProfile,
  ): User {
    return {
      id: user.id,
      email: user.email,
      userRole: user.userRole,
      status: user.status,
      ownerRequestStatus: user.ownerRequestStatus,
      profile: this.mapProfile(profile),
    };
  }

  public mapToAdminOwnerResponse(
    user: TBUserDefault,
    profile: TBUserProfile | null,
  ): AdminOwnerResponseDto {
    return {
      id: user.id,
      email: user.email,
      userRole: user.userRole,
      ownerRequestStatus: user.ownerRequestStatus,
      profile: profile ? this.mapProfile(profile) : null,
      updatedAt: user.updatedAt,
    };
  }

  private mapOwnerStatusQuery(
    status: AdminOwnerStatusQuery,
  ): OwnerRequestStatus {
    const statusMap: Record<AdminOwnerStatusQuery, OwnerRequestStatus> = {
      pending: OwnerRequestStatus.PENDING,
      approved: OwnerRequestStatus.APPROVED,
      rejected: OwnerRequestStatus.REJECTED,
    };

    return statusMap[status];
  }

  private mapProfile(profile: TBUserProfile): UserProfile {
    return {
      fullName: profile.fullName,
      phoneNumber: profile.phoneNumber,
      avatarUrl: profile.avatarUrl ?? undefined,
    };
  }
}
