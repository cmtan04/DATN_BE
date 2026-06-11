import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { Transform, Type } from 'class-transformer';
import {
  ArrayMinSize,
  ArrayMaxSize,
  IsArray,
  ArrayUnique,
  IsBoolean,
  IsIn,
  IsInt,
  IsNotEmpty,
  IsNumber,
  IsOptional,
  IsString,
  IsUrl,
  Max,
  MaxLength,
  Min,
  ValidateIf,
  ValidateNested,
} from 'class-validator';
import { GetLocationDetailResponseDto } from './getLocations.dto';
import { Trim } from '@/common/validators/validators';

export class CreateLocationAddressRequestDto {
  @ApiProperty({ example: '123 Tran Phu, Ha Dong, Ha Noi' })
  @Transform(({ value }) => (typeof value === 'string' ? value.trim() : value))
  @IsString()
  @IsNotEmpty()
  @MaxLength(255)
  fullAddress: string;

  @ApiProperty({ example: 'Ha Noi' })
  @Transform(({ value }) => (typeof value === 'string' ? value.trim() : value))
  @IsString()
  @IsNotEmpty()
  @MaxLength(255)
  province: string;

  @ApiProperty({ example: 'Ha Dong' })
  @Transform(({ value }) => (typeof value === 'string' ? value.trim() : value))
  @IsString()
  @IsNotEmpty()
  @MaxLength(255)
  district: string;

  @ApiProperty({ example: 'Viet Nam' })
  @Transform(({ value }) => (typeof value === 'string' ? value.trim() : value))
  @IsString()
  @IsNotEmpty()
  @MaxLength(255)
  country: string;

  @ApiProperty({ example: 'Mien Bac' })
  @Transform(({ value }) => (typeof value === 'string' ? value.trim() : value))
  @IsString()
  @IsNotEmpty()
  @MaxLength(255)
  region: string;

  @ApiProperty({ example: 21.0285 })
  @Type(() => Number)
  @IsNumber()
  @Min(-90)
  @Max(90)
  lat: number;

  @ApiProperty({ example: 105.8542 })
  @Type(() => Number)
  @IsNumber()
  @Min(-180)
  @Max(180)
  lng: number;
}

export class CreateLocationServiceRequestDto {
  @ApiProperty({ example: 1 })
  @Type(() => Number)
  @IsInt()
  @Min(1)
  locationId: number;

  @ApiProperty({ example: 1 })
  @Type(() => Number)
  @IsInt()
  @Min(1)
  serviceId: number;

  @ApiPropertyOptional({ example: true, default: true })
  @IsOptional()
  @IsBoolean()
  isFree?: boolean;

  @ApiPropertyOptional({ example: 150000 })
  @IsOptional()
  @ValidateIf((object) => object.isFree === false)
  @Type(() => Number)
  @IsNumber()
  price?: number;

  @ApiPropertyOptional({ example: 'day' })
  @ValidateIf((object) => object.isFree === false)
  @IsOptional()
  @Trim()
  @IsString()
  @MaxLength(50)
  priceUnit?: string;

  @ApiPropertyOptional({ example: true, default: true })
  @IsOptional()
  @IsBoolean()
  isActive?: boolean;
}

export class CreateLocationMediaRequestDto {
  @ApiProperty({ example: 'image' })
  @Transform(({ value }) => (typeof value === 'string' ? value.trim() : value))
  @IsString()
  @IsIn(['image'])
  @MaxLength(50)
  type: string;

  @ApiProperty({
    example:
      'https://res.cloudinary.com/demo/image/upload/v1234567890/locations/sample.jpg',
  })
  @Transform(({ value }) => (typeof value === 'string' ? value.trim() : value))
  @IsString()
  @IsUrl()
  @MaxLength(500)
  url: string;

  @ApiPropertyOptional({ example: 1 })
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  displayOrder?: number;
}

export class CreateLocationRequestDto {
  @ApiProperty({ example: 'Can ho view ho Tay' })
  @Transform(({ value }) => (typeof value === 'string' ? value.trim() : value))
  @IsString()
  @IsNotEmpty()
  @MaxLength(255)
  name: string;

  @ApiPropertyOptional({ example: 'Can ho day du tien nghi' })
  @IsOptional()
  @Transform(({ value }) => {
    if (typeof value !== 'string') {
      return value;
    }

    const trimmed = value.trim();
    return trimmed ? trimmed : undefined;
  })
  @IsString()
  @MaxLength(2000)
  description?: string;

  @ApiProperty({ example: 1200000 })
  @Type(() => Number)
  @IsInt()
  @Min(1)
  price: number;

  @ApiProperty({ example: 'night' })
  @Transform(({ value }) => (typeof value === 'string' ? value.trim() : value))
  @IsString()
  @IsNotEmpty()
  @MaxLength(50)
  priceUnit: string;

  @ApiProperty({ example: 45 })
  @Type(() => Number)
  @IsInt()
  @Min(1)
  area: number;

  @ApiProperty({ example: 4 })
  @Type(() => Number)
  @IsInt()
  @Min(1)
  maxGuestCount: number;

  @ApiProperty({ example: 2 })
  @Type(() => Number)
  @IsInt()
  @Min(1)
  quantity: number;

  @ApiProperty({ example: 1 })
  @Type(() => Number)
  @IsInt()
  @Min(1)
  locationTypeId: number;

  @ApiProperty({ type: () => [CreateLocationMediaRequestDto] })
  @IsArray()
  @ArrayMinSize(1)
  @ArrayMaxSize(8)
  @ValidateNested({ each: true })
  @Type(() => CreateLocationMediaRequestDto)
  media: CreateLocationMediaRequestDto[];

  @ApiProperty({ type: () => CreateLocationAddressRequestDto })
  @ValidateNested()
  @Type(() => CreateLocationAddressRequestDto)
  address: CreateLocationAddressRequestDto;

  @ApiPropertyOptional({ type: () => [CreateLocationServiceRequestDto] })
  @IsOptional()
  @IsArray()
  @ArrayUnique((service: CreateLocationServiceRequestDto) => service.serviceId)
  @ValidateNested({ each: true })
  @Type(() => CreateLocationServiceRequestDto)
  services?: CreateLocationServiceRequestDto[];
}

export class CreateLocationRepositoryDto extends CreateLocationRequestDto {
  ownerId: number;
}

export interface CreateLocationMediaInput {
  type: string;
  url: string;
  displayOrder: number;
}

export type CreateLocationResponseDto = GetLocationDetailResponseDto;
