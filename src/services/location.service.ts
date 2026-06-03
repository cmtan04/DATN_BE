import {
  BadRequestException,
  ForbiddenException,
  Injectable,
} from '@nestjs/common';
import { existsSync, mkdirSync, unlinkSync, writeFileSync } from 'fs';
import { extname, join } from 'path';
import {
  CreateLocationMediaInput,
  CreateLocationPayloadInput,
  CreateLocationRequestDto,
  CreateLocationServiceRequestDto,
  CreateLocationResponseDto,
  CreateServiceRequestDto,
  LocationUploadFile,
  ServiceResponseDto,
} from '@/dtos/location/createLocation.dto';
import {
  GetLocationsFilter,
  GetLocationsQueryDto,
  GetLocationsResponseDto,
  LocationDetailResponseDto,
  LocationSortBy,
  LocationSortOrder,
} from '@/dtos/location/getLocations.dto';
import { UserRole } from '@assets/enum/user.enum';
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

const MAX_IMAGE_COUNT = 8;
const MAX_IMAGE_SIZE = 5 * 1024 * 1024;
const ALLOWED_IMAGE_MIME_TYPES = ['image/jpeg', 'image/png', 'image/webp'];
const UPLOADS_DIR = join(process.cwd(), 'uploads', 'locations');
const PUBLIC_UPLOADS_PREFIX = '/uploads/locations';
const CLOUDINARY_LOCATION_FOLDER = 'locations';

@Injectable()
export class LocationService {
  constructor(private readonly locationRepository: LocationRepository) {}

  public async getServices(): Promise<ServiceResponseDto[]> {
    return await this.locationRepository.findAllServices();
  }

  public async createService(
    payload: CreateServiceRequestDto,
  ): Promise<ServiceResponseDto> {
    const name = this.readRequiredString(payload.name, 'service name', 255);

    return await this.locationRepository.findOrCreateServiceByName(name);
  }

  public async getOwnerLocations(
    ownerId: number,
  ): Promise<GetLocationsResponseDto> {
    return await this.locationRepository.findLocations({
      page: 1,
      limit: MAX_LIMIT,
      ownerId,
      sortBy: DEFAULT_SORT_BY,
      sortOrder: DEFAULT_SORT_ORDER,
    });
  }

  public async createLocation(
    ownerId: number,
    userRole: UserRole,
    rawPayload: CreateLocationPayloadInput,
    images: LocationUploadFile[] = [],
  ): Promise<CreateLocationResponseDto> {
    if (userRole !== UserRole.OWNER) {
      throw new ForbiddenException('Only owners can create rooms');
    }

    const payload = await this.normalizeCreateLocationPayload(rawPayload);
    const media =
      images.length > 0
        ? this.prepareImageMedia(images)
        : this.normalizeDirectLocationMedia(payload.media);
    const savedFiles: string[] = [];

    try {
      if (images.length > 0) {
        this.ensureUploadsDirectory();
        images.forEach((image, index) => {
          const filePath = join(
            UPLOADS_DIR,
            media[index].url.split('/').pop() ?? '',
          );
          writeFileSync(filePath, image.buffer);
          savedFiles.push(filePath);
        });
      }

      return await this.locationRepository.createLocation({
        ...payload,
        ownerId,
        media,
      });
    } catch (error) {
      this.cleanupSavedFiles(savedFiles);
      throw error;
    }
  }

  public async getLocations(
    query: GetLocationsQueryDto,
  ): Promise<GetLocationsResponseDto> {
    return await this.locationRepository.findLocations(
      this.normalizeQuery(query),
    );
  }

  private normalizeQuery(query: GetLocationsQueryDto): GetLocationsFilter {
    const page = query.page && query.page > 0 ? query.page : DEFAULT_PAGE;
    const parsedLimit = query.limit ?? DEFAULT_LIMIT;
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
      minPrice: query.minPrice ?? undefined,
      maxPrice: query.maxPrice ?? undefined,
      minArea: query.minArea ?? undefined,
      maxArea: query.maxArea ?? undefined,
      locationTypeId: query.locationTypeId ?? undefined,
      addressRegion: query.addressRegion?.trim() || undefined,
      keyword: query.keyword?.trim() || undefined,
      sortBy,
      sortOrder: sortOrder as LocationSortOrder,
      lat: query.lat ?? undefined,
      lng: query.lng ?? undefined,
      radiusKm: query.radiusKm ?? undefined,
    };

    this.validateRange(filter.minPrice, filter.maxPrice, 'price');
    this.validateRange(filter.minArea, filter.maxArea, 'area');

    return filter;
  }

  private async normalizeCreateLocationPayload(
    rawPayload: CreateLocationPayloadInput,
  ): Promise<CreateLocationRequestDto> {
    const value = this.parseCreatePayload(rawPayload);
    const services = Array.isArray(value.services) ? value.services : [];
    const normalizedServices = services.map((service, index) =>
      this.normalizeLocationService(service, index),
    );
    const uniqueServiceIds = Array.from(
      new Set(normalizedServices.map((service) => service.serviceId)),
    );

    if (uniqueServiceIds.length !== normalizedServices.length) {
      throw new BadRequestException('Duplicate serviceId is not allowed');
    }

    const locationTypeId = this.readPositiveInteger(
      value.locationTypeId,
      'locationTypeId',
    );
    const address = this.readObject(value.address, 'address');
    const locationTypeExists =
      await this.locationRepository.locationTypeExists(locationTypeId);

    if (!locationTypeExists) {
      throw new BadRequestException('locationTypeId does not exist');
    }

    const existedServiceIds =
      await this.locationRepository.findExistingServiceIds(uniqueServiceIds);
    const missingServiceIds = uniqueServiceIds.filter(
      (serviceId) => !existedServiceIds.includes(serviceId),
    );

    if (missingServiceIds.length > 0) {
      throw new BadRequestException(
        `serviceId does not exist: ${missingServiceIds.join(', ')}`,
      );
    }

    return {
      name: this.readRequiredString(value.name, 'name', 255),
      description: this.readOptionalString(value.description, 2000),
      price: this.readPositiveInteger(value.price, 'price'),
      priceUnit: this.readRequiredString(value.priceUnit, 'priceUnit', 50),
      area: this.readPositiveInteger(value.area, 'area'),
      quantity: this.readPositiveInteger(value.quantity, 'quantity'),
      locationTypeId,
      address: {
        fullAddress: this.readRequiredString(
          address.fullAddress,
          'fullAddress',
          255,
        ),
        province: this.readRequiredString(address.province, 'province', 255),
        district: this.readRequiredString(address.district, 'district', 255),
        country: this.readRequiredString(address.country, 'country', 255),
        region: this.readRequiredString(address.region, 'region', 255),
        lat: this.readCoordinate(address.lat, 'lat', -90, 90),
        lng: this.readCoordinate(address.lng, 'lng', -180, 180),
      },
      services: normalizedServices,
      media: Array.isArray(value.media)
        ? this.normalizeDirectLocationMedia(value.media)
        : [],
    };
  }

  private parseCreatePayload(
    rawPayload: CreateLocationPayloadInput,
  ): Record<string, unknown> {
    if (!rawPayload) {
      throw new BadRequestException('Missing room payload');
    }

    if (typeof rawPayload === 'object' && !Array.isArray(rawPayload)) {
      const payloadObject = rawPayload as Record<string, unknown>;

      if (typeof payloadObject.payload === 'string') {
        return this.parseCreatePayloadString(payloadObject.payload);
      }

      return payloadObject;
    }

    if (typeof rawPayload !== 'string') {
      throw new BadRequestException('Invalid room payload');
    }

    return this.parseCreatePayloadString(rawPayload);
  }

  private parseCreatePayloadString(rawPayload: string): Record<string, unknown> {
    try {
      const parsed = JSON.parse(rawPayload) as unknown;

      if (!parsed || typeof parsed !== 'object' || Array.isArray(parsed)) {
        throw new BadRequestException('Invalid room payload');
      }

      return parsed as Record<string, unknown>;
    } catch {
      throw new BadRequestException('Invalid room payload JSON');
    }
  }

  private normalizeLocationService(
    value: unknown,
    index: number,
  ): CreateLocationServiceRequestDto {
    const service = this.readObject(value, `services[${index}]`);
    const serviceId = this.readPositiveInteger(
      service.serviceId,
      `services[${index}].serviceId`,
    );
    const isFree = service.isFree !== false;
    const price = isFree
      ? undefined
      : this.readPositiveInteger(service.price, `services[${index}].price`);

    return {
      serviceId,
      isFree,
      price,
      priceUnit: this.readOptionalString(service.priceUnit, 50),
      isActive: service.isActive !== false,
    };
  }

  private prepareImageMedia(images: LocationUploadFile[] = []) {
    if (images.length === 0) {
      throw new BadRequestException('At least one image is required');
    }

    if (images.length > MAX_IMAGE_COUNT) {
      throw new BadRequestException(`Upload at most ${MAX_IMAGE_COUNT} images`);
    }

    return images.map((image, index) => {
      if (!ALLOWED_IMAGE_MIME_TYPES.includes(image.mimetype)) {
        throw new BadRequestException(
          'Only JPEG, PNG, and WebP images are allowed',
        );
      }

      if (image.size > MAX_IMAGE_SIZE) {
        throw new BadRequestException('Each image must be 5MB or smaller');
      }

      const extension = this.getSafeImageExtension(image);
      const fileName = `${Date.now()}-${index}-${Math.round(
        Math.random() * 1_000_000_000,
      )}${extension}`;

      return {
        type: 'image',
        url: `${PUBLIC_UPLOADS_PREFIX}/${fileName}`,
        displayOrder: index + 1,
      };
    });
  }

  private normalizeDirectLocationMedia(
    media: unknown,
  ): CreateLocationMediaInput[] {
    if (!Array.isArray(media) || media.length === 0) {
      throw new BadRequestException('At least one image is required');
    }

    if (media.length > MAX_IMAGE_COUNT) {
      throw new BadRequestException(`Upload at most ${MAX_IMAGE_COUNT} images`);
    }

    const usedDisplayOrders = new Set<number>();

    return media.map((item, index) => {
      const mediaItem = this.readObject(item, `media[${index}]`);
      const type = this.readRequiredString(
        mediaItem.type,
        `media[${index}].type`,
        50,
      );

      if (type !== 'image') {
        throw new BadRequestException('Location media only supports images');
      }

      const url = this.readRequiredString(
        mediaItem.url,
        `media[${index}].url`,
        500,
      );
      const displayOrder =
        mediaItem.displayOrder === undefined
          ? index + 1
          : this.readPositiveInteger(
              mediaItem.displayOrder,
              `media[${index}].displayOrder`,
            );

      if (usedDisplayOrders.has(displayOrder)) {
        throw new BadRequestException(
          'Duplicate media displayOrder is not allowed',
        );
      }

      usedDisplayOrders.add(displayOrder);
      this.validateCloudinaryLocationImageUrl(url, `media[${index}].url`);

      return {
        type,
        url,
        displayOrder,
      };
    });
  }

  private validateCloudinaryLocationImageUrl(
    url: string,
    fieldName: string,
  ): void {
    const cloudName = process.env.CLOUDINARY_CLOUD_NAME;

    if (!cloudName) {
      throw new BadRequestException('CLOUDINARY_CLOUD_NAME is not configured');
    }

    let parsedUrl: URL;

    try {
      parsedUrl = new URL(url);
    } catch {
      throw new BadRequestException(`${fieldName} must be a valid URL`);
    }

    if (
      parsedUrl.protocol !== 'https:' ||
      parsedUrl.hostname !== 'res.cloudinary.com'
    ) {
      throw new BadRequestException(
        `${fieldName} must be a Cloudinary secure URL`,
      );
    }

    const segments = parsedUrl.pathname.split('/').filter(Boolean);
    const uploadIndex = segments.indexOf('upload');

    if (
      segments[0] !== cloudName ||
      segments[1] !== 'image' ||
      uploadIndex < 0
    ) {
      throw new BadRequestException(`${fieldName} must be a Cloudinary image URL`);
    }

    const publicIdSegments = segments.slice(uploadIndex + 1);
    const firstPublicIdSegment =
      publicIdSegments[0] && /^v\d+$/.test(publicIdSegments[0])
        ? publicIdSegments[1]
        : publicIdSegments[0];

    if (firstPublicIdSegment !== CLOUDINARY_LOCATION_FOLDER) {
      throw new BadRequestException(
        `${fieldName} must be in the locations folder`,
      );
    }
  }

  private getSafeImageExtension(image: LocationUploadFile): string {
    const fallbackByMimeType: Record<string, string> = {
      'image/jpeg': '.jpg',
      'image/png': '.png',
      'image/webp': '.webp',
    };
    const extension = extname(image.originalname).toLowerCase();

    return ['.jpg', '.jpeg', '.png', '.webp'].includes(extension)
      ? extension
      : fallbackByMimeType[image.mimetype];
  }

  private ensureUploadsDirectory(): void {
    if (!existsSync(UPLOADS_DIR)) {
      mkdirSync(UPLOADS_DIR, { recursive: true });
    }
  }

  private cleanupSavedFiles(filePaths: string[]): void {
    filePaths.forEach((filePath) => {
      try {
        unlinkSync(filePath);
      } catch {
        // Best-effort cleanup; original error should stay visible to caller.
      }
    });
  }

  private readObject(
    value: unknown,
    fieldName: string,
  ): Record<string, unknown> {
    if (!value || typeof value !== 'object' || Array.isArray(value)) {
      throw new BadRequestException(`${fieldName} is required`);
    }

    return value as Record<string, unknown>;
  }

  private readRequiredString(
    value: unknown,
    fieldName: string,
    maxLength: number,
  ): string {
    if (typeof value !== 'string' || !value.trim()) {
      throw new BadRequestException(`${fieldName} is required`);
    }

    const trimmed = value.trim();

    if (trimmed.length > maxLength) {
      throw new BadRequestException(`${fieldName} is too long`);
    }

    return trimmed;
  }

  private readOptionalString(
    value: unknown,
    maxLength: number,
  ): string | undefined {
    if (value === undefined || value === null || value === '') {
      return undefined;
    }

    if (typeof value !== 'string') {
      throw new BadRequestException('Invalid optional text value');
    }

    const trimmed = value.trim();

    if (trimmed.length > maxLength) {
      throw new BadRequestException('Optional text value is too long');
    }

    return trimmed || undefined;
  }

  private readPositiveInteger(value: unknown, fieldName: string): number {
    const numberValue = Number(value);

    if (!Number.isInteger(numberValue) || numberValue <= 0) {
      throw new BadRequestException(`${fieldName} must be a positive integer`);
    }

    return numberValue;
  }

  private readCoordinate(
    value: unknown,
    fieldName: string,
    min: number,
    max: number,
  ): number {
    const numberValue = Number(value);

    if (
      !Number.isFinite(numberValue) ||
      numberValue < min ||
      numberValue > max
    ) {
      throw new BadRequestException(`${fieldName} is invalid`);
    }

    return numberValue;
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

  public async getLocationById(
    id: number,
  ): Promise<LocationDetailResponseDto> {
    if (id <= 0) {
      throw new BadRequestException('Invalid location ID');
    }
    return await this.locationRepository.findLocationDetailById(id);
  }

  public async getLocationTypes(): Promise<any> {
    return await this.locationRepository.findLocationTypes();
  }

  public async getRelatedLocations(
    id: number,
  ): Promise<GetLocationsResponseDto> {
    if (id <= 0) {
      throw new BadRequestException('Invalid location ID');
    }
    return await this.locationRepository.findRelatedLocations(id);
  }
}
