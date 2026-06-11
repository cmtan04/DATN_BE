import {
  CreateLocationRepositoryDto,
  CreateLocationServiceRequestDto,
} from '@/dtos/location/createLocation.dto';
import {
  GetLocationsQueryDto,
  GetLocationsResponseDto,
  GetLocationAddressResponseDto,
  GetLocationDetailResponseDto,
  GetLocationMediaResponseDto,
  GetLocationOwnerResponseDto,
  GetLocationServiceResponseDto,
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
import { Brackets, DataSource, In, Repository } from 'typeorm';
import { TBService } from '@/entities/service.entity';

interface LocationRawRow {
  location_id: number;
  location_name: string;
  location_description: string | null;
  location_ownerId: number;
  location_price: number;
  location_priceUnit: string;
  location_area: number;
  location_maxGuestCount: number;
  location_averageRating: string | number;
  location_createdAt: Date;
  address_id: number | null;
  address_fullAddress: string | null;
  address_province: string | null;
  address_district: string | null;
  address_country: string | null;
  address_region: string | null;
  address_lat: string | number | null;
  address_lng: string | number | null;
  type_id: number | null;
  type_name: string | null;
  type_code: string | null;
  type_canHaveMultiRoom: number | null;
  media_id: number | null;
  media_type: string | null;
  media_url: string | null;
  media_displayOrder: number | null;
  owner_fullName: string | null;
  owner_phone: string | null;
}

interface RelatedLocationSourceRawRow {
  location_locationTypeId: number | null;
  address_province: string | null;
  address_district: string | null;
}

const RELATED_LOCATIONS_LIMIT = 6;

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

  @InjectRepository(TBService)
  private readonly service: Repository<TBService>;

  public async locationTypeExists(locationTypeId: number): Promise<boolean> {
    return await this.dataSource
      .getRepository(TBLocationType)
      .exists({ where: { id: locationTypeId } });
  }

  private buildEmptyLocationsResponse(): GetLocationsResponseDto {
    return {
      data: [],
      meta: {
        page: 1,
        limit: RELATED_LOCATIONS_LIMIT,
        total: 0,
        totalPages: 0,
      },
    };
  }

  private async getLocationAddress(
    locationId: number,
  ): Promise<GetLocationAddressResponseDto | null> {
    const address = await this.locationAddress.findOne({
      where: { id: locationId },
    });
    if (!address) {
      return null;
    }
    return {
      id: address.id,
      fullAddress: address.fullAddress,
      lat: parseFloat(address.lat.toString()),
      lng: parseFloat(address.lng.toString()),
    };
  }

  private async getLocationServices(
    locationId: number,
  ): Promise<GetLocationServiceResponseDto[]> {
    const locationServices = await this.locationService
      .createQueryBuilder('ls')
      .leftJoin('service', 's', 's.id = ls.serviceId') // Dùng leftJoin thay vì leftJoinAndSelect
      .select([
        'ls.isFree AS isFree',
        'ls.price AS price',
        'ls.priceUnit AS priceUnit',
        'ls.isActive AS isActive',
        's.name AS name',
      ])
      .where('ls.locationId = :locationId', { locationId })
      .getRawMany<GetLocationServiceResponseDto>();

    return locationServices.map((ls) => ({
      name: ls.name,
      isFree: Boolean(ls.isFree),
      price: ls.price ?? undefined,
      priceUnit: ls.priceUnit ?? undefined,
      isActive: Boolean(ls.isActive),
    }));
  }

  private async getLocationType(
    locationTypeId: number,
  ): Promise<GetLocationTypeResponseDto | null> {
    const locationType = await this.locationType.findOne({
      where: { id: locationTypeId },
    });
    if (!locationType) {
      return null;
    }
    return {
      id: locationType.id,
      name: locationType.name,
      code: locationType.code,
      canHaveMultiRoom: Boolean(locationType.canHaveMultiRoom),
    };
  }

  private async getLocationMedia(
    locationId: number,
  ): Promise<GetLocationMediaResponseDto[]> {
    const media = await this.locationMedia.find({
      where: { locationId },
      order: { displayOrder: 'ASC' },
    });
    return media.map((m) => ({
      id: m.id,
      type: m.type,
      url: m.url,
      displayOrder: m.displayOrder,
    }));
  }

  private async getLocationOwner(
    id: number,
  ): Promise<GetLocationOwnerResponseDto | null> {
    const ownerQuery = this.dataSource
      .getRepository('tb_user_default')
      .createQueryBuilder('user');
    const owner = await ownerQuery
      .leftJoin('tb_user_profile', 'profile', 'profile.id = user.userProfileId')
      .select(['user.id', 'profile.phoneNumber', 'profile.fullName'])
      .where('user.id = :ownerId', { ownerId: id })
      .getOne();

    if (!owner) return null;
    return {
      id: owner.id,
      fullName: owner.fullName,
      phoneNumber: owner.phoneNumber,
    };
  }

  private async baseQueryBuilder(
    filter: GetLocationsQueryDto,
    ownerId?: number,
  ) {
    const query = this.location
      .createQueryBuilder('location')
      .leftJoin('tb_location_type', 'type', 'type.id = location.locationTypeId')
      .leftJoin(
        'tb_location_address',
        'address',
        'address.id = location.locationAddressId',
      );

    if (ownerId !== undefined) {
      query.andWhere('location.ownerId = :ownerId', { ownerId });
    }

    if (filter.locationTypeId !== undefined) {
      query.andWhere('type.id = :locationTypeId', {
        locationTypeId: filter.locationTypeId,
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
    ownerId?: number,
  ): Promise<GetLocationsResponseDto> {
    const query = await this.baseQueryBuilder(filter, ownerId);
    const total = await query.getCount();

    // Lay id cac phong
    const baseLocation = await query
      .select([
        'location.id as id',
        'location.name as name',
        'location.description as description',
        'location.price as price',
        'location.priceUnit as priceUnit',
        'location.area as area',
        'location.maxGuestCount as maxGuestCount',
        'location.averageRating as averageRating',
        'type.id as typeId',
        'type.name as typeName',
        'type.code as typeCode',
        'address.id as addressId',
        'address.fullAddress as fullAddress',
        'address.lat as lat',
        'address.lng as lng',
      ])
      .orderBy(filter?.sortBy || 'location.id', filter?.sortOrder)
      .skip((filter.page - 1) * filter.limit) // Phân trang
      .take(filter.limit)
      .getRawMany();

    const locationIds = baseLocation.map((item) => item.id);

    if (locationIds.length === 0) return this.buildEmptyLocationsResponse();

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
      data: baseLocation.map((location) => ({
        id: location.id,
        name: location.name,
        description: location.description,
        price: location.price,
        priceUnit: location.priceUnit,
        area: location.area,
        maxGuestCount: location.maxGuestCount,
        averageRating: location.averageRating,
        address: {
          id: location.addressId,
          fullAddress: location.fullAddress,
          lat: location.lat,
          lng: location.lng,
        },
        type: {
          id: location.typeId,
          name: location.typeName,
          code: location.typeCode,
        },
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
  ): Promise<GetLocationDetailResponseDto | null> {
    const baseLocation = await this.location.findOne({
      where: { id },
    });
    if (!baseLocation) {
      return null;
    }

    const owner = await this.getLocationOwner(baseLocation.ownerId);
    const address = await this.getLocationAddress(
      baseLocation.locationAddressId!,
    );
    const type = await this.getLocationType(baseLocation.locationTypeId!);
    const media = await this.getLocationMedia(baseLocation.id);
    const services = await this.getLocationServices(baseLocation.id);
    return {
      id: baseLocation.id,
      name: baseLocation.name,
      description: baseLocation.description,
      owner: owner,
      price: baseLocation.price,
      priceUnit: baseLocation.priceUnit,
      area: baseLocation.area,
      maxGuestCount: baseLocation.maxGuestCount,
      averageRating: baseLocation.averageRating,
      createdAt: baseLocation.createdAt,
      address: address || null,
      type: type || null,
      media: media || [],
      services: services || [],
    };
  }

  public async createLocation(
    payload: CreateLocationRepositoryDto,
  ): Promise<GetLocationDetailResponseDto> {
    const address = await this.locationAddress.save(
      this.locationAddress.create(payload.address),
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

    await this.locationMedia.save(
      payload.media.map((media) =>
        this.locationMedia.create({
          ...media,
          locationId: location.id,
        }),
      ),
    );

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

  // private async createLocationService(
  //   body: CreateLocationServiceRequestDto,
  // ): Promise<CreateLocationServiceResponseDto> {
  //   const locationService = await this.locationService.save(
  //     this.locationService.create(body),
  //   );
  //   return {
  //     locationId: locationService.locationId,
  //     serviceId: locationService.serviceId,
  //     isFree: locationService.isFree,
  //     price: locationService.price ?? undefined,
  //     priceUnit: locationService.priceUnit ?? undefined,
  //     isActive: locationService.isActive,
  //   };
  // }

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

  // private mapRowToResponse(row: LocationRawRow): GetLocationsResponseDto {
  //   return {
  //     id: Number(row.location_id),
  //     name: row.location_name,
  //     description: row.location_description,
  //     price: Number(row.location_price),
  //     priceUnit: row.location_priceUnit,
  //     area: Number(row.location_area),
  //     maxGuestCount: Number(row.location_maxGuestCount),
  //     averageRating: Number(row.location_averageRating),
  //     createdAt: row.location_createdAt,
  //     address: row.address_id
  //       ? {
  //           id: Number(row.address_id),
  //           fullAddress: row.address_fullAddress ?? '',
  //           province: row.address_province ?? '',
  //           district: row.address_district ?? '',
  //           country: row.address_country ?? '',
  //           region: row.address_region ?? '',
  //           lat: Number(row.address_lat),
  //           lng: Number(row.address_lng),
  //         }
  //       : null,
  //     type: row.type_id
  //       ? {
  //           id: Number(row.type_id),
  //           name: row.type_name ?? '',
  //           code: row.type_code ?? '',
  //           canHaveMultiRoom: Number(row.type_canHaveMultiRoom),
  //         }
  //       : null,
  //     thumbnailMedia: row.media_id
  //       ? {
  //           id: Number(row.media_id),
  //           type: row.media_type ?? '',
  //           url: row.media_url ?? '',
  //           displayOrder: Number(row.media_displayOrder),
  //         }
  //       : null,
  //   };
  // }

  // public async findRelatedLocations(
  //   locationId: number,
  // ): Promise<GetLocationsResponseDto> {
  //   const sourceLocation = await this.location
  //     .createQueryBuilder('location')
  //     .innerJoin(
  //       'tb_location_address',
  //       'address',
  //       'address.id = location.locationAddressId',
  //     )
  //     .select([
  //       'location.locationTypeId AS location_locationTypeId',
  //       'address.province AS address_province',
  //       'address.district AS address_district',
  //     ])
  //     .where('location.id = :locationId', { locationId })
  //     .getRawOne<RelatedLocationSourceRawRow>();

  //   if (!sourceLocation) {
  //     return this.buildEmptyLocationsResponse();
  //   }

  //   // Related locations must share district or province with the source.
  //   // Location type only decides priority inside that area-matched result set.
  //   const sameDistrictPriority =
  //     'CASE WHEN address.district = :sourceDistrict THEN 1 ELSE 0 END';
  //   const sameProvincePriority =
  //     'CASE WHEN address.province = :sourceProvince THEN 1 ELSE 0 END';
  //   const sameTypePriority =
  //     'CASE WHEN location.locationTypeId = :sourceLocationTypeId THEN 1 ELSE 0 END';

  //   const rows = await this.location
  //     .createQueryBuilder('location')
  //     .leftJoin('tb_user_default', 'user', 'user.id = location.ownerId')
  //     .leftJoin('tb_user_profile', 'profile', 'profile.id = user.userProfileId')
  //     .leftJoin(
  //       'tb_location_address',
  //       'address',
  //       'address.id = location.locationAddressId',
  //     )
  //     .leftJoin('tb_location_type', 'type', 'type.id = location.locationTypeId')
  //     .leftJoin(
  //       'tb_location_media',
  //       'media',
  //       `media.id = (
  //         SELECT thumbnail.id
  //         FROM tb_location_media thumbnail
  //         WHERE thumbnail.locationId = location.id
  //         ORDER BY thumbnail.displayOrder ASC, thumbnail.id ASC
  //         LIMIT 1
  //       )`,
  //     )
  //     .select([
  //       'location.id AS location_id',
  //       'location.name AS location_name',
  //       'location.description AS location_description',
  //       'location.ownerId AS location_ownerId',
  //       'location.price AS location_price',
  //       'location.priceUnit AS location_priceUnit',
  //       'location.area AS location_area',
  //       'location.maxGuestCount AS location_maxGuestCount',
  //       'location.averageRating AS location_averageRating',
  //       'location.createdAt AS location_createdAt',
  //       'profile.phoneNumber AS owner_phone',
  //       'profile.fullName AS owner_fullName',
  //       'address.id AS address_id',
  //       'address.fullAddress AS address_fullAddress',
  //       'address.province AS address_province',
  //       'address.district AS address_district',
  //       'address.country AS address_country',
  //       'address.region AS address_region',
  //       'address.lat AS address_lat',
  //       'address.lng AS address_lng',
  //       'type.id AS type_id',
  //       'type.name AS type_name',
  //       'type.code AS type_code',
  //       'type.canHaveMultiRoom AS type_canHaveMultiRoom',
  //       'media.id AS media_id',
  //       'media.type AS media_type',
  //       'media.url AS media_url',
  //       'media.displayOrder AS media_displayOrder',
  //       `${sameDistrictPriority} AS sameDistrictPriority`,
  //       `${sameProvincePriority} AS sameProvincePriority`,
  //       `${sameTypePriority} AS sameTypePriority`,
  //     ])
  //     .where('location.id != :locationId', { locationId })
  //     // Only keep rooms in the same district or province as the source.
  //     .andWhere(
  //       new Brackets((qb) => {
  //         qb.where('address.district = :sourceDistrict').orWhere(
  //           'address.province = :sourceProvince',
  //         );
  //       }),
  //     )
  //     .orderBy('sameDistrictPriority', 'DESC')
  //     .addOrderBy('sameProvincePriority', 'DESC')
  //     .addOrderBy('sameTypePriority', 'DESC')
  //     .addOrderBy('location.averageRating', 'DESC')
  //     .addOrderBy('location.createdAt', 'DESC')
  //     .addOrderBy('location.id', 'ASC')
  //     .limit(RELATED_LOCATIONS_LIMIT)
  //     .setParameters({
  //       sourceDistrict: sourceLocation.address_district,
  //       sourceProvince: sourceLocation.address_province,
  //       sourceLocationTypeId: sourceLocation.location_locationTypeId,
  //     })
  //     .getRawMany<LocationRawRow>();

  //   return {
  //     data: rows.map((row) => this.mapRowToResponse(row)),
  //     meta: {
  //       page: 1,
  //       limit: RELATED_LOCATIONS_LIMIT,
  //       total: rows.length,
  //       totalPages: rows.length > 0 ? 1 : 0,
  //     },
  //   };
  // }
}
