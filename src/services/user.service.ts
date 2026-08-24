import {
  BadRequestException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import {
  GetUserBookingsRequestDto,
  GetUserBookingsResponseDto,
  RawBookingData,
  UpdateCurrentUserRequestDto,
  User,
  UserBookingItemDto,
} from '@/dtos/user/user.dto';
import {
  UpdateUserProfileData,
  UserRepository,
} from '@/repositories/user.repository';
import { BookingRepository } from '@/repositories/booking.repository';
import { NotificationService } from './notification.service';
import { OwnerRequestStatus, UserRole } from '@assets/enum/user.enum';
import { AuthService } from './auth.service';
import { ChangePasswordDto } from '@/dtos/auth/changePassword.dto';

@Injectable()
export class UserService {
  constructor(
    private readonly userRepository: UserRepository,
    private readonly bookingRepository: BookingRepository,
    private readonly notificationService: NotificationService,
    private readonly authService: AuthService,
  ) {}

  public async getCurrentUser(userId: number): Promise<User> {
    const { user, profile } = await this.getUserAndProfile(userId);
    return this.userRepository.mapToCurrentUserResponse(user, profile);
  }

  public async updateCurrentUser(
    userId: number,
    payload: UpdateCurrentUserRequestDto,
  ): Promise<User> {
    const { user, profile } = await this.getUserAndProfile(userId);

    const updateData = this.normalizeUpdatePayload(payload);
    await this.userRepository.updateProfile(profile.id, updateData);

    return await this.getCurrentUser(user.id);
  }

  // public async submitOwnerRequest(
  //   userId: number,
  // ): Promise<SubmitOwnerRequestResponseDto> {
  //   const { user, profile } = await this.getUserAndProfile(userId);
  //   const ownerRequestStatus =
  //     user.ownerRequestStatus ?? OwnerRequestStatus.NONE;

  //   if (user.userRole === UserRole.ADMIN) {
  //     throw new BadRequestException('Admin cannot apply to become owner');
  //   }

  //   if (
  //     user.userRole === UserRole.OWNER ||
  //     ownerRequestStatus === OwnerRequestStatus.APPROVED
  //   ) {
  //     if (ownerRequestStatus !== OwnerRequestStatus.APPROVED) {
  //       await this.userRepository.updateOwnerRequest(user.id, {
  //         ownerRequestStatus: OwnerRequestStatus.APPROVED,
  //         userRole: UserRole.OWNER,
  //       });
  //     }

  //     return await this.getCurrentUser(user.id);
  //   }

  //   if (ownerRequestStatus === OwnerRequestStatus.PENDING) {
  //     return await this.getCurrentUser(user.id);
  //   }

  //   if (
  //     user.userRole !== UserRole.USER ||
  //     ![OwnerRequestStatus.NONE, OwnerRequestStatus.REJECTED].includes(
  //       ownerRequestStatus,
  //     )
  //   ) {
  //     throw new BadRequestException('Invalid owner request status');
  //   }

  //   await this.userRepository.updateOwnerRequest(user.id, {
  //     ownerRequestStatus: OwnerRequestStatus.PENDING,
  //     userRole: UserRole.USER,
  //   });

  //   await this.notifyAdminsOwnerRequestCreated(profile.fullName || user.email);

  //   return await this.getCurrentUser(user.id);
  // }

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
      updateData.fullName = payload.fullName;
    }

    if (payload.phoneNumber !== undefined) {
      updateData.phoneNumber = payload.phoneNumber;
    }

    if (Object.keys(updateData).length === 0) {
      throw new BadRequestException('Missing profile update information');
    }

    return updateData;
  }

  public async changePassword(
    changePasswordDto: ChangePasswordDto,
    userId: number,
  ) {
    return await this.authService.changePassword(changePasswordDto, userId);
  }

  public async getUserBookings(
    userId: number,
    query: GetUserBookingsRequestDto,
  ): Promise<GetUserBookingsResponseDto> {
    const {
      data: rawData,
      totalCount,
      summary,
    } = await this.bookingRepository.getUserBookings(userId, query);

    const mappedData: UserBookingItemDto[] = rawData.map(
      (b: RawBookingData) => ({
        id: Number(b.id),
        bookingCode: String(b.bookingCode),
        startDate: b.startDate,
        endDate: b.endDate,
        roomNumber: Number(b.roomNumber),
        note: b.note,
        status: b.status,
        totalAmount: Number(b.totalAmount),
        currency: String(b.currency),
        createdAt: b.createdAt,
        location: {
          id: Number(b.locationId),
          name: String(b.locationName),
          price: Number(b.price),
          priceUnit: String(b.priceUnit),
          area: Number(b.area),
          address: String(b.fullAddress),
          thumbnailUrl: String(b.thumbnailUrl),
        },
      }),
    );

    const limit = query.limit || 6;
    const page = query.page || 1;
    const totalPages = Math.ceil(totalCount / limit);

    return {
      data: mappedData,
      meta: {
        page,
        limit,
        total: totalCount,
        totalPages,
      },
      summary,
    };
  }
}
