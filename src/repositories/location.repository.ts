import { CreateLocationRepositoryDto } from '@/dtos/location/createLocation.dto';
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
    return await this.dataSource
      .getRepository(TBLocationType)
      .exists({ where: { id: locationTypeId } });
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
      .leftJoin('tb_service', 's', 's.id = ls.serviceId') // Dùng leftJoin thay vì leftJoinAndSelect
      .select([
        'ls.isFree AS isFree',
        'ls.price AS price',
        'ls.priceUnit AS priceUnit',
        'ls.isActive AS isActive',
        's.name AS name',
      ])
      .where('ls.locationId = :locationId', { locationId })
      .andWhere('ls.isActive = 1') // Chỉ lấy các dịch vụ đang hoạt động
      .addOrderBy('CASE WHEN ls.isFree = 1 THEN 1 ELSE 2 END', 'ASC')
      .addOrderBy('ls.price', 'ASC')
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
      .select([
        'user.id as id',
        'profile.phoneNumber as phoneNumber',
        'profile.fullName as fullName',
      ])
      .where('user.id = :ownerId', { ownerId: id })
      .getRawOne();

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
    userId?: number,
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

    if (userId !== undefined) {
      query.leftJoin(
        'tb_location_favourite',
        'favourite',
        // Khớp cả locationId và userId ngay khi JOIN
        'favourite.locationId = location.id AND favourite.userId = :userId',
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
    const query = await this.baseQueryBuilder(filter, ownerId, userId);
    const total = await query.getCount();

    if (total === 0)
      return this.buildEmptyLocationsResponse(filter.page, filter.limit);

    // Lay id cac phong
    const baseLocation = await query
      .select([
        'location.id as id',
        'location.name as name',
        'location.description as description',
        'location.price as price',
        'location.priceUnit as priceUnit',
        'location.area as area',
        'location.createdAt as createdAt',
        'location.maxGuestCount as maxGuestCount',
        'location.averageRating as averageRating',
        'type.id as typeId',
        'type.name as typeName',
        'type.code as typeCode',
        'address.id as addressId',
        'address.fullAddress as fullAddress',
        'address.lat as lat',
        'address.lng as lng',
        userId !== undefined
          ? 'IF(favourite.locationId IS NOT NULL, 1, 0) as isFavourite'
          : '0 as isFavourite',
      ])
      .orderBy(filter?.sortBy || 'location.id', filter?.sortOrder)
      .offset((filter.page - 1) * filter.limit) // Phân trang
      .limit(filter.limit)
      .getRawMany();

    const locationIds = baseLocation.map((item) => item.id);

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
        isFavourite: Boolean(Number(location.isFavourite)),
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
    userId?: number,
  ): Promise<GetLocationDetailResponseDto | null> {
    const baseLocation = await this.location.findOne({
      where: { id },
    });
    if (!baseLocation) {
      return null;
    }

    const owner = await this.getLocationOwner(baseLocation.ownerId);
    let isFavourite = false;
    if (userId !== undefined) {
      const favourite = await this.locationFavourite.findOne({
        where: { locationId: id, userId },
      });
      isFavourite = favourite !== null;
    }
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
      isFavourite: isFavourite,
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
    const sourceLocation = await this.location
      .createQueryBuilder('location')
      .innerJoin(
        'tb_location_address',
        'address',
        'address.id = location.locationAddressId',
      )
      .select([
        'location.locationTypeId AS locationTypeId',
        'address.province AS province',
        'address.district AS district',
      ])
      .where('location.id = :locationId', { locationId })
      .getRawOne();

    if (!sourceLocation) {
      return this.buildEmptyLocationsResponse(1, 10); // Trả về response rỗng nếu không tìm thấy location nguồn
    }

    const relatedLocations = await this.location
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
      .leftJoin(
        'tb_location_favourite',
        'favourite',
        'favourite.locationId = location.id AND favourite.userId = :userId',
        { userId },
      )
      .select([
        'location.id as id',
        'location.name as name',
        'location.description as description',
        'location.price as price',
        'location.priceUnit as priceUnit',
        'location.area as area',
        'location.createdAt as createdAt',
        'location.maxGuestCount as maxGuestCount',
        'location.averageRating as averageRating',
        'type.id as typeId',
        'type.name as typeName',
        'type.code as typeCode',
        'address.id as addressId',
        'address.fullAddress as fullAddress',
        'address.lat as lat',
        'address.lng as lng',
        userId !== undefined
          ? 'IF(favourite.locationId IS NOT NULL, 1, 0) as isFavourite'
          : '0 as isFavourite',
      ])
      .where('location.id != :locationId', { locationId })
      .andWhere('location.locationTypeId = :sourceLocationTypeId', {
        sourceLocationTypeId: sourceLocation.locationTypeId,
      })
      .andWhere(
        new Brackets((qb) => {
          qb.where('address.district = :sourceDistrict', {
            sourceDistrict: sourceLocation.district,
          }).orWhere('address.province = :sourceProvince', {
            sourceProvince: sourceLocation.province,
          });
        }),
      )
      .addOrderBy('location.averageRating', 'DESC')
      .addOrderBy('location.createdAt', 'DESC')
      .addOrderBy('location.id', 'ASC')
      .limit(3)
      .getRawMany();

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
        isFavourite: Boolean(Number(location.isFavourite)),
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
