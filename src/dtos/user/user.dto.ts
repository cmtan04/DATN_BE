import {
  OwnerRequestStatus,
  UserRole,
  UserStatus,
} from '@assets/enum/user.enum';
import { Transform } from 'class-transformer';
import {
  IsNotEmpty,
  IsOptional,
  IsString,
  MaxLength,
} from 'class-validator';

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
  ownerRequestStatus: OwnerRequestStatus;
  profile: UserProfileResponseDto | null;
}

export class UpdateCurrentUserRequestDto {
  @IsOptional()
  @Transform(({ value }) =>
    typeof value === 'string' ? value.trim() : value,
  )
  @IsString()
  @IsNotEmpty()
  @MaxLength(255)
  fullName?: string;

  @IsOptional()
  @Transform(({ value }) =>
    typeof value === 'string' ? value.trim() : value,
  )
  @IsString()
  @IsNotEmpty()
  @MaxLength(50)
  phoneNumber?: string;

  @IsOptional()
  @Transform(({ value }) =>
    typeof value === 'string' ? value.trim() : value,
  )
  @IsString()
  @MaxLength(500)
  avatarUrl?: string;
}

export type UpdateCurrentUserResponseDto = GetCurrentUserResponseDto;

export type SubmitOwnerRequestResponseDto = GetCurrentUserResponseDto;
