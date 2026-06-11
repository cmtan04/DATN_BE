import * as bcrypt from 'bcrypt';
import { DataSource, Repository } from 'typeorm';
import { Seeder } from 'typeorm-extension';
import { UserRole, UserStatus } from '../assets/enum/user.enum';
import { TBLocationAddress } from '../entities/location/location-address.entity';
import { TBLocationMedia } from '../entities/location/location_media.entity';
import { TBLocationService } from '../entities/location/location_service.entity';
import { TBLocationType } from '../entities/location/location_type.entity';
import { TBLocation } from '../entities/location/location.entity';
import { TBService } from '../entities/service.entity';
import { TBUserDefault } from '../entities/user/user_default.entity';
import { TBUserProfile } from '../entities/user/user_profile.entity';

const SEED_PASSWORD = 'Password@123';
const BCRYPT_ROUNDS = 10;

interface SeedUser {
  email: string;
  role: UserRole;
  fullName: string;
  phoneNumber: string;
  avatarUrl?: string;
}

interface SeedLocation {
  name: string;
  typeCode: string;
  address: string;
  price: number;
  priceUnit: string;
  area: number;
  maxGuestCount: number;
  quantity: number;
  averageRating: number;
  mediaUrls: string[];
}

export default class TestDataSeeder implements Seeder {
  public async run(dataSource: DataSource): Promise<void> {
    const profileRepository = dataSource.getRepository(TBUserProfile);
    const userRepository = dataSource.getRepository(TBUserDefault);
    const typeRepository = dataSource.getRepository(TBLocationType);
    const addressRepository = dataSource.getRepository(TBLocationAddress);
    const locationRepository = dataSource.getRepository(TBLocation);
    const mediaRepository = dataSource.getRepository(TBLocationMedia);
    const locationServiceRepository =
      dataSource.getRepository(TBLocationService);
    const serviceRepository = dataSource.getRepository(TBService);

    const passwordHash = await bcrypt.hash(SEED_PASSWORD, BCRYPT_ROUNDS);
    const users = await this.seedUsers(
      userRepository,
      profileRepository,
      passwordHash,
    );
    const locationTypes = await this.seedLocationTypes(typeRepository);
    const addresses = await this.seedAddresses(addressRepository);

    await this.seedLocations(
      locationRepository,
      mediaRepository,
      users.owner.id,
      locationTypes,
      addresses,
    );
    await this.seedServices(serviceRepository, locationServiceRepository);
  }

  private async seedUsers(
    userRepository: Repository<TBUserDefault>,
    profileRepository: Repository<TBUserProfile>,
    passwordHash: string,
  ): Promise<Record<'admin' | 'owner' | 'user', TBUserDefault>> {
    const seedUsers: Record<'admin' | 'owner' | 'user', SeedUser> = {
      admin: {
        email: 'admin@test.com',
        role: UserRole.ADMIN,
        fullName: 'Admin Test',
        phoneNumber: '0900000001',
        avatarUrl: 'https://i.pravatar.cc/300?u=admin-test',
      },
      owner: {
        email: 'owner@test.com',
        role: UserRole.OWNER,
        fullName: 'Owner Test',
        phoneNumber: '0900000002',
        avatarUrl: 'https://i.pravatar.cc/300?u=owner-test',
      },
      user: {
        email: 'user@test.com',
        role: UserRole.USER,
        fullName: 'User Test',
        phoneNumber: '0900000003',
        avatarUrl: 'https://i.pravatar.cc/300?u=user-test',
      },
    };

    const result = {} as Record<'admin' | 'owner' | 'user', TBUserDefault>;

    for (const [key, seedUser] of Object.entries(seedUsers) as Array<
      ['admin' | 'owner' | 'user', SeedUser]
    >) {
      let user = await userRepository.findOne({
        where: { email: seedUser.email },
      });

      let profile = user?.userProfileId
        ? await profileRepository.findOne({ where: { id: user.userProfileId } })
        : null;

      profile = await profileRepository.save(
        profileRepository.create({
          ...(profile ?? {}),
          fullName: seedUser.fullName,
          phoneNumber: seedUser.phoneNumber,
          avatarUrl: seedUser.avatarUrl ?? null,
        }),
      );

      user = await userRepository.save(
        userRepository.create({
          ...(user ?? {}),
          email: seedUser.email,
          password: passwordHash,
          userRole: seedUser.role,
          status: UserStatus.ACTIVE,
          isEmailVerified: true,
          userProfileId: profile.id,
        }),
      );

      result[key] = user;
    }

    return result;
  }

  private async seedLocationTypes(
    typeRepository: Repository<TBLocationType>,
  ): Promise<Record<string, TBLocationType>> {
    const seedTypes = [
      { code: 'ROOM', name: 'Phong tro' },
      { code: 'APARTMENT', name: 'Can ho' },
      { code: 'HOUSE', name: 'Nha nguyen can' },
      { code: 'DORM', name: 'Ky tuc xa' },
    ];
    const result: Record<string, TBLocationType> = {};

    for (const seedType of seedTypes) {
      const existedType = await typeRepository.findOne({
        where: { code: seedType.code },
      });

      const locationType = await typeRepository.save(
        typeRepository.create({
          ...(existedType ?? {}),
          ...seedType,
        }),
      );

      result[seedType.code] = locationType;
    }

    return result;
  }

  private async seedAddresses(
    addressRepository: Repository<TBLocationAddress>,
  ): Promise<Record<string, TBLocationAddress>> {
    const seedAddresses = [
      {
        fullAddress: '123 Duong Nguyen Van Cu, Quan 5, TP Ho Chi Minh',
        province: 'TP Ho Chi Minh',
        district: 'Quan 5',
        country: 'Viet Nam',
        region: 'Mien Nam',
        lat: 10.762622,
        lng: 106.660172,
      },
      {
        fullAddress: '45 Duong Dien Bien Phu, Binh Thanh, TP Ho Chi Minh',
        province: 'TP Ho Chi Minh',
        district: 'Binh Thanh',
        country: 'Viet Nam',
        region: 'Mien Nam',
        lat: 10.801465,
        lng: 106.714119,
      },
      {
        fullAddress: '78 Duong Le Van Viet, Thu Duc, TP Ho Chi Minh',
        province: 'TP Ho Chi Minh',
        district: 'Thu Duc',
        country: 'Viet Nam',
        region: 'Mien Nam',
        lat: 10.846444,
        lng: 106.785833,
      },
      {
        fullAddress: '12 Duong Nguyen Trai, Thanh Xuan, Ha Noi',
        province: 'Ha Noi',
        district: 'Thanh Xuan',
        country: 'Viet Nam',
        region: 'Mien Bac',
        lat: 21.002276,
        lng: 105.815997,
      },
      {
        fullAddress: '56 Duong Bach Dang, Hai Chau, Da Nang',
        province: 'Da Nang',
        district: 'Hai Chau',
        country: 'Viet Nam',
        region: 'Mien Trung',
        lat: 16.06778,
        lng: 108.22083,
      },
    ];
    const result: Record<string, TBLocationAddress> = {};

    for (const seedAddress of seedAddresses) {
      const existedAddress = await addressRepository.findOne({
        where: { fullAddress: seedAddress.fullAddress },
      });

      const address = await addressRepository.save(
        addressRepository.create({
          ...(existedAddress ?? {}),
          ...seedAddress,
        }),
      );

      result[seedAddress.fullAddress] = address;
    }

    return result;
  }

  private async seedLocations(
    locationRepository: Repository<TBLocation>,
    mediaRepository: Repository<TBLocationMedia>,
    ownerId: number,
    locationTypes: Record<string, TBLocationType>,
    addresses: Record<string, TBLocationAddress>,
  ): Promise<void> {
    const seedLocations: SeedLocation[] = [
      {
        name: 'Phong tro Nguyen Van Cu gan DH Khoa Hoc Tu Nhien',
        typeCode: 'ROOM',
        address: '123 Duong Nguyen Van Cu, Quan 5, TP Ho Chi Minh',
        price: 3200000,
        priceUnit: 'VND/thang',
        area: 22,
        maxGuestCount: 2,
        quantity: 4,
        averageRating: 4.3,
        mediaUrls: [
          'https://images.unsplash.com/photo-1522708323590-d24dbb6b0267',
          'https://images.unsplash.com/photo-1505693416388-ac5ce068fe85',
        ],
      },
      {
        name: 'Can ho dich vu Binh Thanh view Landmark',
        typeCode: 'APARTMENT',
        address: '45 Duong Dien Bien Phu, Binh Thanh, TP Ho Chi Minh',
        price: 8500000,
        priceUnit: 'VND/thang',
        area: 45,
        maxGuestCount: 4,
        quantity: 2,
        averageRating: 4.7,
        mediaUrls: [
          'https://images.unsplash.com/photo-1493809842364-78817add7ffb',
          'https://images.unsplash.com/photo-1502672260266-1c1ef2d93688',
        ],
      },
      {
        name: 'Nha nguyen can Thu Duc cho nhom sinh vien',
        typeCode: 'HOUSE',
        address: '78 Duong Le Van Viet, Thu Duc, TP Ho Chi Minh',
        price: 12000000,
        priceUnit: 'VND/thang',
        area: 80,
        maxGuestCount: 6,
        quantity: 1,
        averageRating: 4.5,
        mediaUrls: [
          'https://images.unsplash.com/photo-1560448204-e02f11c3d0e2',
          'https://images.unsplash.com/photo-1484154218962-a197022b5858',
        ],
      },
      {
        name: 'Ky tuc xa Thanh Xuan gan dai hoc',
        typeCode: 'DORM',
        address: '12 Duong Nguyen Trai, Thanh Xuan, Ha Noi',
        price: 1500000,
        priceUnit: 'VND/thang',
        area: 18,
        maxGuestCount: 1,
        quantity: 8,
        averageRating: 4.0,
        mediaUrls: [
          'https://images.unsplash.com/photo-1555854877-bab0e564b8d5',
        ],
      },
      {
        name: 'Phong tro Hai Chau trung tam Da Nang',
        typeCode: 'ROOM',
        address: '56 Duong Bach Dang, Hai Chau, Da Nang',
        price: 2800000,
        priceUnit: 'VND/thang',
        area: 20,
        maxGuestCount: 2,
        quantity: 3,
        averageRating: 4.2,
        mediaUrls: [
          'https://images.unsplash.com/photo-1560185127-6ed189bf02f4',
        ],
      },
      {
        name: 'Can ho mini Quan 5 co ban cong',
        typeCode: 'APARTMENT',
        address: '123 Duong Nguyen Van Cu, Quan 5, TP Ho Chi Minh',
        price: 6200000,
        priceUnit: 'VND/thang',
        area: 35,
        maxGuestCount: 3,
        quantity: 2,
        averageRating: 4.6,
        mediaUrls: [
          'https://images.unsplash.com/photo-1560448075-bb485b067938',
        ],
      },
      {
        name: 'Phong studio Binh Thanh full noi that',
        typeCode: 'ROOM',
        address: '45 Duong Dien Bien Phu, Binh Thanh, TP Ho Chi Minh',
        price: 4800000,
        priceUnit: 'VND/thang',
        area: 28,
        maxGuestCount: 2,
        quantity: 3,
        averageRating: 4.4,
        mediaUrls: [
          'https://images.unsplash.com/photo-1560440021-33f9b867899d',
        ],
      },
      {
        name: 'Nha nguyen can Da Nang gan song Han',
        typeCode: 'HOUSE',
        address: '56 Duong Bach Dang, Hai Chau, Da Nang',
        price: 15000000,
        priceUnit: 'VND/thang',
        area: 95,
        maxGuestCount: 8,
        quantity: 1,
        averageRating: 4.8,
        mediaUrls: [
          'https://images.unsplash.com/photo-1512917774080-9991f1c4c750',
        ],
      },
    ];

    for (const seedLocation of seedLocations) {
      const existedLocation = await locationRepository.findOne({
        where: {
          name: seedLocation.name,
          ownerId,
        },
      });

      const location = await locationRepository.save(
        locationRepository.create({
          ...(existedLocation ?? {}),
          name: seedLocation.name,
          ownerId,
          price: seedLocation.price,
          priceUnit: seedLocation.priceUnit,
          area: seedLocation.area,
          maxGuestCount: seedLocation.maxGuestCount,
          quantity: seedLocation.quantity,
          averageRating: seedLocation.averageRating,
          locationTypeId: locationTypes[seedLocation.typeCode].id,
          locationAddressId: addresses[seedLocation.address].id,
        }),
      );

      await this.seedLocationMedia(
        mediaRepository,
        location.id,
        seedLocation.mediaUrls,
      );
    }
  }

  private async seedLocationMedia(
    mediaRepository: Repository<TBLocationMedia>,
    locationId: number,
    mediaUrls: string[],
  ): Promise<void> {
    for (const [index, url] of mediaUrls.entries()) {
      const displayOrder = index + 1;
      const existedMedia = await mediaRepository.findOne({
        where: {
          locationId,
          displayOrder,
        },
      });

      await mediaRepository.save(
        mediaRepository.create({
          ...(existedMedia ?? {}),
          type: 'image',
          url,
          displayOrder,
          locationId,
        }),
      );
    }
  }

  private async seedServices(
    serviceRepository: Repository<TBService>,
    locationServiceRepository: Repository<TBLocationService>,
  ): Promise<void> {
    const seedServices = [
      { id: 1, name: 'Wifi', price: 0, priceUnit: 'VND/thang', isFree: true },
      {
        id: 2,
        name: 'Giu xe',
        price: 150000,
        priceUnit: 'VND/thang',
        isFree: false,
      },
      { id: 3, name: 'Dien', price: 4000, priceUnit: 'VND/kWh', isFree: false },
      {
        id: 4,
        name: 'Nuoc',
        price: 100000,
        priceUnit: 'VND/nguoi',
        isFree: false,
      },
      {
        id: 5,
        name: 'May lanh',
        price: 0,
        priceUnit: 'VND/thang',
        isFree: true,
      },
      {
        id: 6,
        name: 'May giat',
        price: 0,
        priceUnit: 'VND/thang',
        isFree: true,
      },
    ];

    for (const seedService of seedServices) {
      const existedService = await serviceRepository.findOne({
        where: { id: seedService.id },
      });

      await serviceRepository.save(
        serviceRepository.create({
          ...(existedService ?? {}),
          id: seedService.id,
          name: seedService.name,
        }),
      );

      const existedLocationService = await locationServiceRepository.findOne({
        where: {
          locationId: 1,
          serviceId: seedService.id,
        },
      });

      await locationServiceRepository.save(
        locationServiceRepository.create({
          ...(existedLocationService ?? {}),
          locationId: 1,
          serviceId: seedService.id,
          price: seedService.price,
          priceUnit: seedService.priceUnit,
          isFree: seedService.isFree,
          isActive: true,
        }),
      );
    }
  }
}
