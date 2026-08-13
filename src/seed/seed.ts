import dataSource from '../data-source';
import { DeepPartial } from 'typeorm';
import { TBUserDefault } from '@/entities/user/user_default.entity';
import { TBLocationType } from '@/entities/location/location_type.entity';
import { TBLocationAddress } from '@/entities/location/location-address.entity';
import { TBLocation } from '@/entities/location/location.entity';
import { TBLocationMedia } from '@/entities/location/location_media.entity';
import { TBService } from '@/entities/service.entity';
import { TBLocationService } from '@/entities/location/location_service.entity';
import { UserRole } from '@/assets/enum/user.enum';
import * as fs from 'fs';
import * as path from 'path';

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

async function seed() {
  try {
    await dataSource.initialize();
    console.log('Database connection initialized for seeding.');

    const userRepository = dataSource.getRepository(TBUserDefault);
    const locationTypeRepository = dataSource.getRepository(TBLocationType);
    const locationAddressRepository =
      dataSource.getRepository(TBLocationAddress);
    const locationRepository = dataSource.getRepository(TBLocation);
    const locationMediaRepository = dataSource.getRepository(TBLocationMedia);
    const serviceRepository = dataSource.getRepository(TBService);
    const locationServiceRepository =
      dataSource.getRepository(TBLocationService);

    const locationsPath = path.join(__dirname, 'data', 'locations.json');
    const servicesPath = path.join(__dirname, 'data', 'services.json');
    const rawData: {
      typeCode: string;
      mediaUrls?: string[];
      loc: DeepPartial<TBLocation>;
      addr: DeepPartial<TBLocationAddress>;
    }[] = JSON.parse(fs.readFileSync(locationsPath, 'utf8'));
    const servicesData: DeepPartial<TBService>[] = JSON.parse(
      fs.readFileSync(servicesPath, 'utf8'),
    );

    // 1. Lấy Host (OWNER) từ DB
    const hosts = await userRepository.find({
      where: { userRole: UserRole.OWNER },
    });

    if (hosts.length === 0) {
      console.warn(
        '⚠️ Không tìm thấy user với role OWNER trong DB! Vui lòng tạo tài khoản OWNER trước.',
      );
      return;
    }

    // 2. Lấy các loại địa điểm (LocationType) từ DB
    const dbLocationTypes = await locationTypeRepository.find();
    if (dbLocationTypes.length === 0) {
      console.warn(
        '⚠️ Không tìm thấy LocationType trong DB! Vui lòng seed hoặc tạo LocationType trước.',
      );
      return;
    }
    const typeMap: Record<string, number> = {};
    for (const t of dbLocationTypes) {
      typeMap[t.code] = t.id;
    }

    // Seed Services
    const savedServices: TBService[] = [];
    for (const svc of servicesData) {
      let service = await serviceRepository.findOne({
        where: { name: svc.name },
      });
      if (!service) {
        service = await serviceRepository.save(serviceRepository.create(svc));
      }
      savedServices.push(service);
    }
    console.log(`Seeded ${savedServices.length} services.`);

    // 3. Seed Locations
    let seededLocationsCount = 0;
    for (let i = 0; i < rawData.length; i++) {
      const data = rawData[i];
      const hostIndex = i % hosts.length; // Luân phiên sử dụng các host
      const host = hosts[hostIndex];

      const typeId = typeMap[data.typeCode];
      if (!typeId) {
        console.warn(`Bỏ qua seed do không tìm thấy Type: ${data.typeCode}`);
        continue;
      }

      const computedNormalFullAddress = buildCleanedVietNameseString(
        data.addr.fullAddress!,
      );

      // Lưu Address
      let addr = await locationAddressRepository.findOne({
        where: { normalFullAddress: computedNormalFullAddress },
      });
      addr = await locationAddressRepository.save(
        locationAddressRepository.create({
          ...(addr ?? {}),
          ...data.addr,
          normalFullAddress: computedNormalFullAddress,
        }),
      );

      // Lưu Location
      let location = await locationRepository.findOne({
        where: { name: data.loc.name },
      });
      location = await locationRepository.save(
        locationRepository.create({
          ...(location ?? {}),
          ...data.loc,
          ownerId: host.id,
          locationAddressId: addr.id,
          locationTypeId: typeId,
          isActive: true,
        }),
      );

      // Seed Media
      if (data.mediaUrls && data.mediaUrls.length > 0) {
        for (let j = 0; j < data.mediaUrls.length; j++) {
          const displayOrder = j + 1;
          const media = await locationMediaRepository.findOne({
            where: { locationId: location.id, displayOrder },
          });
          if (!media) {
            await locationMediaRepository.save(
              locationMediaRepository.create({
                locationId: location.id,
                type: 'IMAGE',
                url: data.mediaUrls[j],
                displayOrder,
              }),
            );
          }
        }
      } else {
        for (let j = 1; j <= 3; j++) {
          const media = await locationMediaRepository.findOne({
            where: { locationId: location.id, displayOrder: j },
          });
          if (!media) {
            await locationMediaRepository.save(
              locationMediaRepository.create({
                locationId: location.id,
                type: 'IMAGE',
                url: `https://picsum.photos/seed/loc${location.id}_${j}/800/600`,
                displayOrder: j,
              }),
            );
          }
        }
      }

      // Seed Location Services
      const numServices = Math.floor(Math.random() * 3) + 3; // 3 to 5
      const shuffledServices = [...savedServices].sort(
        () => 0.5 - Math.random(),
      );
      const selectedServices = shuffledServices.slice(0, numServices);

      for (const svc of selectedServices) {
        const locSvc = await locationServiceRepository.findOne({
          where: { locationId: location.id, serviceId: svc.id },
        });
        if (!locSvc) {
          await locationServiceRepository.save(
            locationServiceRepository.create({
              locationId: location.id,
              serviceId: svc.id,
              isFree: true,
              isActive: true,
            }),
          );
        }
      }

      seededLocationsCount++;
    }

    console.log(
      `Seeding completed successfully. Seeded ${seededLocationsCount} locations.`,
    );
  } catch (error) {
    console.error('Error during seeding:', error);
  } finally {
    if (dataSource.isInitialized) {
      await dataSource.destroy();
      console.log('Database connection closed.');
    }
  }
}

seed();
