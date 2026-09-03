import {
  Injectable,
  BadRequestException,
  NotFoundException,
} from '@nestjs/common';
import { BookingRepository } from '@/repositories/booking.repository';
import {
  CreateBookingRequestDto,
  CreateBookingResponseDto,
  GetAvailableRoomsRequestDto,
  GetAvailableRoomsResponseDto,
  CancelBookingRequestDto,
  GetUserBookingsRequestDto,
  GetUserBookingsResponseDto,
  UserBookingItemDto,
  RawBookingData,
} from '@/dtos/booking.dto';
import { BookingStatus } from '@/assets/enum/payment.enum';
import { getDateRange, formatDateString } from '@/utils/date.util';
import { generateCode } from '@/utils/nanoID.util';
import { DataSource, EntityManager, FindOptionsWhere } from 'typeorm';
import { TBLocation } from '@/entities/location/location.entity';
import { TBBooking } from '@/entities/booking.entity';

@Injectable()
export class BookingService {
  constructor(
    private readonly bookingRepository: BookingRepository,
    private readonly dataSource: DataSource,
  ) {}

  public async getUserBookings(
    userId: number,
    query: GetUserBookingsRequestDto,
  ): Promise<GetUserBookingsResponseDto> {
    const {
      data: rawData,
      totalCount,
      summary,
    } = await this.bookingRepository.getUserBookings(userId, query);

    const mappedData: UserBookingItemDto[] = rawData.map(
      (b: RawBookingData) => ({
        id: Number(b.id),
        bookingCode: String(b.bookingCode),
        startDate: b.startDate,
        endDate: b.endDate,
        roomNumber: Number(b.roomNumber),
        note: b.note,
        status: b.status,
        totalAmount: Number(b.totalAmount),
        currency: String(b.currency),
        createdAt: b.createdAt,
        location: {
          id: Number(b.locationId),
          name: String(b.locationName),
          price: Number(b.price),
          priceUnit: String(b.priceUnit),
          area: Number(b.area),
          address: String(b.fullAddress),
          thumbnailUrl: String(b.thumbnailUrl),
        },
      }),
    );

    const limit = query.limit || 6;
    const page = query.page || 1;
    const totalPages = Math.ceil(totalCount / limit);

    return {
      data: mappedData,
      meta: {
        page,
        limit,
        total: totalCount,
        totalPages,
      },
      summary,
    };
  }

  public async createBooking(
    userId: number,
    payload: CreateBookingRequestDto,
  ): Promise<CreateBookingResponseDto> {
    const dates = getDateRange(payload.startDate, payload.endDate);
    const dateStrings = dates.map((d) => formatDateString(d));

    return this.dataSource.manager.transaction(
      async (transactionalEntityManager) => {
        const location = await transactionalEntityManager.findOne(TBLocation, {
          where: { id: payload.locationId },
          select: { id: true, quantity: true },
        });

        if (!location) {
          throw new NotFoundException('Địa điểm không tồn tại');
        }
        const maxQuantity = location.quantity ?? 0;

        await this.bookingRepository.seedLocationAvailabilities(
          transactionalEntityManager,
          payload.locationId,
          dateStrings,
        );

        await this.bookingRepository.updateAvailabilities(
          transactionalEntityManager,
          payload.locationId,
          dateStrings,
          payload.roomNumber,
          maxQuantity,
        );
        return await transactionalEntityManager.save(TBBooking, {
          ...payload,
          bookingCode: generateCode(),
          userId,
        });
      },
    );
  }

  public async getAvailableRooms(
    payload: GetAvailableRoomsRequestDto,
  ): Promise<GetAvailableRoomsResponseDto> {
    const dates: Date[] = getDateRange(payload.startDate, payload.endDate);
    const dateStrings = dates.map((d) => formatDateString(d));
    const availableRooms = await this.bookingRepository.getAvailableRooms(
      payload.locationId,
      dateStrings,
    );
    return {
      availableRooms,
    };
  }

  public async findBooking(
    where: FindOptionsWhere<TBBooking>,
  ): Promise<TBBooking> {
    return await this.bookingRepository.findBooking(where);
  }

  /**
   * Cập nhật trạng thái booking. Hỗ trợ nhận EntityManager để chạy trong transaction.
   */
  public async updateBookingStatus(
    bookingId: number,
    status: BookingStatus,
    note?: string,
    manager?: EntityManager,
  ): Promise<void> {
    const repo = manager
      ? manager.getRepository(TBBooking)
      : this.dataSource.getRepository(TBBooking);

    const updateData: Partial<TBBooking> = { status };
    if (note !== undefined) {
      updateData.note = note;
    }
    await repo.update({ id: bookingId }, updateData);
  }

  /**
   * Phục hồi availability khi hủy booking.
   */
  public async restoreAvailabilities(
    locationId: number,
    dateStrings: string[],
    rooms: number,
  ): Promise<void> {
    await this.bookingRepository.restoreAvailabilities(
      locationId,
      dateStrings,
      rooms,
    );
  }

  /**
   * Tìm các booking đã hết hạn (PENDING_PAYMENT hoặc CREATED quá thời gian).
   */
  public async findExpiredBookings(expirationTime: Date): Promise<TBBooking[]> {
    return await this.bookingRepository.findExpiredBookings(expirationTime);
  }

  /**
   * Validate booking có thể hủy được không.
   */
  public validateBookingCanBeCancelled(status: BookingStatus): void {
    if (status === BookingStatus.CANCELLED) {
      throw new BadRequestException('Đặt phòng đã bị hủy trước đó');
    }
  }

  /**
   * Validate thông tin ngân hàng cho hoàn tiền.
   */
  public validateBankDetails(payload: CancelBookingRequestDto): void {
    if (!payload.bankName || !payload.accountNumber || !payload.accountHolder) {
      throw new BadRequestException(
        'Vui lòng cung cấp đầy đủ thông tin ngân hàng (bankName, accountNumber, accountHolder) để nhận tiền hoàn.',
      );
    }
  }
}
