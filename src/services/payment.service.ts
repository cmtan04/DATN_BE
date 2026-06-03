import {
  BadRequestException,
  ForbiddenException,
  Injectable,
  InternalServerErrorException,
  NotFoundException,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import {
  PaymentMethod,
  PaymentStatus,
  PaymentTranscriptStatus,
} from '@assets/enum/payment.enum';
import {
  CheckoutPaymentRequestDto,
  CheckoutPaymentResponseDto,
  PaymentCheckUpdateResponseDto,
} from '@/dtos/payment/payment.dto';
import { PaymentRepository } from '@/repositories/payment.repository';
import { PaymentPricingService } from '@/services/payment-pricing.service';
import { PayosService } from '@/services/payos.service';
import { NotificationService } from '@/services/notification.service';
import {
  decryptObject,
  encryptObject,
  PaymentRedirectTokenPayload,
} from '@/utils/payment-token.util';
import type {
  CreatePaymentLinkResponse,
  Webhook,
  WebhookData,
} from '@payos/node';

const CURRENCY = 'vnd';
const MAX_CONTACT_LENGTH = 255;
const MAX_PHONE_LENGTH = 50;
const MAX_NOTE_LENGTH = 2000;

@Injectable()
export class PaymentService {
  constructor(
    private readonly paymentRepository: PaymentRepository,
    private readonly pricingService: PaymentPricingService,
    private readonly payosService: PayosService,
    private readonly notificationService: NotificationService,
    private readonly configService: ConfigService,
  ) {}

  public async createCheckout(
    userId: number,
    payload: CheckoutPaymentRequestDto,
  ): Promise<CheckoutPaymentResponseDto> {
    const input = this.normalizeCheckoutPayload(payload);
    const location = await this.paymentRepository.findLocationForBooking(
      input.locationId,
    );

    if (!location) {
      throw new NotFoundException('Location not found');
    }

    const hasOverlap =
      await this.paymentRepository.hasConfirmedBookingOverlap(
        input.locationId,
        input.startDate,
        input.endDate,
      );

    if (hasOverlap) {
      throw new BadRequestException('Location is already booked');
    }

    const totalAmount = this.pricingService.calculateLocationAmount(
      Number(location.price),
      location.priceUnit,
      input.startDate,
      input.endDate,
    );

    const { booking, payment } =
      await this.paymentRepository.createPendingBookingAndPayment({
        userId,
        ...input,
        amount: totalAmount,
        currency: CURRENCY,
      });

    try {
      const session = await this.createPaymentTranscript(
        PaymentMethod.PAYOS,
        {
          bookingId: booking.id,
          paymentId: payment.id,
          userId,
          locationName: location.name,
          locationDescription: location.description,
          startDate: input.startDate,
          endDate: input.endDate,
          contactName: input.contactName,
          contactPhone: input.contactPhone,
          contactEmail: input.contactEmail,
          totalAmount,
        },
      );

      if (!session.checkoutUrl) {
        throw new InternalServerErrorException('payOS checkout URL is empty');
      }

      if (!session.qrCode) {
        throw new InternalServerErrorException('payOS QR code is empty');
      }

      await this.paymentRepository.attachPayosPaymentLink(
        payment.id,
        session.orderCode,
        session.paymentLinkId,
        session.checkoutUrl,
        session.qrCode,
      );

      return {
        bookingId: booking.id,
        paymentId: payment.id,
        checkoutUrl: session.checkoutUrl,
        qrCode: session.qrCode,
        status: PaymentStatus.UNPAID,
      };
    } catch (error) {
      await this.paymentRepository.markCheckoutCreationFailed(
        booking.id,
        payment.id,
      );
      throw error;
    }
  }

  public async handlePayosWebhook(
    payload: Webhook,
  ): Promise<{ received: true }> {
    const data = await this.payosService.verifyWebhook(payload);

    if (payload.success && data.code === '00') {
      await this.handlePayosPaymentSucceeded(data);
    }

    return { received: true };
  }

  public async checkUpdate(
    userId: number,
    token: string,
  ): Promise<PaymentCheckUpdateResponseDto> {
    const payload = decryptObject(token, this.getPaymentTokenSecret());
    const pair = await this.paymentRepository.findUserBookingPayment(
      userId,
      payload.bookingId,
      payload.paymentId,
    );

    if (!pair) {
      throw new ForbiddenException('Cannot access this payment');
    }

    if (
      payload.status === PaymentTranscriptStatus.SUCCESS &&
      pair.payment.status === PaymentStatus.UNPAID &&
      pair.payment.payosOrderCode
    ) {
      await this.syncPayosOrderStatus(pair.payment.payosOrderCode);
    }

    if (payload.status === PaymentTranscriptStatus.CANCEL) {
      await this.paymentRepository.cancelUserPayment(
        userId,
        payload.bookingId,
        payload.paymentId,
      );
    }

    const refreshed = await this.paymentRepository.findUserBookingPayment(
      userId,
      payload.bookingId,
      payload.paymentId,
    );

    if (!refreshed) {
      throw new NotFoundException('Payment not found');
    }

    return this.mapCheckUpdateResponse(refreshed);
  }

  private async createPaymentTranscript(
    method: PaymentMethod,
    input: {
      bookingId: number;
      paymentId: number;
      userId: number;
      locationName: string;
      locationDescription?: string | null;
      startDate: string;
      endDate: string;
      contactName: string;
      contactPhone: string;
      contactEmail: string;
      totalAmount: number;
    },
  ): Promise<CreatePaymentLinkResponse> {
    switch (method) {
      case PaymentMethod.PAYOS:
        return await this.payosService.createPaymentLink({
          orderCode: input.paymentId,
          amount: input.totalAmount,
          description: `Booking ${input.paymentId}`,
          buyerName: input.contactName,
          buyerEmail: input.contactEmail,
          buyerPhone: input.contactPhone,
          returnUrl: this.buildRedirectUrl({
            bookingId: input.bookingId,
            paymentId: input.paymentId,
            status: PaymentTranscriptStatus.SUCCESS,
          }),
          cancelUrl: this.buildRedirectUrl({
            bookingId: input.bookingId,
            paymentId: input.paymentId,
            status: PaymentTranscriptStatus.CANCEL,
          }),
          items: [
            {
              name: input.locationName,
              price: input.totalAmount,
              quantity: 1,
            },
          ],
        });
      case PaymentMethod.MOMO:
      case PaymentMethod.COD:
      default:
        throw new BadRequestException('Payment method is not supported');
    }
  }

  private async handlePayosPaymentSucceeded(data: WebhookData): Promise<void> {
    const result =
      await this.paymentRepository.recordPayosWebhookAndMarkOrderPaid(
        this.buildPayosWebhookEventKey(data),
        'payment.paid',
        data.orderCode,
      );

    await this.notifyBookingConfirmed(result);
  }

  private async syncPayosOrderStatus(orderCode: number): Promise<void> {
    const paymentLink = await this.payosService.retrievePaymentLink(orderCode);

    switch (paymentLink.status) {
      case 'PAID': {
        const result =
          await this.paymentRepository.markPayosOrderPaid(orderCode);
        await this.notifyBookingConfirmed(result);
        break;
      }
      case 'CANCELLED':
        await this.paymentRepository.markPayosOrderCancelled(orderCode);
        break;
      case 'EXPIRED':
        await this.paymentRepository.markPayosOrderExpired(orderCode);
        break;
      default:
        break;
    }
  }

  private buildPayosWebhookEventKey(data: WebhookData): string {
    return `${data.paymentLinkId}:${data.reference || data.orderCode}`;
  }

  private async notifyBookingConfirmed(result: {
    transitioned: boolean;
    userId?: number;
    bookingId?: number;
  }): Promise<void> {
    if (!result.transitioned || !result.userId || !result.bookingId) {
      return;
    }

    await this.notificationService.createMany([
      {
        userId: result.userId,
        title: 'Booking confirmed',
        message: `Thanh toan thanh cong cho booking #${result.bookingId}.`,
      },
    ]);
  }

  private buildRedirectUrl(payload: PaymentRedirectTokenPayload): string {
    const webUrl = 'http://localhost:3000'; // TODO: get from config

    const token = encryptObject(payload, this.getPaymentTokenSecret());

    return `${webUrl.replace(/\/+$/g, '')}/checkout/${token}`;
  }

  private getPaymentTokenSecret(): string {
    const secret = this.configService.get<string>('PAYMENT_TOKEN_SECRET');

    if (!secret) {
      throw new InternalServerErrorException('Missing PAYMENT_TOKEN_SECRET');
    }

    return secret;
  }

  private normalizeCheckoutPayload(
    payload: CheckoutPaymentRequestDto,
  ): Required<Omit<CheckoutPaymentRequestDto, 'note'>> & {
    note?: string | null;
  } {
    const input = payload as unknown as Record<string, unknown>;
    const startDate = this.readDate(input.startDate, 'startDate');
    const endDate = this.readDate(input.endDate, 'endDate');

    if (new Date(`${endDate}T00:00:00.000Z`) <= new Date(`${startDate}T00:00:00.000Z`)) {
      throw new BadRequestException('endDate must be after startDate');
    }

    return {
      locationId: this.readPositiveInteger(input.locationId, 'locationId'),
      startDate,
      endDate,
      guestCount: this.readPositiveInteger(input.guestCount, 'guestCount'),
      contactName: this.readRequiredString(
        input.contactName,
        'contactName',
        MAX_CONTACT_LENGTH,
      ),
      contactPhone: this.readRequiredString(
        input.contactPhone,
        'contactPhone',
        MAX_PHONE_LENGTH,
      ),
      contactEmail: this.readEmail(input.contactEmail),
      note: this.readOptionalString(input.note, MAX_NOTE_LENGTH),
    };
  }

  private readDate(value: unknown, fieldName: string): string {
    if (typeof value !== 'string' || !/^\d{4}-\d{2}-\d{2}$/.test(value)) {
      throw new BadRequestException(`${fieldName} must use YYYY-MM-DD format`);
    }

    const date = new Date(`${value}T00:00:00.000Z`);

    if (Number.isNaN(date.getTime())) {
      throw new BadRequestException(`${fieldName} is invalid`);
    }

    return value;
  }

  private readPositiveInteger(value: unknown, fieldName: string): number {
    const numberValue = Number(value);

    if (!Number.isInteger(numberValue) || numberValue <= 0) {
      throw new BadRequestException(`${fieldName} must be a positive integer`);
    }

    return numberValue;
  }

  private readRequiredString(
    value: unknown,
    fieldName: string,
    maxLength: number,
  ): string {
    if (typeof value !== 'string' || !value.trim()) {
      throw new BadRequestException(`${fieldName} is required`);
    }

    const trimmed = value.trim();

    if (trimmed.length > maxLength) {
      throw new BadRequestException(`${fieldName} is too long`);
    }

    return trimmed;
  }

  private readOptionalString(
    value: unknown,
    maxLength: number,
  ): string | null {
    if (value === undefined || value === null || value === '') {
      return null;
    }

    if (typeof value !== 'string') {
      throw new BadRequestException('note is invalid');
    }

    const trimmed = value.trim();

    if (trimmed.length > maxLength) {
      throw new BadRequestException('note is too long');
    }

    return trimmed || null;
  }

  private readEmail(value: unknown): string {
    const email = this.readRequiredString(
      value,
      'contactEmail',
      MAX_CONTACT_LENGTH,
    );

    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      throw new BadRequestException('contactEmail is invalid');
    }

    return email;
  }

  private mapCheckUpdateResponse(pair: {
    booking: { id: number; status: any };
    payment: {
      id: number;
      status: any;
      amount: number;
      currency: string;
      checkoutUrl?: string | null;
      qrCode?: string | null;
    };
  }): PaymentCheckUpdateResponseDto {
    return {
      bookingId: pair.booking.id,
      paymentId: pair.payment.id,
      bookingStatus: pair.booking.status,
      paymentStatus: pair.payment.status,
      amount: pair.payment.amount,
      currency: pair.payment.currency,
      checkoutUrl: pair.payment.checkoutUrl,
      qrCode: pair.payment.qrCode,
    };
  }
}
