import { BadRequestException, Injectable } from '@nestjs/common';
import {
  CreateServiceRequestDto,
  ServiceResponseDto,
} from '@/dtos/service/service.dto';
import { ServiceRepository } from '@/repositories/service.repository';

const MAX_SERVICE_NAME_LENGTH = 255;

@Injectable()
export class ServiceService {
  constructor(private readonly serviceRepository: ServiceRepository) {}

  public async getServices(): Promise<ServiceResponseDto[]> {
    return await this.serviceRepository.findAll();
  }

  public async createService(
    payload: CreateServiceRequestDto,
  ): Promise<ServiceResponseDto> {
    const name = this.readRequiredName(payload.name);

    return await this.serviceRepository.findOrCreateByName(name);
  }

  private readRequiredName(value: unknown): string {
    if (typeof value !== 'string' || !value.trim()) {
      throw new BadRequestException('service name is required');
    }

    const trimmed = value.trim();

    if (trimmed.length > MAX_SERVICE_NAME_LENGTH) {
      throw new BadRequestException('service name is too long');
    }

    return trimmed;
  }
}
