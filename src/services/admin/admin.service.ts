import {
  BadRequestException,
  ForbiddenException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { UserRepository } from '@/repositories/user.repository';
import {
  AdminHostResponseDto,
  AdminHostStatusQuery,
  UpdateHostStatusRequestDto,
} from '@/dtos/admin/host.dto';
import { NotificationService } from '../notification.service';
import { OwnerRequestStatus, UserRole } from '@assets/enum/user.enum';

@Injectable()
export class AdminService {
  constructor(
    private readonly userRepository: UserRepository,
    private readonly notificationService: NotificationService,
  ) {}

  public async getHosts(
    adminRole: UserRole,
    status?: AdminHostStatusQuery,
  ): Promise<AdminHostResponseDto[]> {
    this.assertAdmin(adminRole);

    return await this.userRepository.findHosts(status);
  }

  public async updateHostStatus(
    adminRole: UserRole,
    userId: number,
    payload: UpdateHostStatusRequestDto,
  ): Promise<AdminHostResponseDto> {
    this.assertAdmin(adminRole);

    const target = await this.userRepository.findById(userId);
    if (!target) {
      throw new NotFoundException('User not found');
    }

    if (target.userRole === UserRole.ADMIN) {
      throw new BadRequestException('Cannot update admin host status');
    }

    const ownerRequestStatus = this.mapUpdateStatus(payload.status);
    const userRole =
      ownerRequestStatus === OwnerRequestStatus.APPROVED
        ? UserRole.OWNER
        : UserRole.USER;

    await this.userRepository.updateOwnerRequest(userId, {
      ownerRequestStatus,
      userRole,
    });

    await this.notifyHostStatusUpdated(userId, ownerRequestStatus);

    const updatedUser = await this.userRepository.findById(userId);
    if (!updatedUser) {
      throw new NotFoundException('User not found');
    }

    const profile = updatedUser.userProfileId
      ? await this.userRepository.findProfileById(updatedUser.userProfileId)
      : null;

    return this.userRepository.mapToAdminHostResponse(updatedUser, profile);
  }

  private assertAdmin(role: UserRole): void {
    if (role !== UserRole.ADMIN) {
      throw new ForbiddenException('Only admin can manage hosts');
    }
  }

  private mapUpdateStatus(status: string): OwnerRequestStatus {
    if (status === 'approved') {
      return OwnerRequestStatus.APPROVED;
    }

    if (status === 'rejected') {
      return OwnerRequestStatus.REJECTED;
    }

    throw new BadRequestException('Invalid host status');
  }

  private async notifyHostStatusUpdated(
    userId: number,
    status: OwnerRequestStatus,
  ): Promise<void> {
    const isApproved = status === OwnerRequestStatus.APPROVED;

    await this.notificationService.createMany([
      {
        userId,
        title: isApproved
          ? 'Yeu cau chu phong da duoc duyet'
          : 'Yeu cau chu phong bi tu choi',
        message: isApproved
          ? 'Yeu cau dang ki chu phong cua ban da duoc duyet. Truy cap CMS de bat dau dang phong.'
          : 'Yeu cau dang ki chu phong cua ban da bi tu choi. Vui long kiem tra lai thong tin ho so.',
      },
    ]);
  }
}
