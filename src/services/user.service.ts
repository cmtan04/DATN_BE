import {
  BadRequestException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import {
  GetCurrentUserResponseDto,
  SubmitOwnerRequestResponseDto,
  UpdateCurrentUserRequestDto,
  UpdateCurrentUserResponseDto,
} from '@/dtos/user/user.dto';
import {
  UpdateUserProfileData,
  UserRepository,
} from '@/repositories/user.repository';
import { NotificationService } from './notification.service';
import { OwnerRequestStatus, UserRole } from '@assets/enum/user.enum';

@Injectable()
export class UserService {
  constructor(
    private readonly userRepository: UserRepository,
    private readonly notificationService: NotificationService,
  ) {}

  public async getCurrentUser(
    userId: number,
  ): Promise<GetCurrentUserResponseDto> {
    const { user, profile } = await this.getUserAndProfile(userId);
    return this.userRepository.mapToCurrentUserResponse(user, profile);
  }

  public async updateCurrentUser(
    userId: number,
    payload: UpdateCurrentUserRequestDto,
  ): Promise<UpdateCurrentUserResponseDto> {
    const { user, profile } = await this.getUserAndProfile(userId);

    const updateData = this.normalizeUpdatePayload(payload);
    await this.userRepository.updateProfile(profile.id, updateData);

    return await this.getCurrentUser(user.id);
  }

  public async submitOwnerRequest(
    userId: number,
  ): Promise<SubmitOwnerRequestResponseDto> {
    const { user, profile } = await this.getUserAndProfile(userId);
    const ownerRequestStatus =
      user.ownerRequestStatus ?? OwnerRequestStatus.NONE;

    if (user.userRole === UserRole.ADMIN) {
      throw new BadRequestException('Admin cannot apply to become owner');
    }

    if (
      user.userRole === UserRole.OWNER ||
      ownerRequestStatus === OwnerRequestStatus.APPROVED
    ) {
      if (ownerRequestStatus !== OwnerRequestStatus.APPROVED) {
        await this.userRepository.updateOwnerRequest(user.id, {
          ownerRequestStatus: OwnerRequestStatus.APPROVED,
          userRole: UserRole.OWNER,
        });
      }

      return await this.getCurrentUser(user.id);
    }

    if (ownerRequestStatus === OwnerRequestStatus.PENDING) {
      return await this.getCurrentUser(user.id);
    }

    if (
      user.userRole !== UserRole.USER ||
      ![
        OwnerRequestStatus.NONE,
        OwnerRequestStatus.REJECTED,
      ].includes(ownerRequestStatus)
    ) {
      throw new BadRequestException('Invalid owner request status');
    }

    await this.userRepository.updateOwnerRequest(user.id, {
      ownerRequestStatus: OwnerRequestStatus.PENDING,
      userRole: UserRole.USER,
    });

    await this.notifyAdminsOwnerRequestCreated(
      profile.fullName || user.email,
    );

    return await this.getCurrentUser(user.id);
  }

  private async notifyAdminsOwnerRequestCreated(
    requesterName: string,
  ): Promise<void> {
    const admins = await this.userRepository.findAdmins();

    await this.notificationService.createMany(
      admins.map((admin) => ({
        userId: admin.id,
        title: 'Yeu cau chu phong moi',
        message: `Ban vua nhan duoc yeu cau dang ki lam chu phong tu ${requesterName}.`,
      })),
    );
  }

  private async getUserAndProfile(userId: number) {
    const user = await this.userRepository.findById(userId);
    if (!user) {
      throw new NotFoundException('User not found');
    }

    const profile = user.userProfileId
      ? await this.userRepository.findProfileById(user.userProfileId)
      : null;

    if (!profile) {
      throw new NotFoundException('User profile not found');
    }

    return { user, profile };
  }

  private normalizeUpdatePayload(
    payload: UpdateCurrentUserRequestDto,
  ): UpdateUserProfileData {
    const updateData: UpdateUserProfileData = {};

    if (payload.fullName !== undefined) {
      const fullName = payload.fullName.trim();
      if (!fullName) {
        throw new BadRequestException('fullName must not be empty');
      }
      updateData.fullName = fullName;
    }

    if (payload.phoneNumber !== undefined) {
      const phoneNumber = payload.phoneNumber.trim();
      if (!phoneNumber) {
        throw new BadRequestException('phoneNumber must not be empty');
      }
      updateData.phoneNumber = phoneNumber;
    }

    if (payload.avatarUrl !== undefined) {
      const avatarUrl = payload.avatarUrl.trim();
      updateData.avatarUrl = avatarUrl || null;
    }

    if (Object.keys(updateData).length === 0) {
      throw new BadRequestException('Missing profile update information');
    }

    return updateData;
  }
}
