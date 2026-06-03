import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsString } from 'class-validator';
import { LocationDetailResponseDto } from './getLocations.dto';

export class CreateLocationAddressRequestDto {
  fullAddress: string;
  province: string;
  district: string;
  country: string;
  region: string;
  lat: number;
  lng: number;
}

export class CreateLocationServiceRequestDto {
  serviceId: number;
  isFree: boolean;
  price?: number;
  priceUnit?: string;
  isActive?: boolean;
}

export class CreateLocationRequestDto {
  name: string;
  description?: string;
  price: number;
  priceUnit: string;
  area: number;
  quantity: number;
  locationTypeId: number;
  media: CreateLocationMediaInput[];
  address: CreateLocationAddressRequestDto;
  services?: CreateLocationServiceRequestDto[];
}

export type CreateLocationPayloadInput =
  | string
  | CreateLocationRequestDto
  | { payload?: string };

export class CreateLocationRepositoryDto extends CreateLocationRequestDto {
  ownerId: number;
}

export class CreateServiceRequestDto {
  @ApiProperty({ example: 'Wifi' })
  @IsString()
  name: string;
}

export interface ServiceResponseDto {
  id: number;
  name: string;
}

export interface LocationUploadFile {
  originalname: string;
  mimetype: string;
  size: number;
  buffer: Buffer;
}

export interface CreateLocationMediaInput {
  type: string;
  url: string;
  displayOrder: number;
}

export type CreateLocationResponseDto = LocationDetailResponseDto;
