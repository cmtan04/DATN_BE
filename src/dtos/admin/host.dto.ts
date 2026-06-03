import { OwnerRequestStatus, UserRole } from '@assets/enum/user.enum';
import { UserProfileResponseDto } from '@/dtos/user/user.dto';

export type AdminHostStatusQuery = 'pending' | 'approved' | 'rejected';

export class UpdateHostStatusRequestDto {
  status: 'approved' | 'rejected';
}

export interface AdminHostResponseDto {
  id: number;
  email: string;
  userRole: UserRole;
  ownerRequestStatus: OwnerRequestStatus;
  profile: UserProfileResponseDto | null;
  updatedAt: Date;
}
