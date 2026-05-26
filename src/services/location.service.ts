import { BadRequestException, Injectable } from '@nestjs/common';
import {
  GetLocationsFilter,
  GetLocationsQueryDto,
  GetLocationsResponseDto,
  LocationSortBy,
  LocationSortOrder,
} from '@/dtos/location/getLocations.dto';
import { LocationRepository } from '@/repositories/location.repository';

const DEFAULT_PAGE = 1;
const DEFAULT_LIMIT = 10;
const MAX_LIMIT = 100;
const DEFAULT_SORT_BY: LocationSortBy = 'createdAt';
const DEFAULT_SORT_ORDER: LocationSortOrder = 'DESC';
const VALID_SORT_BY: LocationSortBy[] = [
  'price',
  'area',
  'rating',
  'createdAt',
];
const VALID_SORT_ORDER: LocationSortOrder[] = ['ASC', 'DESC'];

@Injectable()
export class LocationService {
  constructor(private readonly locationRepository: LocationRepository) {}

  public async getLocations(
    query: GetLocationsQueryDto,
  ): Promise<GetLocationsResponseDto> {
    return await this.locationRepository.findLocations(
      this.normalizeQuery(query),
    );
  }

  private normalizeQuery(query: GetLocationsQueryDto): GetLocationsFilter {
    const page = this.parsePositiveInteger(query.page, 'page') ?? DEFAULT_PAGE;
    const parsedLimit =
      this.parsePositiveInteger(query.limit, 'limit') ?? DEFAULT_LIMIT;
    const sortBy = query.sortBy ?? DEFAULT_SORT_BY;
    const sortOrder = query.sortOrder?.toUpperCase() ?? DEFAULT_SORT_ORDER;

    if (!VALID_SORT_BY.includes(sortBy)) {
      throw new BadRequestException('Invalid sortBy');
    }

    if (!VALID_SORT_ORDER.includes(sortOrder as LocationSortOrder)) {
      throw new BadRequestException('Invalid sortOrder');
    }

    const filter: GetLocationsFilter = {
      page,
      limit: Math.min(parsedLimit, MAX_LIMIT),
      minPrice: this.parseOptionalNumber(query.minPrice, 'minPrice'),
      maxPrice: this.parseOptionalNumber(query.maxPrice, 'maxPrice'),
      minArea: this.parseOptionalNumber(query.minArea, 'minArea'),
      maxArea: this.parseOptionalNumber(query.maxArea, 'maxArea'),
      locationTypeId: this.parseOptionalNumber(
        query.locationTypeId,
        'locationTypeId',
      ),
      keyword: query.keyword?.trim() || undefined,
      sortBy,
      sortOrder: sortOrder as LocationSortOrder,
    };

    this.validateRange(filter.minPrice, filter.maxPrice, 'price');
    this.validateRange(filter.minArea, filter.maxArea, 'area');

    return filter;
  }

  private parsePositiveInteger(
    value: string | undefined,
    fieldName: string,
  ): number | undefined {
    if (value === undefined) {
      return undefined;
    }

    const parsedValue = Number(value);
    if (!Number.isInteger(parsedValue) || parsedValue < 1) {
      throw new BadRequestException(`${fieldName} must be a positive integer`);
    }

    return parsedValue;
  }

  private parseOptionalNumber(
    value: string | undefined,
    fieldName: string,
  ): number | undefined {
    if (value === undefined) {
      return undefined;
    }

    const parsedValue = Number(value);
    if (!Number.isFinite(parsedValue)) {
      throw new BadRequestException(`${fieldName} must be a number`);
    }

    return parsedValue;
  }

  private validateRange(
    minValue: number | undefined,
    maxValue: number | undefined,
    fieldName: string,
  ): void {
    if (
      minValue !== undefined &&
      maxValue !== undefined &&
      minValue > maxValue
    ) {
      throw new BadRequestException(
        `min ${fieldName} must be <= max ${fieldName}`,
      );
    }
  }

  public async getLocationById(id: number): Promise<GetLocationsResponseDto> {
    if (id <= 0) {
      throw new BadRequestException('Invalid location ID');
    }
    const filter: GetLocationsFilter = {
      page: 1,
      limit: 1,
      locationTypeId: undefined,
      keyword: undefined,
      sortBy: DEFAULT_SORT_BY,
      sortOrder: DEFAULT_SORT_ORDER,
    };
    return await this.locationRepository.findLocations({
      ...filter,
      locationTypeId: id,
    });
  }
}
