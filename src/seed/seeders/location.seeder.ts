import { DataSource } from 'typeorm';
import * as fs from 'fs';
import * as path from 'path';
import { TBUserDefault } from '@/entities/user/user_default.entity';
import { TBLocationType } from '@/entities/location/location_type.entity';
import { TBLocationAddress } from '@/entities/location/location-address.entity';
import { TBLocation } from '@/entities/location/location.entity';
import { TBLocationMedia } from '@/entities/location/location_media.entity';
import { TBService } from '@/entities/service.entity';
import { TBLocationService } from '@/entities/location/location_service.entity';
import { UserRole } from '@/assets/enum/user.enum';

interface SeedAddressData {
  fullAddress: string;
  province: string;
  district: string;
  country: string;
  lat: number;
  lng: number;
  normalFullAddress: string;
}

interface SeedMediaData {
  type: string;
  url: string;
  displayOrder: number;
}

interface SeedLocationServiceData {
  serviceName: string;
  price?: number | null;
  priceUnit?: string | null;
  isFree: boolean;
  isActive: boolean;
}

interface SeedLocationData {
  name: string;
  description: string | null;
  price: number;
  priceUnit: string;
  area: number;
  maxGuestCount: number;
  quantity: number;
  averageRating: number;
  isActive: boolean;
  ownerEmail: string;
  typeCode: string;
  addr: SeedAddressData;
  media: SeedMediaData[];
  services: SeedLocationServiceData[];
}

const buildCleanedVietNameseString = (str: string): string => {
  return str
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/đ/gi, 'd')
    .replaceAll('-', ' ')
    .split(',')
    .map((part) => part.trim())
    .filter((part) => part.length > 0)
    .join(', ')
    .replace(/[^a-zA-Z0-9, ]/g, '')
    .replace(/\s+/g, ' ')
    .toLowerCase()
    .trim();
};

export class LocationSeeder {
  public static async run(dataSource: DataSource): Promise<void> {
    const userRepository = dataSource.getRepository(TBUserDefault);
    const locationTypeRepository = dataSource.getRepository(TBLocationType);
    const locationAddressRepository =
      dataSource.getRepository(TBLocationAddress);
    const locationRepository = dataSource.getRepository(TBLocation);
    const locationMediaRepository = dataSource.getRepository(TBLocationMedia);
    const serviceRepository = dataSource.getRepository(TBService);
    const locationServiceRepository =
      dataSource.getRepository(TBLocationService);

    const locationsPath = path.join(__dirname, '..', 'data', 'locations.json');
    const locationsData = JSON.parse(
      fs.readFileSync(locationsPath, 'utf8'),
    ) as unknown as SeedLocationData[];

    // 1. Lấy tất cả hosts (Owner) và Users để map email -> id
    const allUsers = await userRepository.find();
    const userEmailMap = new Map<string, number>();
    const hostList: TBUserDefault[] = [];

    for (const u of allUsers) {
      userEmailMap.set(u.email, u.id);
      if (Number(u.userRole) === Number(UserRole.OWNER)) {
        hostList.push(u);
      }
    }

    if (hostList.length === 0 && allUsers.length > 0) {
      hostList.push(allUsers[0]);
    }

    // 2. Map location types code -> id
    const allTypes = await locationTypeRepository.find();
    const typeCodeMap = new Map<string, number>();
    for (const t of allTypes) {
      typeCodeMap.set(t.code, t.id);
    }

    // 3. Map services name -> id
    const allServices = await serviceRepository.find();
    const serviceNameMap = new Map<string, number>();
    for (const s of allServices) {
      serviceNameMap.set(s.name, s.id);
    }

    let seededLocationsCount = 0;
    let seededMediaCount = 0;
    let seededServicesCount = 0;

    for (let i = 0; i < locationsData.length; i++) {
      const data = locationsData[i];

      // Xác định ownerId
      let ownerId = userEmailMap.get(data.ownerEmail);
      if (!ownerId) {
        const fallbackHost = hostList[i % hostList.length];
        ownerId = fallbackHost?.id ?? 1;
      }

      // Xác định locationTypeId
      const locationTypeId = typeCodeMap.get(data.typeCode) ?? null;

      // Chuẩn hóa địa chỉ
      const computedNormalAddress =
        data.addr.normalFullAddress ||
        buildCleanedVietNameseString(data.addr.fullAddress);

      // Lưu/Cập nhật Address
      let addr = await locationAddressRepository.findOne({
        where: { normalFullAddress: computedNormalAddress },
      });

      addr = await locationAddressRepository.save(
        locationAddressRepository.create({
          ...(addr ?? {}),
          fullAddress: data.addr.fullAddress,
          province: data.addr.province,
          district: data.addr.district,
          country: data.addr.country,
          lat: data.addr.lat,
          lng: data.addr.lng,
          normalFullAddress: computedNormalAddress,
        }),
      );

      // Lưu/Cập nhật Location
      let location = await locationRepository.findOne({
        where: { name: data.name },
      });

      location = await locationRepository.save(
        locationRepository.create({
          ...(location ?? {}),
          name: data.name,
          description: data.description,
          price: data.price,
          priceUnit: data.priceUnit,
          area: data.area,
          maxGuestCount: data.maxGuestCount,
          quantity: data.quantity,
          averageRating: data.averageRating,
          isActive: data.isActive,
          ownerId,
          locationAddressId: addr.id,
          locationTypeId: locationTypeId ?? undefined,
        }),
      );

      // Lưu Media
      if (data.media && data.media.length > 0) {
        for (const m of data.media) {
          const media = await locationMediaRepository.findOne({
            where: {
              locationId: location.id,
              displayOrder: m.displayOrder,
            },
          });

          if (!media) {
            await locationMediaRepository.save(
              locationMediaRepository.create({
                locationId: location.id,
                type: m.type,
                url: m.url,
                displayOrder: m.displayOrder,
              }),
            );
            seededMediaCount++;
          } else if (media.url !== m.url) {
            media.url = m.url;
            media.type = m.type;
            await locationMediaRepository.save(media);
          }
        }
      }

      // Lưu Location Services
      if (data.services && data.services.length > 0) {
        for (const s of data.services) {
          const serviceId = serviceNameMap.get(s.serviceName);
          if (serviceId) {
            const existingLocService = await locationServiceRepository.findOne({
              where: {
                locationId: location.id,
                serviceId,
              },
            });

            if (!existingLocService) {
              await locationServiceRepository.save(
                locationServiceRepository.create({
                  locationId: location.id,
                  serviceId,
                  price: s.price ?? undefined,
                  priceUnit: s.priceUnit ?? undefined,
                  isFree: s.isFree,
                  isActive: s.isActive,
                }),
              );
              seededServicesCount++;
            }
          }
        }
      }

      seededLocationsCount++;
    }

    console.log(
      `✓ Seeded ${seededLocationsCount} locations, ${seededMediaCount} media items, and ${seededServicesCount} location services.`,
    );
  }
}
