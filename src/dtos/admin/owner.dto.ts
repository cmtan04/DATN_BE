import { OwnerRequestStatus, UserRole } from '@assets/enum/user.enum';
import { UserProfile } from '@/dtos/user/user.dto';
import { Trim } from '@/common/validators/validators';
import { ApiPropertyOptional } from '@nestjs/swagger';
import { Type } from 'class-transformer';
import { IsIn, IsInt, IsOptional, IsString, Min } from 'class-validator';

export type AdminOwnerStatusQuery = 'pending' | 'approved' | 'rejected';
export const ADMIN_OWNER_STATUS_QUERY_VALUES: AdminOwnerStatusQuery[] = [
  'pending',
  'approved',
  'rejected',
];
export const UPDATE_OWNER_STATUS_VALUES = ['approved', 'rejected'] as const;

export type AdminOwnerSortBy = 'createdAt' | 'email' | 'ownerRequestStatus';
export const ADMIN_OWNER_SORT_BY_VALUES: AdminOwnerSortBy[] = [
  'createdAt',
  'email',
  'ownerRequestStatus',
];
export const ADMIN_OWNER_SORT_ORDER_VALUES = ['ASC', 'DESC'] as const;
export type AdminOwnerSortOrder =
  (typeof ADMIN_OWNER_SORT_ORDER_VALUES)[number];

export class AdminOwnerListQueryDto {
  @ApiPropertyOptional({ description: 'Số trang', default: 1 })
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  page: number = 1;

  @ApiPropertyOptional({
    description: 'Số lượng bản ghi mỗi trang',
    default: 10,
  })
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  limit: number = 10;

  @ApiPropertyOptional({
    description: 'Trường cần sắp xếp',
    default: 'updatedAt',
  })
  @IsOptional()
  @Trim()
  @IsString()
  @IsIn(ADMIN_OWNER_SORT_BY_VALUES)
  sortBy?: AdminOwnerSortBy;

  @ApiPropertyOptional({ description: 'Thứ tự sắp xếp', default: 'DESC' })
  @IsOptional()
  @Trim()
  @IsString()
  @IsIn(ADMIN_OWNER_SORT_ORDER_VALUES)
  sortOrder?: AdminOwnerSortOrder;

  @ApiPropertyOptional({
    description: 'Từ khóa tìm kiếm (email, tên, số điện thoại)',
  })
  @IsOptional()
  @Trim()
  @IsString()
  keyword?: string;

  @ApiPropertyOptional({
    description: 'Trạng thái yêu cầu chủ phòng',
    enum: ADMIN_OWNER_STATUS_QUERY_VALUES,
  })
  @IsOptional()
  @IsIn(ADMIN_OWNER_STATUS_QUERY_VALUES)
  status?: AdminOwnerStatusQuery;
}

export class UpdateOwnerStatusRequestDto {
  @IsIn(UPDATE_OWNER_STATUS_VALUES)
  status: 'approved' | 'rejected';
}

export interface AdminOwnerResponseDto {
  id: number;
  email: string;
  userRole: UserRole;
  ownerRequestStatus: OwnerRequestStatus;
  profile: UserProfile | null;
  updatedAt: Date;
}

export interface AdminOwnerListResponseDto {
  data: AdminOwnerResponseDto[];
  meta: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
  };
}
