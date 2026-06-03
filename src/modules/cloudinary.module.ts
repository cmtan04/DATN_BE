import { Module } from '@nestjs/common';
import { CloudinaryController } from '@/controllers/cloudinary.controller';
import { CloudinaryService } from '@/services/cloudinary.service';

@Module({
  controllers: [CloudinaryController],
  providers: [CloudinaryService],
  exports: [CloudinaryService],
})
export class CloudinaryModule {}
