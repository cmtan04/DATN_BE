import { CreateLocationRepositoryDto } from '@/dtos/location/createLocation.dto';
import {
  GetLocationsQueryDto,
  GetLocationsResponseDto,
  GetLocationDetailResponseDto,
  GetLocationTypeResponseDto,
} from '@/dtos/location/getLocations.dto';
import { TBLocationMedia } from '@/entities/location/location_media.entity';
import { TBLocationService } from '@/entities/location/location_service.entity';
import { TBLocationAddress } from '@/entities/location/location-address.entity';
import { TBLocationType } from '@/entities/location/location_type.entity';
import { TBLocation } from '@/entities/location/location.entity';
import { TBLocationAvailability } from '@/entities/location_availability.entity';
import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { DataSource, In, Repository, Brackets } from 'typeorm';
import { TBLocationFavourite } from '@/entities/location/location_favourite.entity';

@Injectable()
export class LocationRepository {
  constructor(private readonly dataSource: DataSource) {}

  @InjectRepository(TBLocation)
  private readonly location: Repository<TBLocation>;

  @InjectRepository(TBLocationMedia)
  private readonly locationMedia: Repository<TBLocationMedia>;

  @InjectRepository(TBLocationService)
  private readonly locationService: Repository<TBLocationService>;

  @InjectRepository(TBLocationAddress)
  private readonly locationAddress: Repository<TBLocationAddress>;

  @InjectRepository(TBLocationType)
  private readonly locationType: Repository<TBLocationType>;

  @InjectRepository(TBLocationFavourite)
  private readonly locationFavourite: Repository<TBLocationFavourite>;

  public async locationTypeExists(locationTypeId: number): Promise<boolean> {
    return await this.locationType.exists({ where: { id: locationTypeId } });
  }

  private buildEmptyLocationsResponse(
    page: number,
    limit: number,
  ): GetLocationsResponseDto {
    return {
      data: [],
      meta: {
        page: page,
        limit: limit,
        total: 0,
        totalPages: 0,
      },
    };
  }

  private baseQueryBuilder(
    filter: GetLocationsQueryDto,
    ownerId?: number,
    userId?: number,
  ) {
    const query = this.location
      .createQueryBuilder('location')
      .leftJoinAndSelect('location.type', 'type')
      .leftJoinAndSelect('location.address', 'address');
      
    if (ownerId !== undefined) {
      query.andWhere('location.ownerId = :ownerId', { ownerId });
    }

    if (userId !== undefined) {
      query.leftJoinAndSelect(
        'location.favourites',
        'favourite',
        'favourite.userId = :userId',
        { userId },
      );
    }

    if (filter.locationTypeId !== undefined) {
      query.andWhere('type.id = :locationTypeId', {
        locationTypeId: filter.locationTypeId,
      });
    }

    if (filter.guestCount !== undefined) {
      query.andWhere('location.maxGuestCount >= :guestCount', {
        guestCount: filter.guestCount,
      });
    }

    if (filter.minPrice !== undefined) {
      query.andWhere('location.price >= :minPrice', {
        minPrice: filter.minPrice,
      });
    }

    if (filter.maxPrice !== undefined) {
      query.andWhere('location.price <= :maxPrice', {
        maxPrice: filter.maxPrice,
      });
    }

    if (filter.minArea !== undefined) {
      query.andWhere('location.area >= :minArea', { minArea: filter.minArea });
    }

    if (filter.maxArea !== undefined) {
      query.andWhere('location.area <= :maxArea', { maxArea: filter.maxArea });
    }

    if (filter.keyword) {
      const cleanedKeyword = this.buildCleanedVietNameseString(filter.keyword);
      query.andWhere('address.normalFullAddress LIKE :keyword', {
        keyword: `%${cleanedKeyword}%`,
      });
    }

    if (
      filter.lat !== undefined &&
      filter.lng !== undefined &&
      filter.radiusKm !== undefined
    ) {
      const earthRadiusKm = 6371;
      query.andWhere(
        `(
          ${earthRadiusKm} * acos(
            cos(radians(:lat)) * cos(radians(address.lat)) *
            cos(radians(address.lng) - radians(:lng)) +
            sin(radians(:lat)) * sin(radians(address.lat))
          )
        ) <= :radiusKm`,
        {
          lat: filter.lat,
          lng: filter.lng,
          radiusKm: filter.radiusKm,
        },
      );
    }

    return query;
  }

  public async getLocations(
    filter: GetLocationsQueryDto,
    userId?: number,
    ownerId?: number,
  ): Promise<GetLocationsResponseDto> {
    const query = this.baseQueryBuilder(filter, ownerId, userId);
    const total = await query.getCount();

    if (total === 0)
      return this.buildEmptyLocationsResponse(filter.page, filter.limit);

    const baseLocations = await query
      .orderBy(filter?.sortBy ? `location.${filter.sortBy}` : 'location.id', filter?.sortOrder)
      .skip((filter.page - 1) * filter.limit)
      .take(filter.limit)
      .getMany();

    const locationIds = baseLocations.map((item) => item.id);

    const thumbnail = await this.locationMedia.find({
      where: { locationId: In(locationIds), displayOrder: 1 },
      select: ['id', 'type', 'url', 'locationId'],
    });

    const thumbnailMap = new Map(
      thumbnail.map((t) => [
        t.locationId,
        {
          id: t.id,
          type: t.type,
          url: t.url,
        },
      ]),
    );

    return {
      data: baseLocations.map((location) => ({
        id: location.id,
        name: location.name,
        description: location.description,
        price: location.price,
        priceUnit: location.priceUnit,
        area: location.area,
        maxGuestCount: location.maxGuestCount,
        averageRating: location.averageRating,
        isFavourite: Boolean(location.favourites && location.favourites.length > 0),
        address: location.address ? {
          id: location.address.id,
          fullAddress: location.address.fullAddress,
          lat: parseFloat(location.address.lat.toString()),
          lng: parseFloat(location.address.lng.toString()),
        } : { id: 0, fullAddress: '', lat: 0, lng: 0 },
        type: location.type ? {
          id: location.type.id,
          name: location.type.name,
          code: location.type.code,
        } : { id: 0, name: '', code: '' },
        thumbnailMedia: thumbnailMap.get(location.id) || null,
      })),
      meta: {
        page: filter.page,
        limit: filter.limit,
        total: total,
        totalPages: Math.ceil(total / filter.limit),
      },
    };
  }

  public async getLocationDetail(
    id: number,
    userId?: number,
  ): Promise<GetLocationDetailResponseDto | null> {
    const baseLocation = await this.location.findOne({
      where: { id },
      relations: [
        'address',
        'type',
        'media',
        'services',
        'services.service',
        'owner',
        'owner.userProfile',
        ...(userId !== undefined ? ['favourites'] : []),
      ],
    });
    
    if (!baseLocation) {
      return null;
    }

    let isFavourite = false;
    if (userId !== undefined && baseLocation.favourites) {
      isFavourite = baseLocation.favourites.some(f => f.userId === userId);
    }

    return {
      id: baseLocation.id,
      name: baseLocation.name,
      description: baseLocation.description,
      owner: baseLocation.owner ? {
        id: baseLocation.owner.id,
        fullName: baseLocation.owner.userProfile?.fullName || '',
        phoneNumber: baseLocation.owner.userProfile?.phoneNumber || '',
      } : null,
      price: baseLocation.price,
      priceUnit: baseLocation.priceUnit,
      area: baseLocation.area,
      maxGuestCount: baseLocation.maxGuestCount,
      averageRating: baseLocation.averageRating,
      isFavourite: isFavourite,
      createdAt: baseLocation.createdAt,
      address: baseLocation.address ? {
        id: baseLocation.address.id,
        fullAddress: baseLocation.address.fullAddress,
        lat: parseFloat(baseLocation.address.lat.toString()),
        lng: parseFloat(baseLocation.address.lng.toString()),
      } : null,
      type: baseLocation.type ? {
        id: baseLocation.type.id,
        name: baseLocation.type.name,
        code: baseLocation.type.code,
        canHaveMultiRoom: Boolean(baseLocation.type.canHaveMultiRoom),
      } : null,
      media: baseLocation.media ? [...baseLocation.media].sort((a, b) => a.displayOrder - b.displayOrder).map(m => ({
        id: m.id,
        type: m.type,
        url: m.url,
        displayOrder: m.displayOrder,
      })) : [],
      services: baseLocation.services ? baseLocation.services
        .filter(s => s.isActive)
        .sort((a, b) => {
          if (a.isFree !== b.isFree) return a.isFree ? -1 : 1;
          return (a.price || 0) - (b.price || 0);
        })
        .map(s => ({
          name: s.service?.name || '',
          isFree: Boolean(s.isFree),
          price: s.price ?? undefined,
          priceUnit: s.priceUnit ?? undefined,
          isActive: Boolean(s.isActive),
        })) : [],
    };
  }

  public async createLocation(
    payload: CreateLocationRepositoryDto,
  ): Promise<GetLocationDetailResponseDto> {
    const address = await this.locationAddress.save(
      this.locationAddress.create({
        ...payload.address,
        normalFullAddress: this.buildCleanedVietNameseString(
          payload.address.fullAddress,
        ),
      }),
    );
    const location = await this.location.save(
      this.location.create({
        name: payload.name,
        description: payload.description ?? null,
        ownerId: payload.ownerId,
        price: payload.price,
        priceUnit: payload.priceUnit,
        area: payload.area,
        maxGuestCount: payload.maxGuestCount,
        quantity: payload.quantity,
        locationAddressId: address.id,
        locationTypeId: payload.locationTypeId,
        averageRating: 0,
      }),
    );

    if (payload.media && payload.media.length > 0) {
      await this.locationMedia.save(
        payload.media.map((media) =>
          this.locationMedia.create({
            ...media,
            locationId: location.id,
          }),
        ),
      );
    }

    if (payload.services && payload.services.length > 0) {
      await this.locationService.save(
        payload.services.map((service) =>
          this.locationService.create({
            locationId: location.id,
            serviceId: service.serviceId,
            price: service.isFree ? undefined : service.price,
            priceUnit: service.priceUnit,
            isFree: service.isFree,
            isActive: service.isActive ?? true,
          }),
        ),
      );
    }

    return (await this.getLocationDetail(
      location.id,
    )) as GetLocationDetailResponseDto;
  }

  public async getAllLocationTypes(): Promise<GetLocationTypeResponseDto[]> {
    const locationTypes = await this.locationType.find();
    return locationTypes.map((type) => ({
      id: type.id,
      name: type.name,
      code: type.code,
      canHaveMultiRoom: Boolean(type.canHaveMultiRoom),
    }));
  }

  public async findOwnerIdByLocationId(
    locationId: number,
  ): Promise<number | null> {
    const location = await this.location.findOne({
      select: { ownerId: true },
      where: { id: locationId },
    });

    return location?.ownerId ?? null;
  }

  public async countMediaByLocationId(locationId: number): Promise<number> {
    return await this.locationMedia.count({ where: { locationId } });
  }

  private buildCleanedVietNameseString(str: string): string {
    return str
      .normalize('NFD')
      .replace(/[\u0300-\u036f]/g, '') // Loại bỏ dấu tiếng Việt
      .replace(/đ/gi, 'd')
      .replaceAll('-', ' ') // Thay dấu gạch ngang bằng khoảng trắng
      .split(',')
      .map((part) => part.trim())
      .filter((part) => part.length > 0)
      .join(', ')
      .replace(/[^a-zA-Z0-9, ]/g, '') // Xóa bỏ mọi ký tự đặc biệt khác, chỉ giữ chữ cái, số, dấu phẩy và khoảng trắng
      .replace(/\s+/g, ' ') // Thay nhiều khoảng trắng liên tiếp bằng một khoảng trắng duy nhất
      .toLowerCase()
      .trim(); // Xóa khoảng trắng thừa ở 2 đầu
  }

  public async findRelatedLocations(
    locationId: number,
    userId?: number,
  ): Promise<GetLocationsResponseDto> {
    const sourceLocation = await this.location.findOne({
      where: { id: locationId },
      relations: ['address'],
      select: ['id', 'locationTypeId'],
    });

    if (!sourceLocation || !sourceLocation.address) {
      return this.buildEmptyLocationsResponse(1, 10);
    }

    const query = this.location.createQueryBuilder('location')
      .leftJoinAndSelect('location.type', 'type')
      .leftJoinAndSelect('location.address', 'address');

    if (userId !== undefined) {
      query.leftJoinAndSelect(
        'location.favourites',
        'favourite',
        'favourite.userId = :userId',
        { userId },
      );
    }

    const relatedLocations = await query
      .where('location.id != :locationId', { locationId })
      .andWhere('location.locationTypeId = :sourceLocationTypeId', {
        sourceLocationTypeId: sourceLocation.locationTypeId,
      })
      .andWhere(
        new Brackets((qb) => {
          qb.where('address.district = :sourceDistrict', {
            sourceDistrict: sourceLocation.address.district,
          }).orWhere('address.province = :sourceProvince', {
            sourceProvince: sourceLocation.address.province,
          });
        }),
      )
      .orderBy('location.averageRating', 'DESC')
      .addOrderBy('location.createdAt', 'DESC')
      .addOrderBy('location.id', 'ASC')
      .take(3)
      .getMany();

    const locationIds = relatedLocations.map((item) => item.id);
    if (locationIds.length === 0) {
      return this.buildEmptyLocationsResponse(1, 3);
    }

    const thumbnail = await this.locationMedia.find({
      where: { locationId: In(locationIds), displayOrder: 1 },
      select: ['id', 'type', 'url', 'locationId'],
    });

    const thumbnailMap = new Map(
      thumbnail.map((t) => [
        t.locationId,
        {
          id: t.id,
          type: t.type,
          url: t.url,
        },
      ]),
    );

    return {
      data: relatedLocations.map((location) => ({
        id: location.id,
        name: location.name,
        description: location.description,
        price: location.price,
        priceUnit: location.priceUnit,
        area: location.area,
        maxGuestCount: location.maxGuestCount,
        averageRating: location.averageRating,
        isFavourite: Boolean(location.favourites && location.favourites.length > 0),
        address: location.address ? {
          id: location.address.id,
          fullAddress: location.address.fullAddress,
          lat: parseFloat(location.address.lat.toString()),
          lng: parseFloat(location.address.lng.toString()),
        } : { id: 0, fullAddress: '', lat: 0, lng: 0 },
        type: location.type ? {
          id: location.type.id,
          name: location.type.name,
          code: location.type.code,
        } : { id: 0, name: '', code: '' },
        thumbnailMedia: thumbnailMap.get(location.id) || null,
      })),
      meta: {
        page: 1,
        limit: 4,
        total: relatedLocations.length,
        totalPages: Math.ceil(relatedLocations.length / 4),
      },
    };
  }
  
  public async toggleFavouriteLocation(
    userId: number,
    locationId: number,
  ): Promise<{ isFavourite: boolean }> {
    const existingFavourite = await this.locationFavourite.findOne({
      where: { locationId, userId },
    });

    if (existingFavourite) {
      await this.locationFavourite.delete({ locationId, userId });
      return { isFavourite: false };
    } else {
      await this.locationFavourite.save({ locationId, userId });
      return { isFavourite: true };
    }
  }
}
