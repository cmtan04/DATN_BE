import { BadRequestException, Injectable } from '@nestjs/common';
import { getDateRange } from '@/utils/date.util';

@Injectable()
export class PaymentPricingService {
  public calculateLocationAmount(
    price: number,
    startDate: string,
    endDate: string,
    roomNumber: number,
  ): number {
    if (!Number.isInteger(price) || price <= 0) {
      throw new BadRequestException('Location price is invalid');
    }

    const date = getDateRange(new Date(startDate), new Date(endDate));

    return price * Math.max(1, Math.ceil(date.length)) * roomNumber;
  }
}
