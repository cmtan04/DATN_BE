import { LocationDto } from '@/dtos/location/getLocations.dto';

export interface AdminLocationOwnerResponseDto {
  id: number;
  fullName: string | null;
  phoneNumber: string | null;
  email: string;
  avatarUrl: string | null;
}

export interface AdminLocationItemDto extends LocationDto {
  owner: AdminLocationOwnerResponseDto | null;
}

export interface AdminLocationListResponseDto {
  data: AdminLocationItemDto[];
  meta: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
  };
}
