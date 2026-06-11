import { ApiProperty } from '@nestjs/swagger';
import type {
  CloudinaryUploadPurpose,
  CloudinaryResourceType,
} from '@/services/cloudinary.service';
import { IsIn } from 'class-validator';

const CLOUDINARY_RESOURCE_TYPE_VALUES: CloudinaryResourceType[] = [
  'image',
  'video',
];
const CLOUDINARY_UPLOAD_PURPOSE_VALUES: CloudinaryUploadPurpose[] = [
  'general',
  'location',
];

export class CreateUploadSignatureRequestDto {
  @ApiProperty({ enum: CLOUDINARY_RESOURCE_TYPE_VALUES })
  @IsIn(CLOUDINARY_RESOURCE_TYPE_VALUES)
  resourceType: CloudinaryResourceType;

  @ApiProperty({ enum: CLOUDINARY_UPLOAD_PURPOSE_VALUES })
  @IsIn(CLOUDINARY_UPLOAD_PURPOSE_VALUES)
  purpose: CloudinaryUploadPurpose;
}
