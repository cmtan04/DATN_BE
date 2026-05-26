import {
  BadRequestException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import {
  GetCurrentUserResponseDto,
  UpdateCurrentUserRequestDto,
  UpdateCurrentUserResponseDto,
} from '@/dtos/user/user.dto';
import {
  UpdateUserProfileData,
  UserRepository,
} from '@/repositories/user.repository';

@Injectable()
export class UserService {
  constructor(private readonly userRepository: UserRepository) {}

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
