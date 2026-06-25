import {
  BadRequestException,
  Injectable,
  InternalServerErrorException,
  NotFoundException,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import {
  BookingStatus,
  PaymentMethod,
  PaymentStatus,
} from '@/assets/enum/payment.enum';
import {
  CheckoutPaymentRequestDto,
  CheckoutPaymentResponseDto,
  PaymentCheckUpdateResponseDto,
} from '@/dtos/payment/payment.dto';
import { BookingRepository } from '@/repositories/booking.repository';
import { PaymentPricingService } from '@/services/payment-pricing.service';
import { TBPayment } from '@/entities/payment.entity';
import { TBLocation } from '@/entities/location/location.entity';
import { TBBooking } from '@/entities/booking.entity';
import {
  decryptObject,
  encryptObject,
  PaymentRedirectTokenPayload,
} from '@/utils/payment-token.util';

const CURRENCY = 'vnd';

@Injectable()
export class PaymentService {
  constructor(
    @InjectRepository(TBPayment)
    private readonly paymentRepository: Repository<TBPayment>,
    @InjectRepository(TBLocation)
    private readonly locationRepository: Repository<TBLocation>,
    @InjectRepository(TBBooking)
    private readonly bookingEntityRepository: Repository<TBBooking>,
    private readonly bookingRepository: BookingRepository,
    private readonly pricingService: PaymentPricingService,
    private readonly configService: ConfigService,
  ) {}

  public async createCheckout(
    userId: number,
    payload: CheckoutPaymentRequestDto,
  ): Promise<CheckoutPaymentResponseDto> {
    const location = await this.locationRepository.findOne({
      where: { id: payload.locationId },
    });

    if (!location) {
      throw new NotFoundException('Location not found');
    }

    // Check room availability
    const availableResult = await this.bookingRepository.getAvailableRooms({
      locationId: payload.locationId,
      startDate: new Date(payload.startDate),
      endDate: new Date(payload.endDate),
    });

    if (availableResult.availableRooms < 1) {
      throw new BadRequestException('Location is already booked');
    }

    const totalAmount = this.pricingService.calculateLocationAmount(
      Number(location.price),
      location.priceUnit,
      payload.startDate,
      payload.endDate,
    );

    // Create Booking
    const booking = await this.bookingRepository.createBooking(
      {
        locationId: payload.locationId,
        startDate: new Date(payload.startDate),
        endDate: new Date(payload.endDate),
        roomNumber: 1,
        guestCount: payload.guestCount,
        note: payload.note,
        totalAmount,
        currency: CURRENCY,
      },
      userId,
    );

    // Update Booking status to PENDING_PAYMENT
    await this.bookingRepository.updateBooking(
      booking.id,
      BookingStatus.PENDING_PAYMENT,
      userId,
    );
    booking.status = BookingStatus.PENDING_PAYMENT;

    // Create Payment
    const payment = await this.paymentRepository.save(
      this.paymentRepository.create({
        userId,
        bookingId: booking.id,
        method: PaymentMethod.PAYOS,
        amount: totalAmount,
        currency: CURRENCY,
        status: PaymentStatus.UNPAID,
      }),
    );

    // Generate redirect token
    const token = this.generatePaymentToken(booking.id, payment.id, 1); // 1 = UNPAID / pending
    const webUrl = this.configService.get<string>('WEB_URL') || 'http://localhost:5173';
    const checkoutUrl = `${webUrl.replace(/\/+$/g, '')}/checkout/${token}`;

    // Save checkoutUrl
    await this.paymentRepository.update(payment.id, { checkoutUrl });

    return {
      bookingId: booking.id,
      paymentId: payment.id,
      checkoutUrl,
      qrCode: '',
      status: PaymentStatus.UNPAID,
    };
  }

  public async checkUpdate(
    userId: number,
    token: string,
  ): Promise<PaymentCheckUpdateResponseDto> {
    const payload = decryptObject(token, this.getPaymentTokenSecret());

    const payment = await this.paymentRepository.findOne({
      where: { id: payload.paymentId, bookingId: payload.bookingId, userId },
    });

    if (!payment) {
      throw new NotFoundException('Payment not found');
    }

    const booking = await this.bookingEntityRepository.findOne({
      where: { id: payload.bookingId, userId },
    });

    if (!booking) {
      throw new NotFoundException('Booking not found');
    }

    return {
      bookingId: booking.id,
      paymentId: payment.id,
      bookingStatus: booking.status,
      paymentStatus: payment.status,
      amount: payment.amount,
      currency: payment.currency,
      checkoutUrl: payment.checkoutUrl,
      qrCode: payment.qrCode,
    };
  }

  public async simulateSuccess(
    userId: number,
    token: string,
  ): Promise<PaymentCheckUpdateResponseDto> {
    const payload = decryptObject(token, this.getPaymentTokenSecret());

    const payment = await this.paymentRepository.findOne({
      where: { id: payload.paymentId, bookingId: payload.bookingId, userId },
    });

    if (!payment) {
      throw new NotFoundException('Payment not found');
    }

    const booking = await this.bookingEntityRepository.findOne({
      where: { id: payload.bookingId, userId },
    });

    if (!booking) {
      throw new NotFoundException('Booking not found');
    }

    // Update status to PAID & CONFIRMED
    payment.status = PaymentStatus.PAID;
    await this.paymentRepository.save(payment);

    booking.status = BookingStatus.CONFIRMED;
    await this.bookingEntityRepository.save(booking);

    return {
      bookingId: booking.id,
      paymentId: payment.id,
      bookingStatus: booking.status,
      paymentStatus: payment.status,
      amount: payment.amount,
      currency: payment.currency,
      checkoutUrl: payment.checkoutUrl,
      qrCode: payment.qrCode,
    };
  }

  private generatePaymentToken(
    bookingId: number,
    paymentId: number,
    status: number,
  ): string {
    return encryptObject(
      { bookingId, paymentId, status },
      this.getPaymentTokenSecret(),
    );
  }

  private getPaymentTokenSecret(): string {
    return (
      this.configService.get<string>('PAYMENT_TOKEN_SECRET') ||
      'default_payment_token_secret_32_bytes_long_!'
    );
  }
}
