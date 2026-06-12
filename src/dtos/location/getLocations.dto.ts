import { Trim } from '@/common/validators/validators';
import { ApiPropertyOptional } from '@nestjs/swagger';
import { Transform, Type } from 'class-transformer';
import {
  Matches,
  IsIn,
  IsInt,
  IsOptional,
  IsString,
  Min,
  Max,
  IsNumber,
  IsDateString,
  IsDate,
} from 'class-validator';

export type LocationSortBy = 'price' | 'area' | 'rating' | 'createdAt';
export type LocationSortOrder = 'ASC' | 'DESC';
export const LOCATION_SORT_BY_VALUES: string[] = [
  'price',
  'area',
  'rating',
  'createdAt',
];
export const LOCATION_SORT_ORDER_VALUES: string[] = ['ASC', 'DESC'];

export class GetLocationsQueryDto {
  @ApiPropertyOptional({
    description: 'Page number for pagination',
    default: 1,
  })
  @Type(() => Number)
  @IsInt()
  @Min(1)
  page: number;

  @ApiPropertyOptional({ description: 'Number of items per page', default: 10 })
  @Type(() => Number)
  @IsInt()
  @Min(1)
  limit: number;

  @ApiPropertyOptional({ description: 'Guest count', default: 1 })
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  guestCount?: number;

  @ApiPropertyOptional({
    description: 'Number of rooms the user wants to book',
    default: 1,
  })
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  quantity?: number;

  @ApiPropertyOptional({
    description: 'Start date for availability filter (ISO string)',
    example: '2024-01-01',
  })
  @IsOptional()
  @Type(() => Date)
  @IsDate()
  startDate?: Date;

  @ApiPropertyOptional({
    description: 'End date for availability filter (ISO string)',
    example: '2024-01-31',
  })
  @IsOptional()
  @Type(() => Date)
  @IsDate()
  endDate?: Date;

  @ApiPropertyOptional({ description: 'Minimum price', example: 0 })
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(0)
  minPrice?: number;

  @ApiPropertyOptional({ description: 'Maximum price', example: 20000000 })
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(0)
  maxPrice?: number;

  @ApiPropertyOptional({ description: 'Minimum area', example: 0 })
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(0)
  minArea?: number;

  @ApiPropertyOptional({ description: 'Maximum area', example: 100 })
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(0)
  maxArea?: number;

  @ApiPropertyOptional({ description: 'Location type ID' })
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  locationTypeId?: number;

  @ApiPropertyOptional({
    description: 'Search by address keyword, accent-insensitive',
    example: 'Ha Noi',
  })
  @IsOptional()
  @Trim()
  @IsString()
  keyword?: string;

  @ApiPropertyOptional({ description: 'Sort by field', example: 'price' })
  @IsOptional()
  @Trim()
  @IsString()
  @IsIn(LOCATION_SORT_BY_VALUES)
  sortBy?: LocationSortBy;

  @ApiPropertyOptional({ description: 'Sort order', default: 'ASC' })
  @IsOptional()
  @Trim()
  @IsString()
  @IsIn(LOCATION_SORT_ORDER_VALUES)
  sortOrder?: LocationSortOrder;

  @ApiPropertyOptional({
    example: 21.0285,
    description: 'Latitude of the search center for radius search.',
  })
  @IsOptional()
  @Type(() => Number)
  @IsNumber()
  @Min(-90)
  @Max(90)
  lat?: number;

  @ApiPropertyOptional({
    example: 105.8542,
    description: 'Longitude of the search center for radius search.',
  })
  @IsOptional()
  @Type(() => Number)
  @IsNumber()
  @Min(-180)
  @Max(180)
  lng?: number;

  @ApiPropertyOptional({
    example: 3,
    description: 'Search radius in kilometers.',
  })
  @IsOptional()
  @Type(() => Number)
  @IsNumber()
  @Min(0.1)
  @Max(100)
  radiusKm?: number;
}

export interface GetLocationAddressResponseDto {
  id: number;
  fullAddress: string;
  province?: string;
  district?: string;
  country?: string;
  region?: string;
  lat: number;
  lng: number;
  normalFullAddress?: string;
}

export interface GetLocationOwnerResponseDto {
  id: number;
  fullName: string | null;
  phoneNumber: string | null;
}

export interface GetLocationServiceResponseDto {
  name: string;
  isFree: boolean;
  price?: number;
  priceUnit?: string;
  isActive: boolean;
}

export interface GetLocationTypeResponseDto {
  id: number;
  name: string;
  code: string;
  canHaveMultiRoom?: boolean;
}

export interface GetLocationMediaResponseDto {
  id: number;
  type: string;
  url: string;
  displayOrder?: number;
}

export interface LocationDto {
  id: number;
  name: string;
  description?: string | null;
  price: number;
  priceUnit: string;
  area: number;
  maxGuestCount: number;
  averageRating: number;
  address: GetLocationAddressResponseDto | null;
  type: GetLocationTypeResponseDto | null;
  thumbnailMedia: GetLocationMediaResponseDto | null;
}

export interface GetLocationDetailResponseDto {
  id: number;
  name: string;
  description?: string | null;
  owner: GetLocationOwnerResponseDto | null;
  price: number;
  priceUnit: string;
  area: number;
  maxGuestCount: number;
  averageRating: number;
  createdAt: Date;
  address: GetLocationAddressResponseDto | null;
  type: GetLocationTypeResponseDto | null;
  media: GetLocationMediaResponseDto[];
  services: GetLocationServiceResponseDto[];
}

export interface GetLocationsResponseDto {
  data: LocationDto[];
  meta: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
  };
}

// export interface GetLocationsFilter {
//   page: number;
//   limit: number;
//   guestCount?: number;
//   quantity?: number;
//   startDate?: string;
//   endDate?: string;
//   minPrice?: number;
//   maxPrice?: number;
//   minArea?: number;
//   maxArea?: number;
//   locationTypeId?: number;
//   addressRegion?: string;
//   keyword?: string;
//   ownerId?: number;
//   sortBy: string;
//   sortOrder: string;
//   lat?: number;
//   lng?: number;
//   radiusKm?: number;
// }
