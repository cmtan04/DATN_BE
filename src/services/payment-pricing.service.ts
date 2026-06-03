import { BadRequestException, Injectable } from '@nestjs/common';

const DAY_IN_MS = 24 * 60 * 60 * 1000;

@Injectable()
export class PaymentPricingService {
  public calculateLocationAmount(
    price: number,
    priceUnit: string,
    startDate: string,
    endDate: string,
  ): number {
    if (!Number.isInteger(price) || price <= 0) {
      throw new BadRequestException('Location price is invalid');
    }

    const dateDiffDays = this.getDateDiffDays(startDate, endDate);
    const normalizedUnit = this.normalizePriceUnit(priceUnit);

    if (this.isMonthUnit(normalizedUnit)) {
      return price * Math.max(1, Math.ceil(dateDiffDays / 30));
    }

    if (this.isDayUnit(normalizedUnit)) {
      return price * Math.max(1, Math.ceil(dateDiffDays));
    }

    throw new BadRequestException('Unsupported location priceUnit');
  }

  private getDateDiffDays(startDate: string, endDate: string): number {
    const start = this.parseDateOnly(startDate, 'startDate');
    const end = this.parseDateOnly(endDate, 'endDate');
    const diffDays = (end.getTime() - start.getTime()) / DAY_IN_MS;

    if (diffDays <= 0) {
      throw new BadRequestException('endDate must be after startDate');
    }

    return diffDays;
  }

  private parseDateOnly(value: string, fieldName: string): Date {
    if (typeof value !== 'string' || !/^\d{4}-\d{2}-\d{2}$/.test(value)) {
      throw new BadRequestException(`${fieldName} must use YYYY-MM-DD format`);
    }

    const date = new Date(`${value}T00:00:00.000Z`);

    if (Number.isNaN(date.getTime())) {
      throw new BadRequestException(`${fieldName} is invalid`);
    }

    return date;
  }

  private normalizePriceUnit(value: string): string {
    return value
      .trim()
      .toLowerCase()
      .normalize('NFD')
      .replace(/[\u0300-\u036f]/g, '');
  }

  private isMonthUnit(value: string): boolean {
    return value.includes('thang') || value.includes('month');
  }

  private isDayUnit(value: string): boolean {
    return (
      value.includes('ngay') ||
      value.includes('day') ||
      value.includes('dem') ||
      value.includes('night')
    );
  }
}
