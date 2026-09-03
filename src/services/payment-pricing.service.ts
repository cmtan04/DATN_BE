import { BadRequestException, Injectable } from '@nestjs/common';
import { getDateRange } from '@/utils/date.util';

@Injectable()
export class PaymentPricingService {
  public calculateLocationAmount(
    price: number,
    startDate: Date | string,
    endDate: Date | string,
    roomNumber: number,
  ): number {
    const numPrice = Number(price);
    if (!Number.isFinite(numPrice) || numPrice <= 0) {
      throw new BadRequestException('Location price is invalid');
    }

    const date = getDateRange(startDate, endDate);
    if (date.length <= 0) {
      throw new BadRequestException('Khoảng thời gian đặt phòng không hợp lệ');
    }

    return numPrice * date.length * roomNumber * 0.15;
  }
}
