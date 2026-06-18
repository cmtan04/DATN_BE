import { Injectable } from '@nestjs/common';
import { Repository, In } from 'typeorm';
import { InjectRepository } from '@nestjs/typeorm';
import { TBBooking } from '@/entities/booking.entity';
import { TBLocationAvailability } from '@/entities/location_availability.entity';
import {
  GetAvailableRoomsRequestDto,
  GetAvailableRoomsResponseDto,
} from '@/dtos/booking.dto';
import { TBLocation } from '@/entities/location/location.entity';
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

  public async getAvailableRooms(
    payload: GetAvailableRoomsRequestDto,
  ): Promise<GetAvailableRoomsResponseDto> {
    const maxRooms = await this.locationRepository.findOne({
      where: { id: payload.locationId },
      select: { quantity: true },
    });

    // Lấy tất cả các ngày trong khoảng thời gian
    const dates: Date[] = [];
    for (
      let date = new Date(payload.startDate);
      date < payload.endDate;
      date.setDate(date.getDate() + 1)
    ) {
      dates.push(new Date(date));
    }

    // Lấy số lượng phòng đã đặt cho mỗi ngày
    const result = await this.locationAvailabilityRepository
      .createQueryBuilder('availability')
      .select(['MAX(availability.bookedCount) AS maxBooked']) // DB tự tìm số lớn nhất
      .where('availability.locationId = :locationId', {
        locationId: payload.locationId,
      })
      .andWhere('availability.date IN (:...dates)', { dates }) // Cú pháp IN chuẩn của QueryBuilder
      .getRawOne();

    // Lấy ra số lượng phòng đặt lớn nhất (Nếu không có bản ghi nào thì mặc định là 0)
    const maxBookedCount = result?.maxBooked ? Number(result.maxBooked) : 0;
    const availableRooms = maxRooms
      ? Math.max(maxRooms.quantity - maxBookedCount, 0)
      : 0;

    return { availableRooms: availableRooms };
  }
}
