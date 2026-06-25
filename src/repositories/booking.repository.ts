import { Injectable } from '@nestjs/common';
import { Repository, In } from 'typeorm';
import { InjectRepository } from '@nestjs/typeorm';
import { TBBooking } from '@/entities/booking.entity';
import { TBLocationAvailability } from '@/entities/location_availability.entity';
import {
  GetAvailableRoomsRequestDto,
  GetAvailableRoomsResponseDto,
  CreateBookingRequestDto,
} from '@/dtos/booking.dto';
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

  public getDateRange(startDate: Date, endDate: Date): Date[] {
    const dates: Date[] = [];
    for (
      let date = new Date(startDate);
      date < endDate;
      date.setDate(date.getDate() + 1)
    ) {
      dates.push(new Date(date));
    }
    return dates;
  }

  public async getAvailableRooms(
    payload: GetAvailableRoomsRequestDto,
  ): Promise<GetAvailableRoomsResponseDto> {
    if (!payload.locationId) {
      throw new Error('Location ID is required');
    }

    if (!payload.startDate || !payload.endDate) {
      throw new Error('Start date and end date are required');
    }

    if (payload.startDate >= payload.endDate) {
      throw new Error('Start date must be before end date');
    }

    const maxCount = await this.locationRepository.findOne({
      where: { id: payload.locationId },
      select: { quantity: true },
    });

    const dates: Date[] = this.getDateRange(payload.startDate, payload.endDate);

    // Lấy số lượng phòng còn trống lớn nhất trong khoảng thời gian
    const result = await this.locationAvailabilityRepository
      .createQueryBuilder('availability')
      .select(['MIN(availability.availableCount) AS maxAvailable'])
      .where('availability.locationId = :locationId', {
        locationId: payload.locationId,
      })
      .andWhere('availability.date IN (:...dates)', { dates })
      .getRawOne();

    // Lấy ra số lượng phòng còn trống lớn nhất (Nếu không có bản ghi nào thì lấy số lượng phòng tối đa của địa điểm)
    const maxAvailableCount = Number(
      result?.maxAvailable ?? maxCount?.quantity ?? 0,
    );

    return { availableRooms: maxAvailableCount };
  }

  public async createBooking(
    payload: CreateBookingRequestDto,
    userId: number,
  ): Promise<TBBooking> {
    return await this.bookingRepository.manager.transaction(
      async (transactionalEntityManager) => {
        // 1. Lock các dòng dữ liệu cần kiểm tra trong khoảng thời gian
        const dates = this.getDateRange(payload.startDate, payload.endDate);

        const availabilities = await transactionalEntityManager
          .createQueryBuilder(TBLocationAvailability, 'availability')
          .setLock('pessimistic_write') // Khóa dòng này lại
          .where('availability.locationId = :locationId', {
            locationId: payload.locationId,
          })
          .andWhere('availability.date IN (:...dates)', { dates })
          .getMany();

        const location = await transactionalEntityManager.findOne(TBLocation, {
          where: { id: payload.locationId },
          select: { quantity: true },
        });
        const maxQuantity = location?.quantity ?? 0;

        // Map existing availabilities by date string YYYY-MM-DD
        const availabilityMap = new Map<string, TBLocationAvailability>();
        for (const av of availabilities) {
          const dateStr = new Date(av.date).toISOString().split('T')[0];
          availabilityMap.set(dateStr, av);
        }

        const finalAvailabilities: TBLocationAvailability[] = [];

        for (const date of dates) {
          const dateStr = date.toISOString().split('T')[0];
          let av = availabilityMap.get(dateStr);
          if (!av) {
            av = transactionalEntityManager.create(TBLocationAvailability, {
              locationId: payload.locationId,
              date: date,
              availableCount: maxQuantity,
              bookedCount: 0,
            });
          }
          finalAvailabilities.push(av);
        }

        // 2. Kiểm tra xem có ngày nào hết phòng không
        const canBook = finalAvailabilities.every(
          (a) => a.availableCount >= payload.roomNumber,
        );

        if (!canBook) {
          // Gợi ý: Tại đây bạn có thể trigger logic fallback (tìm phòng khác)
          throw new Error('ROOM_UNAVAILABLE');
        }

        // 3. Cập nhật số lượng phòng
        for (const av of finalAvailabilities) {
          av.availableCount -= payload.roomNumber;
          av.bookedCount += payload.roomNumber;
          await transactionalEntityManager.save(av);
        }

        // 4. Tạo booking
        const booking = this.bookingRepository.create({
          ...payload,
          userId,
          bookingCode: `BOOK-${userId}-${Date.now()}-${Math.floor(Math.random() * 1000)}`,
        });

        return await transactionalEntityManager.save(booking);
      },
    );
  }

  public async updateBooking(
    bookingId: number,
    status: BookingStatus,
    userId: number,
  ): Promise<TBBooking | null> {
    const repoUserId = await this.bookingRepository.findOne({
      where: { id: bookingId },
      select: { userId: true },
    });

    if (repoUserId?.userId !== userId) {
      throw new Error('Unauthorized');
    }
    await this.bookingRepository.update(bookingId, { status });
    return await this.bookingRepository.findOne({ where: { id: bookingId } });
  }

  cancelBooking(bookingId: number, userId: number): Promise<void> {
    return this.bookingRepository.manager.transaction(
      async (transactionalEntityManager) => {
        const booking = await transactionalEntityManager.findOne(TBBooking, {
          where: { id: bookingId },
        });

        if (!booking) {
          throw new Error('Booking not found');
        }

        if (booking.userId !== userId) {
          throw new Error('Unauthorized');
        }

        // Lấy tất cả các ngày trong khoảng thời gian
        const dates = this.getDateRange(booking.startDate, booking.endDate);

        // Lock các dòng dữ liệu cần kiểm tra trong khoảng thời gian
        const availabilities = await transactionalEntityManager
          .createQueryBuilder(TBLocationAvailability, 'availability')
          .setLock('pessimistic_write') // Khóa dòng này lại
          .where('availability.locationId = :locationId', {
            locationId: booking.locationId,
          })
          .andWhere('availability.date IN (:...dates)', { dates })
          .getMany();

        // Cộng số lượng phòng trở lại
        for (const av of availabilities) {
          av.availableCount += booking.roomNumber;
          av.bookedCount -= booking.roomNumber;
          await transactionalEntityManager.save(av);
        }
        await transactionalEntityManager.update(TBBooking, bookingId, {
          status: BookingStatus.CANCELLED,
        });
      },
    );
  }

  public async getUserBookings(userId: number): Promise<any[]> {
    return await this.bookingRepository
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
      )
      .select([
        'booking.id as id',
        'booking.bookingCode as bookingCode',
        'booking.startDate as startDate',
        'booking.endDate as endDate',
        'booking.roomNumber as roomNumber',
        'booking.guestCount as guestCount',
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
      .where('booking.userId = :userId', { userId })
      .orderBy('booking.createdAt', 'DESC')
      .getRawMany();
  }
}
