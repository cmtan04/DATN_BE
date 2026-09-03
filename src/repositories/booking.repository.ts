import {
  Injectable,
  BadRequestException,
  NotFoundException,
} from '@nestjs/common';
import { Repository, In, LessThan, EntityManager } from 'typeorm';
import { InjectRepository } from '@nestjs/typeorm';
import { TBBooking } from '@/entities/booking.entity';
import { TBLocationAvailability } from '@/entities/location_availability.entity';
import {
  GetUserBookingsRequestDto,
  GetUserBookingsSummaryDto,
  RawBookingData,
} from '@/dtos/booking.dto';
import { TBLocation } from '@/entities/location/location.entity';
import { BookingStatus } from '@assets/enum/payment.enum';
import { FindOptionsWhere } from 'typeorm';

@Injectable()
export class BookingRepository {
  constructor(
    @InjectRepository(TBBooking)
    private readonly bookingRepository: Repository<TBBooking>,

    @InjectRepository(TBLocationAvailability)
    private readonly locationAvailabilityRepository: Repository<TBLocationAvailability>,

    @InjectRepository(TBLocation)
    private readonly locationRepository: Repository<TBLocation>,
  ) {}

  async seedLocationAvailabilities(
    manager: EntityManager,
    locationId: number,
    dateStrings: string[],
  ): Promise<void> {
    await manager
      .createQueryBuilder()
      .insert()
      .into(TBLocationAvailability)
      .values(
        dateStrings.map((dateStr) => ({
          locationId,
          date: dateStr,
          bookedCount: 0,
        })),
      )
      .orIgnore()
      .execute();
  }

  async updateAvailabilities(
    manager: EntityManager,
    locationId: number,
    dateStrings: string[],
    rooms: number,
    maxQuantity: number,
  ): Promise<void> {
    const updateResult = await manager
      .createQueryBuilder()
      .update(TBLocationAvailability)
      .set({
        bookedCount: () => 'bookedCount + :rooms',
      })
      .where('locationId = :locationId', { locationId: locationId })
      .andWhere('date IN (:...dates)', { dates: dateStrings })
      .andWhere(':maxQuantity - bookedCount >= :rooms')
      .setParameters({
        rooms: rooms,
        maxQuantity: maxQuantity,
      })
      .execute();

    if (updateResult.affected !== dateStrings.length) {
      throw new BadRequestException('Phòng đã hết trong khoảng thời gian này.');
    }
  }

  async findExpiredBookings(expirationTime: Date): Promise<TBBooking[]> {
    return await this.bookingRepository.find({
      where: [
        {
          status: BookingStatus.PENDING_PAYMENT,
          createdAt: LessThan(expirationTime),
        },
        {
          status: BookingStatus.CREATED,
          createdAt: LessThan(expirationTime),
        },
      ],
    });
  }

  async getAvailableRooms(
    locationId: number,
    dateStrings: string[],
  ): Promise<number> {
    const location = await this.locationRepository.findOne({
      where: { id: locationId },
      select: { quantity: true },
    });
    if (!location) {
      throw new NotFoundException('Location not exist');
    }

    const maxQuantity = location?.quantity ?? 0;

    const result = await this.locationAvailabilityRepository
      .createQueryBuilder('availability')
      .select(['MAX(availability.bookedCount) AS maxBooked'])
      .where('availability.locationId = :locationId', {
        locationId: locationId,
      })
      .andWhere('availability.date IN (:...dates)', { dates: dateStrings })
      .getRawOne();

    const maxBookedCount = Number(result?.maxBooked ?? 0);

    return Math.max(0, maxQuantity - maxBookedCount);
  }

  async updateBooking(
    bookingId: number,
    status: BookingStatus,
    userId: number,
    note?: string,
  ): Promise<TBBooking | null> {
    const repoUserId = await this.bookingRepository.findOne({
      where: { id: bookingId },
      select: { userId: true },
    });

    if (repoUserId?.userId !== userId) {
      throw new Error('Unauthorized');
    }

    const updateData: any = { status };
    if (note !== undefined) {
      updateData.note = note;
    }

    await this.bookingRepository.update(bookingId, updateData);
    return await this.bookingRepository.findOne({ where: { id: bookingId } });
  }

  async findBooking(where: FindOptionsWhere<TBBooking>): Promise<TBBooking> {
    const booking = await this.bookingRepository.findOne({ where });
    if (!booking) {
      throw new NotFoundException('Booking not found!');
    }
    return booking;
  }

  async restoreAvailabilities(
    locationId: number,
    dateStrings: string[],
    rooms: number,
  ): Promise<void> {
    if (dateStrings.length === 0) {
      return;
    }

    const updateResult = await this.locationAvailabilityRepository
      .createQueryBuilder()
      .update()
      .set({
        bookedCount: () => 'bookedCount - :rooms',
      })
      .where('locationId = :locationId', { locationId: locationId })
      .andWhere('date IN (:...dates)', { dates: dateStrings })
      .setParameters({
        rooms: rooms,
      })
      .execute();

    if (updateResult.affected !== dateStrings.length) {
      throw new Error('Failed to restore availabilities');
    }
  }

  private async baseQueryBuilder() {
    return this.bookingRepository
      .createQueryBuilder('booking')
      .leftJoin(TBLocation, 'location', 'location.id = booking.locationId')
      .leftJoin(
        'tb_location_address',
        'address',
        'address.id = location.locationAddressId',
      )
      .leftJoin(
        'tb_location_media',
        'media',
        'media.locationId = location.id AND media.displayOrder = 1',
      );
  }

  async getUserBookings(
    userId: number,
    queryDto: GetUserBookingsRequestDto,
  ): Promise<{
    data: RawBookingData[];
    totalCount: number;
    summary: GetUserBookingsSummaryDto;
  }> {
    const query = await this.baseQueryBuilder();

    query.where('booking.userId = :userId', { userId });

    if (queryDto.search) {
      query.andWhere(
        '(location.name LIKE :search OR booking.bookingCode LIKE :search)',
        { search: `%${queryDto.search}%` },
      );
    }

    if (queryDto.status) {
      if (queryDto.status === BookingStatus.CONFIRMED) {
        query.andWhere('booking.status = :confirmedStatus ', {
          confirmedStatus: BookingStatus.CONFIRMED,
        });
      } else if (queryDto.status === BookingStatus.COMPLETED) {
        query.andWhere('booking.status = :completedStatus', {
          completedStatus: BookingStatus.COMPLETED,
        });
      } else if (queryDto.status === BookingStatus.CANCELLED) {
        query.andWhere('booking.status = :cancelledStatus', {
          cancelledStatus: BookingStatus.CANCELLED,
        });
      }
    }

    const totalCount = await query.getCount();

    const page = queryDto.page || 1;
    const limit = queryDto.limit || 6;
    const skip = (page - 1) * limit;

    const rawData: RawBookingData[] = await query
      .select([
        'booking.id as id',
        'booking.bookingCode as bookingCode',
        'booking.startDate as startDate',
        'booking.endDate as endDate',
        'booking.roomNumber as roomNumber',
        'booking.note as note',
        'booking.status as status',
        'booking.totalAmount as totalAmount',
        'booking.currency as currency',
        'booking.createdAt as createdAt',
        'location.id as locationId',
        'location.name as locationName',
        'location.price as price',
        'location.priceUnit as priceUnit',
        'location.area as area',
        'address.fullAddress as fullAddress',
        'media.url as thumbnailUrl',
      ])
      .orderBy('booking.createdAt', 'DESC')
      .offset(skip)
      .limit(limit)
      .getRawMany();

    const confirmedCount = await this.bookingRepository
      .createQueryBuilder('booking')
      .where('booking.userId = :userId', { userId })
      .andWhere('booking.status = :confirmedStatus ', {
        confirmedStatus: BookingStatus.CONFIRMED,
      })
      .getCount();

    const completedCount = await this.bookingRepository
      .createQueryBuilder('booking')
      .where('booking.userId = :userId', { userId })
      .andWhere('booking.status = :completedStatus ', {
        completedStatus: BookingStatus.COMPLETED,
      })
      .getCount();

    const cancelledCount = await this.bookingRepository
      .createQueryBuilder('booking')
      .where('booking.userId = :userId', { userId })
      .andWhere('booking.status = :cancelledStatus', {
        cancelledStatus: BookingStatus.CANCELLED,
      })
      .getCount();
    const total = confirmedCount + completedCount + cancelledCount;

    return {
      data: rawData,
      totalCount,
      summary: {
        allCount: total,
        confirmedCount,
        completedCount,
        cancelledCount,
      },
    };
  }
}
