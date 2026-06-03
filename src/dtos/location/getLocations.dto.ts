import { ApiPropertyOptional } from '@nestjs/swagger';
import { IsInt, IsOptional, IsString, Min, Max, IsNumber } from 'class-validator';
export type LocationSortBy = 'price' | 'area' | 'rating' | 'createdAt';
export type LocationSortOrder = 'ASC' | 'DESC';

export class GetLocationsQueryDto {
  @ApiPropertyOptional({
    description: 'Page number for pagination',
    example: 1,
  })
  @IsOptional()
  @IsInt()
  page?: number;

  @ApiPropertyOptional({ description: 'Number of items per page', example: 10 })
  @IsOptional()
  @IsInt()
  limit?: number;

  @ApiPropertyOptional({ description: 'Minimum price', example: 0 })
  @IsOptional()
  @IsInt()
  minPrice?: number;

  @ApiPropertyOptional({ description: 'Maximum price', example: 20000000 })
  @IsOptional()
  @IsInt()
  maxPrice?: number;

  @ApiPropertyOptional({ description: 'Minimum area', example: 0 })
  @IsOptional()
  @IsInt()
  minArea?: number;

  @ApiPropertyOptional({ description: 'Maximum area', example: 100 })
  @IsOptional()
  @IsInt()
  maxArea?: number;

  @ApiPropertyOptional({ description: 'Location type ID', example: '1' })
  @IsOptional()
  @IsInt()
  locationTypeId?: number;

  @ApiPropertyOptional({ description: 'Address region', example: 'Miền Bắc' })
  @IsOptional()
  @IsString()
  addressRegion?: string;

  @ApiPropertyOptional({ description: 'Search keyword', example: 'Hà Nội' })
  @IsOptional()
  @IsString()
  keyword?: string;

  @ApiPropertyOptional({ description: 'Sort by field', example: 'price' })
  @IsOptional()
  sortBy?: LocationSortBy;

  @ApiPropertyOptional({ description: 'Sort order', example: 'ASC' })
  @IsOptional()
  sortOrder?: LocationSortOrder;

  @ApiPropertyOptional({
    example: 21.0285,
    description: 'Latitude of the search center for radius search.',
  })
  @IsOptional()
  @IsNumber()
  @Min(-90)
  @Max(90)
  lat?: number;

  @ApiPropertyOptional({
    example: 105.8542,
    description: 'Longitude of the search center for radius search.',
  })
  @IsOptional()
  @IsNumber()
  @Min(-180)
  @Max(180)
  lng?: number;

  @ApiPropertyOptional({
    example: 3,
    description: 'Search radius in kilometers.',
  })
  @IsOptional()
  @IsNumber()
  @Min(0.1)
  @Max(100)
  radiusKm?: number;
}

export interface LocationAddressResponseDto {
  id: number;
  fullAddress: string;
  province: string;
  district: string;
  country: string;
  region: string;
  lat: number;
  lng: number;
}

export interface LocationOwnerResponseDto {
  id: number;
  fullName: string | null;
  phone: string | null;
}

export interface LocationServiceResponseDto {
  id: number;
  name: string;
  isFree: boolean;
  price?: number;
  priceUnit?: string;
  isActive: boolean;
}

export interface LocationTypeResponseDto {
  id: number;
  name: string;
  code: string;
}

export interface LocationMediaResponseDto {
  id: number;
  type: string;
  url: string;
  displayOrder: number;
}

export interface LocationListItemResponseDto {
  id: number;
  name: string;
  description?: string | null;
  price: number;
  priceUnit: string;
  area: number;
  averageRating: number;
  createdAt: Date;
  address: LocationAddressResponseDto | null;
  type: LocationTypeResponseDto | null;
  thumbnailMedia: LocationMediaResponseDto | null;
}

export interface LocationDetailResponseDto {
  id: number;
  name: string;
  description?: string | null;
  owner: LocationOwnerResponseDto | null;
  price: number;
  priceUnit: string;
  area: number;
  averageRating: number;
  createdAt: Date;
  address: LocationAddressResponseDto | null;
  type: LocationTypeResponseDto | null;
  media: LocationMediaResponseDto[];
  services: LocationServiceResponseDto[];
}

export interface GetLocationsResponseDto {
  data: LocationListItemResponseDto[];
  meta: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
  };
}

export interface GetLocationsFilter {
  page: number;
  limit: number;
  minPrice?: number;
  maxPrice?: number;
  minArea?: number;
  maxArea?: number;
  locationTypeId?: number;
  addressRegion?: string;
  keyword?: string;
  ownerId?: number;
  sortBy: LocationSortBy;
  sortOrder: LocationSortOrder;
  lat?: number;
  lng?: number;
  radiusKm?: number;
}
