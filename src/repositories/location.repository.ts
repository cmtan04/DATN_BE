import {
  GetLocationsFilter,
  GetLocationsResponseDto,
  LocationListItemResponseDto,
} from '@/dtos/location/getLocations.dto';
import { TBLocation } from '@/entities/location/location.entity';
import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Brackets, Repository, SelectQueryBuilder } from 'typeorm';

interface LocationRawRow {
  location_id: number;
  location_name: string;
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
}

@Injectable()
export class LocationRepository {
  @InjectRepository(TBLocation)
  private readonly location: Repository<TBLocation>;

  public async findLocations(
    filter: GetLocationsFilter,
  ): Promise<GetLocationsResponseDto> {
    const baseQuery = this.buildBaseQuery(filter);
    const total = await baseQuery.getCount();

    const rows = await baseQuery
      .select([
        'location.id AS location_id',
        'location.name AS location_name',
        'location.ownerId AS location_ownerId',
        'location.price AS location_price',
        'location.priceUnit AS location_priceUnit',
        'location.area AS location_area',
        'location.averageRating AS location_averageRating',
        'location.createdAt AS location_createdAt',
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

  private buildBaseQuery(
    filter: GetLocationsFilter,
  ): SelectQueryBuilder<TBLocation> {
    const query = this.location
      .createQueryBuilder('location')
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

    if (filter.keyword) {
      query.andWhere(
        new Brackets((qb) => {
          qb.where('location.name LIKE :keyword')
            .orWhere('address.fullAddress LIKE :keyword')
            .orWhere('address.province LIKE :keyword')
            .orWhere('address.district LIKE :keyword')
            .orWhere('address.region LIKE :keyword')
            .orWhere('address.country LIKE :keyword');
        }),
      );
      query.setParameter('keyword', `%${filter.keyword}%`);
    }

    return query;
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
      ownerId: Number(row.location_ownerId),
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
}
