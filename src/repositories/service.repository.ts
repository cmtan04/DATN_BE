import {
  CreateServiceRequestDto,
  ServiceResponseDto,
} from '@/dtos/service/service.dto';
import { TBService } from '@/entities/service.entity';
import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { In, Repository } from 'typeorm';

@Injectable()
export class ServiceRepository {
  constructor(
    @InjectRepository(TBService)
    private readonly serviceRepository: Repository<TBService>,
  ) {}

  public async findAll(): Promise<ServiceResponseDto[]> {
    const services = await this.serviceRepository.find({
      order: { name: 'ASC', id: 'ASC' },
    });

    return services.map((service) => ({
      id: service.id,
      name: service.name,
    }));
  }

  public async findOrCreateByName(name: string): Promise<ServiceResponseDto> {
    const normalizedName = name.trim().toLowerCase();
    const existedService = await this.serviceRepository
      .createQueryBuilder('service')
      .where('LOWER(TRIM(service.name)) = :name', { name: normalizedName })
      .getOne();

    const service =
      existedService ??
      (await this.serviceRepository.save(
        this.serviceRepository.create({
          name: name.trim(),
        }),
      ));

    return {
      id: service.id,
      name: service.name,
    };
  }

  public async findExistingIds(serviceIds: number[]): Promise<number[]> {
    if (serviceIds.length === 0) {
      return [];
    }

    const services = await this.serviceRepository.find({
      select: { id: true },
      where: { id: In(serviceIds) },
    });

    return services.map((service) => service.id);
  }

  public async createServices(name: string): Promise<any> {
    const service = await this.serviceRepository.save(
      this.serviceRepository.create({
        name: name.trim(),
      }),
    );

    return {
      id: service.id,
      name: service.name,
    };
  }
}
