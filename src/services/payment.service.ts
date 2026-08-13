import {
  BadRequestException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { EventEmitter2 } from '@nestjs/event-emitter';
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
import { BookingService } from '@/services/booking.service';
import { PaymentPricingService } from '@/services/payment-pricing.service';
import { TBPayment } from '@/entities/payment.entity';
import { TBLocation } from '@/entities/location/location.entity';
import { TBBooking } from '@/entities/booking.entity';
import { TBPayosWebhookEvent } from '@/entities/payos-webhook-event.entity';
import { TBUserDefault } from '@/entities/user/user_default.entity';
import { PayosService } from '@/services/payos.service';
import { MailService } from '@/services/mail.service';
import { decryptObject, encryptObject } from '@/utils/payment-token.util';
import { getBankNameByBin } from '@/utils/vietqr-bank.util';
import { Webhook } from '@payos/node';

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
    @InjectRepository(TBPayosWebhookEvent)
    private readonly webhookEventRepository: Repository<TBPayosWebhookEvent>,
    @InjectRepository(TBUserDefault)
    private readonly userRepository: Repository<TBUserDefault>,
    private readonly bookingRepository: BookingRepository,
    private readonly bookingService: BookingService,
    private readonly pricingService: PaymentPricingService,
    private readonly configService: ConfigService,
    private readonly payosService: PayosService,
    private readonly mailService: MailService,
    private readonly eventEmitter: EventEmitter2,
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
      payload.startDate,
      payload.endDate,
      payload.roomNumber,
    );

    const depositAmount = Math.round(totalAmount * 0.15);

    // Create Booking
    const booking = await this.bookingRepository.createBooking(
      {
        locationId: payload.locationId,
        startDate: new Date(payload.startDate),
        endDate: new Date(payload.endDate),
        roomNumber: payload.roomNumber,
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
        amount: depositAmount,
        currency: CURRENCY,
        status: PaymentStatus.UNPAID,
      }),
    );

    // Generate redirect token
    const token = this.generatePaymentToken(booking.id, payment.id, 1); // 1 = UNPAID / pending
    const webUrl =
      this.configService.get<string>('WEB_URL') || 'http://localhost:5173';
    const internalCheckoutUrl = `${webUrl.replace(/\/+$/g, '')}/checkout/${token}`;

    let finalCheckoutUrl = internalCheckoutUrl;
    const payosOrderCode = payment.id; // Using payment ID as orderCode
    const paymentDescription = `Thanh toán cọc (15%) - #${booking.id}`;
    let payosQrCode = '';
    let payosAccountName = '';
    let payosAccountNumber = '';
    let payosBankName = '';
    let payosDescription = paymentDescription;

    try {
      const payosLink = await this.payosService.createPaymentLink({
        orderCode: payosOrderCode,
        amount: depositAmount,
        description: paymentDescription,
        buyerName: payload.contactName,
        buyerEmail: payload.contactEmail,
        buyerPhone: payload.contactPhone,
        returnUrl: internalCheckoutUrl,
        cancelUrl: internalCheckoutUrl,
        items: [
          {
            name: `Thanh toán cọc (15%) - #${booking.id}`.substring(0, 255),
            quantity: 1,
            price: depositAmount,
          },
        ],
      });

      if (payosLink.checkoutUrl) {
        finalCheckoutUrl = payosLink.checkoutUrl;
      }

      if (payosLink.qrCode) {
        payosQrCode = payosLink.qrCode;
      }

      if (payosLink.accountName) {
        payosAccountName = payosLink.accountName;
      }

      if (payosLink.accountNumber) {
        payosAccountNumber = payosLink.accountNumber;
      }

      if (payosLink.bin) {
        payosBankName = getBankNameByBin(payosLink.bin);
      } else {
        payosBankName = getBankNameByBin();
      }

      if (payosLink.description) {
        payosDescription = payosLink.description;
      }
    } catch (error) {
      console.error('Failed to create PayOS payment link:', error);
      // Fallback to internal mock if PayOS fails (or could throw error)
      payosBankName = getBankNameByBin();
    }

    // Save checkoutUrl
    await this.paymentRepository.update(payment.id, {
      checkoutUrl: finalCheckoutUrl,
      payosOrderCode: payosOrderCode,
    });

    return {
      bookingId: booking.id,
      paymentId: payment.id,
      amount: depositAmount,
      checkoutUrl: finalCheckoutUrl,
      qrCode: payosQrCode,
      status: PaymentStatus.UNPAID,
      accountName: payosAccountName,
      accountNumber: payosAccountNumber,
      bankName: payosBankName,
      description: payosDescription,
    };
  }

  public async handleWebhook(webhookBody: Webhook): Promise<any> {
    const webhookData = await this.payosService.verifyWebhook(webhookBody);

    // Check idempotency
    const existingEvent = await this.webhookEventRepository.findOne({
      where: {
        payosEventKey:
          webhookData.orderCode.toString() +
          '_' +
          webhookBody.data?.transactionDateTime,
      },
    });

    if (existingEvent) {
      return { message: 'Webhook already processed' };
    }

    const payment = await this.paymentRepository.findOne({
      where: { payosOrderCode: webhookData.orderCode },
    });

    if (!payment) {
      throw new NotFoundException('Payment not found');
    }

    const booking = await this.bookingEntityRepository.findOne({
      where: { id: payment.bookingId },
    });

    if (!booking) {
      throw new NotFoundException('Booking not found');
    }

    if (webhookData.code === '00') {
      payment.status = PaymentStatus.PAID;
      booking.status = BookingStatus.CONFIRMED;

      // Send confirmation email asynchronously
      void this.sendConfirmationEmailAsync(booking);
    } else {
      payment.status = PaymentStatus.FAILED;
      booking.status = BookingStatus.CANCELLED;
    }

    await this.paymentRepository.save(payment);
    await this.bookingEntityRepository.save(booking);

    // Emit SSE event for realtime payment status update
    this.eventEmitter.emit(`payment.${payment.id}`, {
      paymentId: payment.id,
      bookingId: booking.id,
      paymentStatus: payment.status,
      bookingStatus: booking.status,
    });

    await this.webhookEventRepository.save(
      this.webhookEventRepository.create({
        payosEventKey:
          webhookData.orderCode.toString() +
          '_' +
          webhookBody.data?.transactionDateTime,
        type: webhookBody.desc || 'payment_webhook',
        processedAt: new Date(),
      }),
    );

    return { message: 'Webhook processed successfully' };
  }

  public async checkUpdate(
    userId: number,
    token: string,
    cancel?: string,
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

    if (cancel === 'true' && booking.status !== BookingStatus.CANCELLED) {
      await this.bookingService.cancelBooking(
        { bookingCode: booking.bookingCode, reason: 'Hủy thanh toán PayOS' },
        userId,
      );
      booking.status = BookingStatus.CANCELLED;
      payment.status = PaymentStatus.CANCELLED;
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

    // Emit SSE event for realtime payment status update
    this.eventEmitter.emit(`payment.${payment.id}`, {
      paymentId: payment.id,
      bookingId: booking.id,
      paymentStatus: payment.status,
      bookingStatus: booking.status,
    });

    // Send confirmation email asynchronously
    void this.sendConfirmationEmailAsync(booking);

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

  private async sendConfirmationEmailAsync(booking: TBBooking): Promise<void> {
    try {
      const user = await this.userRepository.findOne({
        where: { id: booking.userId },
      });
      if (!user?.email) return;

      const location = await this.locationRepository.findOne({
        where: { id: booking.locationId },
      });
      const locationName = location ? location.name : 'Unknown Location';

      const htmlContent = `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: auto; padding: 20px; border: 1px solid #ddd; border-radius: 10px;">
          <h2 style="color: #4caf50; text-align: center;">ĐẶT PHÒNG THÀNH CÔNG</h2>
          <p>Xin chào,</p>
          <p>Cảm ơn bạn đã đặt phòng qua hệ thống của chúng tôi. Dưới đây là thông tin chi tiết về đặt phòng của bạn:</p>
          <ul style="list-style-type: none; padding: 0;">
            <li style="margin-bottom: 10px;"><b>Mã đặt phòng:</b> <span style="color: #1a73e8;">${booking.bookingCode}</span></li>
            <li style="margin-bottom: 10px;"><b>Địa điểm:</b> ${locationName}</li>
            <li style="margin-bottom: 10px;"><b>Số lượng phòng:</b> ${booking.roomNumber}</li>
            <li style="margin-bottom: 10px;"><b>Ngày nhận phòng:</b> ${new Date(booking.startDate).toLocaleDateString('vi-VN')}</li>
            <li style="margin-bottom: 10px;"><b>Ngày trả phòng:</b> ${new Date(booking.endDate).toLocaleDateString('vi-VN')}</li>
            <li style="margin-bottom: 10px;"><b>Tổng thanh toán:</b> ${booking.totalAmount.toLocaleString('vi-VN')} VND</li>
          </ul>
          <p>Nếu bạn có bất kỳ câu hỏi nào, vui lòng liên hệ với bộ phận hỗ trợ của chúng tôi.</p>
          <p style="color: #5f6368; font-size: 13px; text-align: center; margin-top: 30px;">Cảm ơn bạn đã sử dụng dịch vụ!</p>
        </div>
      `;

      await this.mailService.sendMail(
        user.email,
        '[Hostings] Xác nhận đặt phòng thành công',
        htmlContent,
      );
    } catch (error) {
      console.error('Error sending confirmation email:', error);
    }
  }
}
