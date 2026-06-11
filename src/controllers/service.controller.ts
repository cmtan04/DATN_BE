import { Body, Controller, Get, Post } from '@nestjs/common';
import {
  CreateServiceRequestDto,
  ServiceResponseDto,
} from '@/dtos/service/service.dto';
import { ServiceService } from '@/services/service.service';

@Controller('services')
export class ServiceController {
  constructor(private readonly serviceService: ServiceService) {}

  @Get()
  public async getServices(): Promise<ServiceResponseDto[]> {
    return await this.serviceService.getServices();
  }

  @Post()
  public async createService(
    @Body() payload: CreateServiceRequestDto,
  ): Promise<ServiceResponseDto> {
    return await this.serviceService.createService(payload);
  }
}
