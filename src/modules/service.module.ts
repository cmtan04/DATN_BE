import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { ServiceController } from '@/controllers/service.controller';
import { TBService } from '@/entities/service.entity';
import { ServiceRepository } from '@/repositories/service.repository';
import { ServiceService } from '@/services/service.service';

@Module({
  imports: [TypeOrmModule.forFeature([TBService])],
  controllers: [ServiceController],
  providers: [ServiceService, ServiceRepository],
  exports: [ServiceRepository],
})
export class ServiceModule {}
