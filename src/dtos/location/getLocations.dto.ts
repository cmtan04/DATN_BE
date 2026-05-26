export type LocationSortBy = 'price' | 'area' | 'rating' | 'createdAt';
export type LocationSortOrder = 'ASC' | 'DESC';

export class GetLocationsQueryDto {
  page?: string;
  limit?: string;
  minPrice?: string;
  maxPrice?: string;
  minArea?: string;
  maxArea?: string;
  locationTypeId?: string;
  keyword?: string;
  sortBy?: LocationSortBy;
  sortOrder?: LocationSortOrder;
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

export interface LocationTypeResponseDto {
  id: number;
  name: string;
  code: string;
}

export interface LocationThumbnailMediaResponseDto {
  id: number;
  type: string;
  url: string;
  displayOrder: number;
}

export interface LocationListItemResponseDto {
  id: number;
  name: string;
  ownerId: number;
  price: number;
  priceUnit: string;
  area: number;
  averageRating: number;
  createdAt: Date;
  address: LocationAddressResponseDto | null;
  type: LocationTypeResponseDto | null;
  thumbnailMedia: LocationThumbnailMediaResponseDto | null;
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
  keyword?: string;
  sortBy: LocationSortBy;
  sortOrder: LocationSortOrder;
}
