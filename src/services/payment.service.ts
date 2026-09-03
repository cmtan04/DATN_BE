import {
  BadRequestException,
  Injectable,
  InternalServerErrorException,
  NotFoundException,
} from '@nestjs/common';
import { EventEmitter2 } from '@nestjs/event-emitter';
import { ConfigService } from '@nestjs/config';
import { EntityManager, DataSource, FindOptionsWhere } from 'typeorm';
import { BookingStatus, PaymentStatus } from '@/assets/enum/payment.enum';
import { CheckoutPaymentResponseDto } from '@/dtos/payment/payment.dto';
import { PaymentRepository } from '@/repositories/payment.repository';
import { PaymentPricingService } from '@/services/payment-pricing.service';
import { TBPayment } from '@/entities/payment.entity';
import { TBBooking } from '@/entities/booking.entity';
import { TBRefundRequest } from '@/entities/refund_request.entity';
import { PayOSService } from '@/services/payos.service';
import { MailService } from '@/services/mail.service';
import { getBankNameByBin } from '@/utils/vietqr-bank.util';
import type { CreatePaymentLinkResponse } from '@payos/node';

@Injectable()
export class PaymentService {
  constructor(
    private readonly paymentRepository: PaymentRepository,
    private readonly pricingService: PaymentPricingService,
    private readonly configService: ConfigService,
    private readonly payOSService: PayOSService,
    private readonly mailService: MailService,
    private readonly eventEmitter: EventEmitter2,
    private readonly dataSource: DataSource,
  ) {}

  // ─── Lookup methods (wrap repo) ──────────────────────────────

  public async findExistingUnpaidPayment(
    bookingId: number,
  ): Promise<TBPayment | null> {
    return await this.paymentRepository.findExistingUnpaidPayment(bookingId);
  }

  /**
   * Tìm payment theo bookingId
   * @param bookingId
   * @returns
   */
  public async findPaymentByBookingId(bookingId: number): Promise<TBPayment> {
    const payment =
      await this.paymentRepository.findPaymentByBookingId(bookingId);
    if (!payment) {
      throw new NotFoundException('Payment not found');
    }
    return payment;
  }

  /**
   * Tìm payment theo orderCode
   * @param orderCode
   * @returns
   */
  public async findPaymentByOrderCode(
    orderCode: number,
  ): Promise<TBPayment | null> {
    return await this.paymentRepository.findPaymentByOrderCode(orderCode);
  }

  public async findBookingByCodeAndUser(
    bookingCode: string,
    userId: number,
  ): Promise<TBBooking | null> {
    return await this.paymentRepository.findBookingByCodeAndUser(
      bookingCode,
      userId,
    );
  }

  public async findBookingById(bookingId: number): Promise<TBBooking | null> {
    return await this.paymentRepository.findBookingById(bookingId);
  }

  public async findWebhookEvent(payosEventKey: string): Promise<any | null> {
    return await this.paymentRepository.findWebhookEvent(payosEventKey);
  }

  // ─── Write methods (wrap repo) ──────────────────────────────

  public async updatePaymentStatus(
    where: FindOptionsWhere<TBPayment>,
    status: PaymentStatus,
  ): Promise<void> {
    try {
      await this.paymentRepository.updatePayment(where, status);
    } catch (error) {
      throw new InternalServerErrorException('Error updating payment status');
    }
  }

  public async savePayment(
    payment: TBPayment,
    manager?: EntityManager,
  ): Promise<TBPayment> {
    return await this.paymentRepository.savePayment(payment, manager);
  }

  public async createAndSaveWebhookEvent(
    payosEventKey: string,
    type: string,
  ): Promise<void> {
    await this.paymentRepository.createAndSaveWebhookEvent(payosEventKey, type);
  }

  public async updatePaymentCheckoutDetails(
    paymentId: number,
    payosOrderCode: number,
    payosQrCode: string,
  ): Promise<void> {
    await this.paymentRepository.updatePaymentCheckoutDetails(
      paymentId,
      payosOrderCode,
      payosQrCode,
    );
  }

  // ─── Business logic methods ──────────────────

  public async getBookingDeposit(booking: TBBooking): Promise<number> {
    const location = await this.paymentRepository.findLocationById(
      booking.locationId,
    );

    if (!location) {
      throw new NotFoundException('Địa điểm không tồn tại');
    }

    const calculatedTotal = this.pricingService.calculateLocationAmount(
      Number(location.price),
      booking.startDate,
      booking.endDate,
      booking.roomNumber,
    );
    return Math.round(calculatedTotal);
  }

  public async createPayment(
    userId: number,
    booking: TBBooking,
    depositAmount?: number,
    manager?: EntityManager,
  ): Promise<TBPayment> {
    const repo = manager
      ? manager.getRepository(TBPayment)
      : this.dataSource.getRepository(TBPayment);
    const pendingPayment: Partial<TBPayment> = {
      userId,
      bookingId: booking.id,
      amount: depositAmount,
      status: PaymentStatus.UNPAID,
    };
    return await repo.save(pendingPayment);
  }

  public async sendConfirmationEmailAsync(booking: TBBooking): Promise<void> {
    try {
      const userEmail = await this.paymentRepository.findUserEmail(
        booking.userId,
      );
      if (!userEmail) return;

      const location = await this.paymentRepository.findLocationById(
        booking.locationId,
      );
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
        userEmail,
        '[Ownerings] Xác nhận đặt phòng thành công',
        htmlContent,
      );
    } catch (error) {
      console.error('Error sending confirmation email:', error);
    }
  }

  /**
   * Emit SSE event cho realtime payment status update.
   */
  public emitPaymentEvent(
    paymentId: number,
    data: {
      paymentId: number;
      bookingId: number;
      paymentStatus: PaymentStatus;
      bookingStatus: BookingStatus;
    },
  ): void {
    this.eventEmitter.emit(`payment.${paymentId}`, data);
  }

  async createAndSaveRefundRequest(
    refundRequest: Partial<TBRefundRequest>,
  ): Promise<TBRefundRequest> {
    try {
      return await this.paymentRepository.createAndSaveRefundRequest(
        refundRequest,
      );
    } catch (error) {
      throw new InternalServerErrorException('Lỗi khi tạo yêu cầu hoàn tiền');
    }
  }
}
