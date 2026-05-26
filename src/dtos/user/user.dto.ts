import { UserRole, UserStatus } from '@assets/enum/user.enum';

export class UserDecoratorDtoResponse {
  id: number;
  email: string;
  password: string;
  phone?: string;
  fullName?: string;
  dateOfBirth?: Date;
  status: UserStatus;
  role: UserRole;
  isEmailVerified: boolean;
}

export interface UserProfileResponseDto {
  fullName: string;
  phoneNumber: string;
  avatarUrl?: string;
}

export interface GetCurrentUserResponseDto {
  id: number;
  email: string;
  userRole: UserRole;
  status: UserStatus;
  profile: UserProfileResponseDto | null;
}

export class UpdateCurrentUserRequestDto {
  fullName?: string;
  phoneNumber?: string;
  avatarUrl?: string;
}

export type UpdateCurrentUserResponseDto = GetCurrentUserResponseDto;
