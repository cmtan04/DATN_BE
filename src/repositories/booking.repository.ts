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
} from '@/dtos/user/user.dto';
import { TBLocation } from '@/entities/location/location.entity';
import { BookingStatus } from '@assets/enum/payment.enum';

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

  async findBooking(bookingCode: string, userId: number): Promise<TBBooking> {
    const booking = await this.bookingRepository.findOne({
      where: { bookingCode, userId },
    });

    if (!booking) {
      throw new BadRequestException('Booking not found');
    }

    return booking;
  }

  async restoreAvailabilities(
    manager: EntityManager,
    locationId: number,
    dateStrings: string[],
    rooms: number,
  ): Promise<void> {
    const updateResult = await manager
      .createQueryBuilder()
      .update(TBLocationAvailability)
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

    if (queryDto.status && queryDto.status !== 'all') {
      const statusStr = queryDto.status.toLowerCase();
      if (statusStr === 'pending') {
        query.andWhere('booking.status IN (:...pendingStatuses)', {
          pendingStatuses: [
            BookingStatus.PENDING_PAYMENT,
            BookingStatus.CREATED,
          ],
        });
      } else if (statusStr === 'confirmed') {
        query.andWhere(
          'booking.status = :confirmedStatus AND booking.endDate >= NOW()',
          { confirmedStatus: BookingStatus.CONFIRMED },
        );
      } else if (statusStr === 'completed') {
        query.andWhere(
          'booking.status = :confirmedStatus AND booking.endDate < NOW()',
          { confirmedStatus: BookingStatus.CONFIRMED },
        );
      } else if (statusStr === 'cancelled') {
        query.andWhere('booking.status IN (:...cancelledStatuses)', {
          cancelledStatuses: [BookingStatus.CANCELLED, BookingStatus.EXPIRED],
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
      .andWhere(
        'booking.status = :confirmedStatus AND booking.endDate >= NOW()',
        { confirmedStatus: BookingStatus.CONFIRMED },
      )
      .getCount();

    const completedCount = await this.bookingRepository
      .createQueryBuilder('booking')
      .where('booking.userId = :userId', { userId })
      .andWhere(
        'booking.status = :confirmedStatus AND booking.endDate < NOW()',
        { confirmedStatus: BookingStatus.CONFIRMED },
      )
      .getCount();

    const cancelledCount = await this.bookingRepository
      .createQueryBuilder('booking')
      .where('booking.userId = :userId', { userId })
      .andWhere('booking.status IN (:...cancelledStatuses)', {
        cancelledStatuses: [BookingStatus.CANCELLED, BookingStatus.EXPIRED],
      })
      .getCount();

    return {
      data: rawData,
      totalCount,
      summary: {
        confirmedCount,
        completedCount,
        cancelledCount,
      },
    };
  }
}
