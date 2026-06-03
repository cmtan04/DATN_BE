import {
  CreateLocationRepositoryDto,
  CreateLocationRequestDto,
  ServiceResponseDto,
} from '@/dtos/location/createLocation.dto';
import {
  GetLocationsFilter,
  GetLocationsResponseDto,
  LocationDetailResponseDto,
  LocationListItemResponseDto,
  LocationMediaResponseDto,
  LocationOwnerResponseDto,
  LocationServiceResponseDto,
} from '@/dtos/location/getLocations.dto';
import { TBLocationMedia } from '@/entities/location/location_media.entity';
import { TBLocationService } from '@/entities/location/location_service.entity';
import { TBLocationAddress } from '@/entities/location/location-address.entity';
import { TBLocationType } from '@/entities/location/location_type.entity';
import { TBLocation } from '@/entities/location/location.entity';
import { TBService } from '@/entities/service.entity';
import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import {
  Brackets,
  DataSource,
  In,
  Repository,
  SelectQueryBuilder,
} from 'typeorm';

interface LocationRawRow {
  location_id: number;
  location_name: string;
  location_description: string | null;
  location_ownerId: number;
  location_price: number;
  location_priceUnit: string;
  location_area: number;
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
  media_id: number | null;
  media_type: string | null;
  media_url: string | null;
  media_displayOrder: number | null;
  owner_fullName: string | null;
  owner_phone: string | null;
}

interface LocationServiceRawRow {
  id: number;
  name: string;
  isFree: boolean | number;
  price: number | null;
  priceUnit: string | null;
  isActive: boolean | number;
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

  public async findAllServices(): Promise<ServiceResponseDto[]> {
    const services = await this.service.find({
      order: { name: 'ASC', id: 'ASC' },
    });

    return services.map((service) => ({
      id: service.id,
      name: service.name,
    }));
  }

  public async findOrCreateServiceByName(
    name: string,
  ): Promise<ServiceResponseDto> {
    const normalizedName = name.trim().toLowerCase();
    const existedService = await this.service
      .createQueryBuilder('service')
      .where('LOWER(TRIM(service.name)) = :name', { name: normalizedName })
      .getOne();

    const service =
      existedService ??
      (await this.service.save(
        this.service.create({
          name: name.trim(),
        }),
      ));

    return {
      id: service.id,
      name: service.name,
    };
  }

  public async locationTypeExists(locationTypeId: number): Promise<boolean> {
    return await this.dataSource
      .getRepository(TBLocationType)
      .exists({ where: { id: locationTypeId } });
  }

  public async findExistingServiceIds(serviceIds: number[]): Promise<number[]> {
    if (serviceIds.length === 0) {
      return [];
    }

    const services = await this.service.find({
      select: { id: true },
      where: { id: In(serviceIds) },
    });

    return services.map((service) => service.id);
  }

  public async createLocation(
    payload: CreateLocationRepositoryDto,
  ): Promise<LocationDetailResponseDto> {
    const address = await this.locationAddress.save(
      this.locationAddress.create(payload.address),
    );
    const location = await this.location.save(
      this.location.create({
        name: payload.name,
        description: payload.description ?? null,
        price: payload.price,
        priceUnit: payload.priceUnit,
        area: payload.area,
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

    return await this.findLocationDetailById(location.id);
  }

  public async findLocations(
    filter: GetLocationsFilter,
    id?: number,
  ): Promise<GetLocationsResponseDto> {
    const baseQuery = this.buildBaseQuery(filter, id);
    const total = await baseQuery.getCount();

    const rows = await baseQuery
      .select([
        'location.id AS location_id',
        'location.name AS location_name',
        'location.description AS location_description',
        'location.ownerId AS location_ownerId',
        'location.price AS location_price',
        'location.priceUnit AS location_priceUnit',
        'location.area AS location_area',
        'location.averageRating AS location_averageRating',
        'location.createdAt AS location_createdAt',
        'profile.phoneNumber AS owner_phone',
        'profile.fullName AS owner_fullName',
        'address.id AS address_id',
        'address.fullAddress AS address_fullAddress',
        'address.province AS address_province',
        'address.district AS address_district',
        'address.country AS address_country',
        'address.region AS address_region',
        'address.lat AS address_lat',
        'address.lng AS address_lng',
        'type.id AS type_id',
        'type.name AS type_name',
        'type.code AS type_code',
        'media.id AS media_id',
        'media.type AS media_type',
        'media.url AS media_url',
        'media.displayOrder AS media_displayOrder',
      ])
      .orderBy(this.getSortColumn(filter.sortBy), filter.sortOrder)
      .addOrderBy('location.id', 'ASC')
      .offset((filter.page - 1) * filter.limit)
      .limit(filter.limit)
      .getRawMany<LocationRawRow>();

    return {
      data: rows.map((row) => this.mapRowToResponse(row)),
      meta: {
        page: filter.page,
        limit: filter.limit,
        total,
        totalPages: Math.ceil(total / filter.limit),
      },
    };
  }

  public async findLocationDetailById(
    id: number,
  ): Promise<LocationDetailResponseDto> {
    const baseQuery = this.buildBaseQuery(
      {
        page: 1,
        limit: 1,
        sortBy: 'createdAt',
        sortOrder: 'DESC',
      },
      id,
    );
    const total = await baseQuery.getCount();

    const row = await baseQuery
      .select([
        'location.id AS location_id',
        'location.name AS location_name',
        'location.description AS location_description',
        'location.ownerId AS location_ownerId',
        'location.price AS location_price',
        'location.priceUnit AS location_priceUnit',
        'location.area AS location_area',
        'location.averageRating AS location_averageRating',
        'location.createdAt AS location_createdAt',
        'profile.phoneNumber AS owner_phone',
        'profile.fullName AS owner_fullName',
        'address.id AS address_id',
        'address.fullAddress AS address_fullAddress',
        'address.province AS address_province',
        'address.district AS address_district',
        'address.country AS address_country',
        'address.region AS address_region',
        'address.lat AS address_lat',
        'address.lng AS address_lng',
        'type.id AS type_id',
        'type.name AS type_name',
        'type.code AS type_code',
      ])
      .getRawOne<LocationRawRow>();

    const media = await this.findMediaByLocationId(id);
    const services = await this.findServicesByLocationId(id);

    return this.mapRowToDetailResponse(row!, media, services);
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

  private buildBaseQuery(
    filter: GetLocationsFilter,
    id?: number,
  ): SelectQueryBuilder<TBLocation> {
    const query = this.location
      .createQueryBuilder('location')
      .leftJoin('tb_user_default', 'user', 'user.id = location.ownerId')
      .leftJoin('tb_user_profile', 'profile', 'profile.id = user.userProfileId')
      .leftJoin(
        'tb_location_address',
        'address',
        'address.id = location.locationAddressId',
      )
      .leftJoin('tb_location_type', 'type', 'type.id = location.locationTypeId')
      .leftJoin(
        'tb_location_media',
        'media',
        `media.id = (
          SELECT thumbnail.id
          FROM tb_location_media thumbnail
          WHERE thumbnail.locationId = location.id
          ORDER BY thumbnail.displayOrder ASC, thumbnail.id ASC
          LIMIT 1
        )`,
      );

    if (id !== undefined) {
      query.andWhere('location.id = :id', { id });
    }

    if (filter.ownerId !== undefined) {
      query.andWhere('location.ownerId = :ownerId', {
        ownerId: filter.ownerId,
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
      query.andWhere('location.area >= :minArea', {
        minArea: filter.minArea,
      });
    }

    if (filter.maxArea !== undefined) {
      query.andWhere('location.area <= :maxArea', {
        maxArea: filter.maxArea,
      });
    }

    if (filter.locationTypeId !== undefined) {
      query.andWhere('location.locationTypeId = :locationTypeId', {
        locationTypeId: filter.locationTypeId,
      });
    }

    if (filter.addressRegion) {
      query.andWhere(
        new Brackets((qb) => {
          qb.where('address.region LIKE :addressRegion')
            .orWhere('address.province LIKE :addressRegion')
            .orWhere('address.district LIKE :addressRegion')
            .orWhere('address.fullAddress LIKE :addressRegion');
        }),
      );
      query.setParameter('addressRegion', `%${filter.addressRegion}%`);
    }

    if (filter.keyword) {
      this.applyTextSearch(query, filter.keyword, 'keyword');
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

  private applyTextSearch(
    query: SelectQueryBuilder<TBLocation>,
    value: string,
    parameterName: string,
  ): void {
    query.andWhere(this.buildTextSearchCondition(parameterName));
    query.setParameter(parameterName, `%${value}%`);
  }

  private buildTextSearchCondition(parameterName: string): string {
    return `(
      location.name LIKE :${parameterName}
      OR location.description LIKE :${parameterName}
      OR address.fullAddress LIKE :${parameterName}
      OR address.province LIKE :${parameterName}
      OR address.district LIKE :${parameterName}
      OR address.region LIKE :${parameterName}
      OR address.country LIKE :${parameterName}
      OR type.name LIKE :${parameterName}
      OR EXISTS (
        SELECT 1
        FROM tb_location_service locationServiceSearch
        INNER JOIN tb_service serviceSearch
          ON serviceSearch.id = locationServiceSearch.serviceId
        WHERE locationServiceSearch.locationId = location.id
          AND serviceSearch.name LIKE :${parameterName}
      )
    )`;
  }

  private getSortColumn(sortBy: GetLocationsFilter['sortBy']): string {
    const sortColumns: Record<GetLocationsFilter['sortBy'], string> = {
      price: 'location.price',
      area: 'location.area',
      rating: 'location.averageRating',
      createdAt: 'location.createdAt',
    };

    return sortColumns[sortBy];
  }

  private mapRowToResponse(row: LocationRawRow): LocationListItemResponseDto {
    return {
      id: Number(row.location_id),
      name: row.location_name,
      description: row.location_description,
      price: Number(row.location_price),
      priceUnit: row.location_priceUnit,
      area: Number(row.location_area),
      averageRating: Number(row.location_averageRating),
      createdAt: row.location_createdAt,
      address: row.address_id
        ? {
            id: Number(row.address_id),
            fullAddress: row.address_fullAddress ?? '',
            province: row.address_province ?? '',
            district: row.address_district ?? '',
            country: row.address_country ?? '',
            region: row.address_region ?? '',
            lat: Number(row.address_lat),
            lng: Number(row.address_lng),
          }
        : null,
      type: row.type_id
        ? {
            id: Number(row.type_id),
            name: row.type_name ?? '',
            code: row.type_code ?? '',
          }
        : null,
      thumbnailMedia: row.media_id
        ? {
            id: Number(row.media_id),
            type: row.media_type ?? '',
            url: row.media_url ?? '',
            displayOrder: Number(row.media_displayOrder),
          }
        : null,
    };
  }

  private mapRowToDetailResponse(
    row: LocationRawRow,
    media: LocationMediaResponseDto[],
    services: LocationServiceResponseDto[],
  ): LocationDetailResponseDto {
    const location = this.mapRowToResponse(row);

    return {
      id: location.id,
      name: location.name,
      description: location.description,
      price: location.price,
      priceUnit: location.priceUnit,
      area: location.area,
      averageRating: location.averageRating,
      createdAt: location.createdAt,
      address: location.address ?? null,
      type: location.type,
      media,
      services,
      owner: this.mapOwnerResponse(row),
    };
  }

  private mapOwnerResponse(
    row: LocationRawRow,
  ): LocationOwnerResponseDto | null {
    if (!row.location_ownerId) {
      return null;
    }

    return {
      id: Number(row.location_ownerId),
      fullName: row.owner_fullName,
      phone: row.owner_phone,
    };
  }

  private async findMediaByLocationId(
    locationId: number,
  ): Promise<LocationMediaResponseDto[]> {
    const rows = await this.locationMedia
      .createQueryBuilder('media')
      .select([
        'media.id AS id',
        'media.type AS type',
        'media.url AS url',
        'media.displayOrder AS displayOrder',
      ])
      .where('media.locationId = :locationId', { locationId })
      .orderBy('media.displayOrder', 'ASC')
      .addOrderBy('media.id', 'ASC')
      .getRawMany<LocationMediaResponseDto>();

    return rows.map((media) => ({
      id: Number(media.id),
      type: media.type,
      url: media.url,
      displayOrder: Number(media.displayOrder),
    }));
  }

  private async findServicesByLocationId(
    locationId: number,
  ): Promise<LocationServiceResponseDto[]> {
    const rows = await this.locationService
      .createQueryBuilder('locationService')
      .innerJoin(
        'tb_service',
        'service',
        'service.id = locationService.serviceId',
      )
      .select([
        'service.id AS id',
        'service.name AS name',
        'locationService.isFree AS isFree',
        'locationService.price AS price',
        'locationService.priceUnit AS priceUnit',
        'locationService.isActive AS isActive',
      ])
      .where('locationService.locationId = :locationId', { locationId })
      .orderBy('locationService.isFree', 'DESC')
      .addOrderBy('service.id', 'ASC')
      .getRawMany<LocationServiceRawRow>();

    return rows.map((service) => ({
      id: Number(service.id),
      name: service.name,
      isFree: Boolean(service.isFree),
      price: service.price === null ? undefined : Number(service.price),
      priceUnit: service.priceUnit ?? undefined,
      isActive: Boolean(service.isActive),
    }));
  }

  public async findLocationTypes(): Promise<any> {
    const types = await this.dataSource.getRepository(TBLocationType).find({
      order: { id: 'ASC' },
    });

    return types.map((type) => ({
      id: type.id,
      name: type.name,
      code: type.code,
    }));
  }

  public async findRelatedLocations(
    locationId: number,
  ): Promise<GetLocationsResponseDto> {
    const sourceLocation = await this.location
      .createQueryBuilder('location')
      .leftJoin(
        'tb_location_address',
        'address',
        'address.id = location.locationAddressId',
      )
      .select([
        'location.locationTypeId AS location_locationTypeId',
        'address.province AS address_province',
        'address.district AS address_district',
      ])
      .where('location.id = :locationId', { locationId })
      .getRawOne<RelatedLocationSourceRawRow>();

    if (!sourceLocation) {
      return this.buildEmptyRelatedLocationsResponse();
    }

    // Related locations must share district or province with the source.
    // Location type only decides priority inside that area-matched result set.
    const sameDistrictPriority =
      'CASE WHEN address.district = :sourceDistrict THEN 1 ELSE 0 END';
    const sameProvincePriority =
      'CASE WHEN address.province = :sourceProvince THEN 1 ELSE 0 END';
    const sameTypePriority =
      'CASE WHEN location.locationTypeId = :sourceLocationTypeId THEN 1 ELSE 0 END';

    const rows = await this.location
      .createQueryBuilder('location')
      .leftJoin('tb_user_default', 'user', 'user.id = location.ownerId')
      .leftJoin('tb_user_profile', 'profile', 'profile.id = user.userProfileId')
      .leftJoin(
        'tb_location_address',
        'address',
        'address.id = location.locationAddressId',
      )
      .leftJoin('tb_location_type', 'type', 'type.id = location.locationTypeId')
      .leftJoin(
        'tb_location_media',
        'media',
        `media.id = (
          SELECT thumbnail.id
          FROM tb_location_media thumbnail
          WHERE thumbnail.locationId = location.id
          ORDER BY thumbnail.displayOrder ASC, thumbnail.id ASC
          LIMIT 1
        )`,
      )
      .select([
        'location.id AS location_id',
        'location.name AS location_name',
        'location.description AS location_description',
        'location.ownerId AS location_ownerId',
        'location.price AS location_price',
        'location.priceUnit AS location_priceUnit',
        'location.area AS location_area',
        'location.averageRating AS location_averageRating',
        'location.createdAt AS location_createdAt',
        'profile.phoneNumber AS owner_phone',
        'profile.fullName AS owner_fullName',
        'address.id AS address_id',
        'address.fullAddress AS address_fullAddress',
        'address.province AS address_province',
        'address.district AS address_district',
        'address.country AS address_country',
        'address.region AS address_region',
        'address.lat AS address_lat',
        'address.lng AS address_lng',
        'type.id AS type_id',
        'type.name AS type_name',
        'type.code AS type_code',
        'media.id AS media_id',
        'media.type AS media_type',
        'media.url AS media_url',
        'media.displayOrder AS media_displayOrder',
        `${sameDistrictPriority} AS sameDistrictPriority`,
        `${sameProvincePriority} AS sameProvincePriority`,
        `${sameTypePriority} AS sameTypePriority`,
      ])
      .where('location.id != :locationId', { locationId })
      // Only keep rooms in the same district or province as the source.
      .andWhere(
        new Brackets((qb) => {
          qb.where('address.district = :sourceDistrict').orWhere(
            'address.province = :sourceProvince',
          );
        }),
      )
      .orderBy('sameDistrictPriority', 'DESC')
      .addOrderBy('sameProvincePriority', 'DESC')
      .addOrderBy('sameTypePriority', 'DESC')
      .addOrderBy('location.averageRating', 'DESC')
      .addOrderBy('location.createdAt', 'DESC')
      .addOrderBy('location.id', 'ASC')
      .limit(RELATED_LOCATIONS_LIMIT)
      .setParameters({
        sourceDistrict: sourceLocation.address_district,
        sourceProvince: sourceLocation.address_province,
        sourceLocationTypeId: sourceLocation.location_locationTypeId,
      })
      .getRawMany<LocationRawRow>();

    return {
      data: rows.map((row) => this.mapRowToResponse(row)),
      meta: {
        page: 1,
        limit: RELATED_LOCATIONS_LIMIT,
        total: rows.length,
        totalPages: rows.length > 0 ? 1 : 0,
      },
    };
  }

  private buildEmptyRelatedLocationsResponse(): GetLocationsResponseDto {
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
}
