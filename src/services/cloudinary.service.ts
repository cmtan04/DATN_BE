import {
  BadRequestException,
  Injectable,
  HttpException,
  HttpStatus,
} from '@nestjs/common';
import cloudinary, {
  configureCloudinary,
} from '@common/cloudinary/cloudinary.config';
import { FileUpload } from '@/assets/interface/cloudinay.interface';
import { UploadApiOptions, UploadApiResponse } from 'cloudinary';

export type CloudinaryResourceType = 'image' | 'video';
export type CloudinaryUploadPurpose = 'general' | 'location';

export interface CreateUploadSignatureRequest {
  resourceType: CloudinaryResourceType;
  purpose: CloudinaryUploadPurpose;
}

export interface CreateUploadSignatureResponse {
  cloudName: string;
  apiKey: string;
  timestamp: number;
  signature: string;
  folder: string;
  resourceType: CloudinaryResourceType;
  uploadUrl: string;
  maxFileSize: number;
  allowedMimeTypes: string[];
}

const MAX_IMAGE_SIZE = 10 * 1024 * 1024;
const MAX_VIDEO_SIZE = 50 * 1024 * 1024;
const ALLOWED_IMAGE_MIME_TYPES = ['image/jpeg', 'image/png', 'image/webp'];
const ALLOWED_VIDEO_MIME_TYPES = ['video/mp4', 'video/webm', 'video/quicktime'];

@Injectable()
export class CloudinaryService {
  constructor() {
    configureCloudinary();
  }

  private resolveResourceType(mimetype: string): 'image' | 'video' | 'raw' {
    if (mimetype.startsWith('image/')) {
      return 'image';
    } else if (mimetype.startsWith('video/')) {
      return 'video';
    }
    return 'raw';
  }

  public async uploadMedia(file: FileUpload, folder: string): Promise<string> {
    if (!file?.buffer) {
      throw new Error('File buffer is empty');
    }
    try {
      const resourceType = this.resolveResourceType(file.mimetype);

      if (resourceType === 'raw') {
        throw new Error('Unsupported file type');
      }

      const uploadOptions: UploadApiOptions = {
        resource_type: resourceType,
        folder,
      };

      const result = await new Promise<UploadApiResponse>((resolve, reject) => {
        cloudinary.uploader
          .upload_stream(uploadOptions, (error, result) => {
            if (error) return reject(new Error(error.message));
            if (!result) return reject(new Error('Upload Failed!'));
            resolve(result);
          })
          .end(file.buffer); // Truyền dữ liệu dạng nhị phân (buffer) vào stream
      });
      if (!result.secure_url) {
        throw new Error('Upload Failed!');
      }
      return result.secure_url;
    } catch (error) {
      throw new HttpException(
        error instanceof Error ? error.message : 'Upload Failed!',
        HttpStatus.INTERNAL_SERVER_ERROR,
      );
    }
  }

  public async deleteMedia(publicId: string): Promise<void> {
    try {
      await cloudinary.uploader.destroy(publicId, { resource_type: 'auto' });
    } catch (error) {
      throw new HttpException(
        error instanceof Error ? error.message : 'Delete Failed!',
        HttpStatus.INTERNAL_SERVER_ERROR,
      );
    }
  }

  public createUploadSignature(
    payload: CreateUploadSignatureRequest,
  ): CreateUploadSignatureResponse {
    const resourceType = this.readResourceType(payload.resourceType);
    const purpose = this.readUploadPurpose(payload.purpose);
    const cloudName = this.readRequiredEnv('CLOUDINARY_CLOUD_NAME');
    const apiKey = this.readRequiredEnv('CLOUDINARY_API_KEY');
    const apiSecret = this.readRequiredEnv('CLOUDINARY_API_SECRET');
    const timestamp = Math.floor(Date.now() / 1000);
    const folder = this.resolveUploadFolder(resourceType, purpose);
    const signature = cloudinary.utils.api_sign_request(
      {
        folder,
        timestamp,
      },
      apiSecret,
    );

    return {
      cloudName,
      apiKey,
      timestamp,
      signature,
      folder,
      resourceType,
      uploadUrl: `https://api.cloudinary.com/v1_1/${cloudName}/${resourceType}/upload`,
      maxFileSize: resourceType === 'image' ? MAX_IMAGE_SIZE : MAX_VIDEO_SIZE,
      allowedMimeTypes:
        resourceType === 'image'
          ? ALLOWED_IMAGE_MIME_TYPES
          : ALLOWED_VIDEO_MIME_TYPES,
    };
  }

  public async uploadImage(file: FileUpload): Promise<string> {
    if (!file) {
      throw new HttpException('Image file is required.', HttpStatus.BAD_REQUEST);
    }

    if (!file.mimetype.startsWith('image/')) {
      throw new HttpException(
        'Unsupported file type. Only image files are allowed.',
        HttpStatus.BAD_REQUEST,
      );
    }

    // 2. Giới hạn 10MB
    if (file.size > 10 * 1024 * 1024) {
      throw new HttpException(
        'File size exceeds the limit of 10MB.',
        HttpStatus.BAD_REQUEST,
      );
    }

    // 3. Gọi hàm Core để thực hiện upload
    const mediaUrl = await this.uploadMedia(file, file.fieldname);

    // 4. Trả về kết quả
    return mediaUrl;
  }
  public async uploadVideo(file: FileUpload): Promise<string> {
    if (!file) {
      throw new HttpException('Video file is required.', HttpStatus.BAD_REQUEST);
    }

    if (!file.mimetype.startsWith('video/')) {
      throw new HttpException(
        'Unsupported file type. Only video files are allowed.',
        HttpStatus.BAD_REQUEST,
      );
    }

    // 2. Giới hạn 50MB
    if (file.size > 50 * 1024 * 1024) {
      throw new HttpException(
        'File size exceeds the limit of 50MB.',
        HttpStatus.BAD_REQUEST,
      );
    }

    // 3. Gọi hàm Core để thực hiện upload
    const mediaUrl = await this.uploadMedia(file, file.fieldname);

    // 4. Trả về kết quả
    return mediaUrl;
  }

  private readResourceType(value: unknown): CloudinaryResourceType {
    if (value === 'image' || value === 'video') {
      return value;
    }

    throw new BadRequestException('resourceType must be image or video');
  }

  private readUploadPurpose(value: unknown): CloudinaryUploadPurpose {
    if (value === 'general' || value === 'location') {
      return value;
    }

    throw new BadRequestException('purpose must be general or location');
  }

  private resolveUploadFolder(
    resourceType: CloudinaryResourceType,
    purpose: CloudinaryUploadPurpose,
  ): string {
    if (purpose === 'location') {
      if (resourceType !== 'image') {
        throw new BadRequestException('Location uploads only support images');
      }

      return 'locations';
    }

    return resourceType;
  }

  private readRequiredEnv(name: string): string {
    const value = process.env[name];

    if (!value) {
      throw new HttpException(
        `${name} is not configured`,
        HttpStatus.INTERNAL_SERVER_ERROR,
      );
    }

    return value;
  }
}
