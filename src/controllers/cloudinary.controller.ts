import {
  Body,
  Controller,
  Post,
  UploadedFile,
  UseInterceptors,
} from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import { CloudinaryService } from '@/services/cloudinary.service';
import type {
  CreateUploadSignatureRequest,
  CreateUploadSignatureResponse,
} from '@/services/cloudinary.service';
import { ApiTags, ApiOperation, ApiConsumes, ApiBody } from '@nestjs/swagger';

@ApiTags('Upload')
@Controller('upload')
export class CloudinaryController {
  constructor(private readonly cloudinaryService: CloudinaryService) {}

  @Post('signature')
  @ApiOperation({ summary: 'Create signed Cloudinary direct upload params' })
  @ApiBody({
    schema: {
      type: 'object',
      required: ['resourceType', 'purpose'],
      properties: {
        resourceType: {
          type: 'string',
          enum: ['image', 'video'],
        },
        purpose: {
          type: 'string',
          enum: ['general', 'location'],
        },
      },
    },
  })
  public createUploadSignature(
    @Body() payload: CreateUploadSignatureRequest,
  ): CreateUploadSignatureResponse {
    return this.cloudinaryService.createUploadSignature(payload);
  }

  @Post('image')
  @ApiOperation({ summary: 'Upload image to Cloudinary' })
  @ApiConsumes('multipart/form-data')
  @ApiBody({
    schema: {
      type: 'object',
      properties: {
        image: {
          type: 'string',
          format: 'binary',
        },
      },
    },
  })
  @UseInterceptors(FileInterceptor('image'))
  async uploadImage(
    @UploadedFile() image: Express.Multer.File, // File đã được Multer phân tích
  ): Promise<string> {
    // Chuyển việc xử lý chi tiết (check size, upload) cho CloudinaryService
    return await this.cloudinaryService.uploadImage(image);
  }

  @Post('video')
  @ApiOperation({ summary: 'Upload video to Cloudinary' })
  @ApiConsumes('multipart/form-data')
  @ApiBody({
    schema: {
      type: 'object',
      properties: {
        video: {
          type: 'string',
          format: 'binary',
        },
      },
    },
  })
  @UseInterceptors(FileInterceptor('video'))
  async uploadVideo(
    @UploadedFile() video: Express.Multer.File, // File đã được Multer phân tích
  ): Promise<string> {
    // Chuyển việc xử lý chi tiết (check size, upload) cho CloudinaryService
    return await this.cloudinaryService.uploadVideo(video);
  }
}
