import { OwnerRequestStatus, UserRole } from '@assets/enum/user.enum';
import { UserProfileResponseDto } from '@/dtos/user/user.dto';
import { IsIn, IsOptional } from 'class-validator';

export type AdminHostStatusQuery = 'pending' | 'approved' | 'rejected';
export const ADMIN_HOST_STATUS_QUERY_VALUES: AdminHostStatusQuery[] = [
  'pending',
  'approved',
  'rejected',
];
export const UPDATE_HOST_STATUS_VALUES = ['approved', 'rejected'] as const;

export class AdminHostListQueryDto {
  @IsOptional()
  @IsIn(ADMIN_HOST_STATUS_QUERY_VALUES)
  status?: AdminHostStatusQuery;
}

export class UpdateHostStatusRequestDto {
  @IsIn(UPDATE_HOST_STATUS_VALUES)
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
