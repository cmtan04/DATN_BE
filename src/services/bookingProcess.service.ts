import {
  Injectable,
  Logger,
  BadRequestException,
  NotFoundException,
  InternalServerErrorException,
  HttpException,
  HttpStatus,
} from '@nestjs/common';
import { Cron, CronExpression } from '@nestjs/schedule';
import { DataSource, In } from 'typeorm';
import { PayOSService } from '@/services/payos.service';
import { PaymentService } from '@/services/payment.service';
import { BookingService } from '@/services/booking.service';
import {
  CheckoutPaymentRequestDto,
  CheckoutPaymentResponseDto,
  CancelBookingRequestDto,
  CancelBookingResponseDto,
} from '@/dtos/booking-process.dto';
import {
  BookingStatus,
  PaymentStatus,
  RefundStatus,
} from '@/assets/enum/payment.enum';
import { getDateRange, formatDateString } from '@/utils/date.util';
import { TBBooking } from '@/entities/booking.entity';
import { TBPayment } from '@/entities/payment.entity';
import { Webhook } from '@payos/node';
import { UserService } from './user.service';
import { User } from '@dtos/user/user.dto';
import { Transactional } from 'typeorm-transactional';
import { calculateRefundPercentage } from '@/utils/refund.util';
@Injectable()
export class BookingProcessService {
  private readonly logger = new Logger(BookingProcessService.name);

  constructor(
    private readonly dataSource: DataSource,
    private readonly bookingService: BookingService,
    private readonly paymentService: PaymentService,
    private readonly payOSService: PayOSService,
    private readonly userService: UserService,
  ) {}

  // ─── Checkout Flow ──────────────────────────────
  public async createCheckout(
    userId: number,
    payload: CheckoutPaymentRequestDto,
  ): Promise<CheckoutPaymentResponseDto> {
    // BƯỚC 1: Xử lý DB trong 1 Transaction ngắn (Tạo Payment tạm & Update Booking)
    const { booking, payment, buyer } = await this.prepareCheckoutData(
      userId,
      payload,
    );

    // BƯỚC 2: Transaction DB ĐÃ ĐÓNG! Bây giờ thoải mái gọi API PayOS (An toàn 100%)
    try {
      const payosResponse = await this.payOSService.createPaymentLink({
        orderCode: payment.id,
        amount: payment.amount,
        description: booking.bookingCode.replace('-', ''),
        buyerName: buyer.profile.fullName,
        buyerEmail: buyer.email,
        buyerPhone: buyer.profile.phoneNumber,
        returnUrl: '',
        cancelUrl: '',
        items: [
          {
            name: `Thanh toán cọc (15%) - #${booking.bookingCode}`.substring(
              0,
              255,
            ),
            quantity: 1,
            price: payment.amount,
          },
        ],
      });
      await this.paymentService.updatePaymentCheckoutDetails(
        payment.id,
        payosResponse.orderCode,
        payosResponse.qrCode,
      );

      return payosResponse;
    } catch (error) {
      this.logger.error('Error creating PayOS payment link:', error);
      throw new InternalServerErrorException(
        'Không thể kết nối với cổng thanh toán PayOS',
      );
    }
  }

  @Transactional()
  private async prepareCheckoutData(
    userId: number,
    payload: CheckoutPaymentRequestDto,
  ): Promise<{ booking: TBBooking; payment: TBPayment; buyer: User }> {
    const booking = await this.bookingService.findBooking({
      bookingCode: payload.bookingCode,
      userId: userId,
    });

    if (
      booking.status !== BookingStatus.CREATED &&
      booking.status !== BookingStatus.PENDING_PAYMENT
    ) {
      throw new BadRequestException(
        'Booking không ở trạng thái có thể thanh toán',
      );
    }

    const depositAmount = await this.paymentService.getBookingDeposit(booking);
    const buyer = await this.userService.getCurrentUser(userId);

    await this.bookingService.updateBookingStatus(
      booking.id,
      BookingStatus.PENDING_PAYMENT,
      payload.note,
    );

    const payment = await this.paymentService.createPayment(
      userId,
      booking,
      depositAmount,
    );

    return { booking, payment, buyer };
  }
  // ─── Webhook Flow ──────────────────────────────

  public async handleWebhook(webhookBody: Webhook): Promise<any> {
    // 1. Verify webhook từ payOS
    try {
      const webhookData = await this.payOSService.verifyWebhook(webhookBody);

      // 2. Xử lý Webhook Test từ Dashboard payOS
      if (webhookData.orderCode === 123) {
        return { message: 'Webhook test received successfully' };
      }

      // 3. Kiểm tra trùng lặp Webhook (Idempotency Key)
      const transactionTime = webhookData.transactionDateTime;
      const payosEventKey = `${webhookData.orderCode}_${transactionTime}`;

      const existingEvent =
        await this.paymentService.findWebhookEvent(payosEventKey);
      if (existingEvent) {
        return { message: 'Webhook already processed' };
      }

      // 4. Tìm Payment & Booking
      const payment = await this.paymentService.findPaymentByOrderCode(
        webhookData.orderCode,
      );
      if (!payment) {
        return { message: 'Payment not found, skipping' };
      }

      const booking = await this.bookingService.findBooking({
        id: payment.bookingId,
      });
      if (!booking) {
        throw new NotFoundException('Booking not found');
      }

      const isSuccess = webhookData.code === '00';

      // 5. THỰC THI TRANSACTION (Sạch vẽ, không cần entityManager!)
      await this.processWebhookTransaction(
        payosEventKey,
        webhookBody.desc || 'payment_webhook',
        isSuccess,
        payment,
        booking,
      );

      // 6. Xử lý Side-effects SAU KHI Transaction đã COMMIT thành công
      const newPaymentStatus = isSuccess
        ? PaymentStatus.PAID
        : PaymentStatus.FAILED;
      const newBookingStatus = isSuccess
        ? BookingStatus.CONFIRMED
        : BookingStatus.CANCELLED;

      // Emit SSE event
      this.paymentService.emitPaymentEvent(payment.id, {
        paymentId: payment.id,
        bookingId: booking.id,
        paymentStatus: newPaymentStatus,
        bookingStatus: newBookingStatus,
      });

      // Gửi email xác nhận
      if (isSuccess) {
        booking.status = BookingStatus.CONFIRMED;
        this.paymentService.sendConfirmationEmailAsync(booking);
      }

      return { message: 'Webhook processed successfully' };
    } catch (error) {
      this.logger.error(error);
      throw new HttpException('Lỗi mẹ rồi', HttpStatus.BAD_REQUEST);
    }
  }

  @Transactional()
  private async processWebhookTransaction(
    payosEventKey: string,
    description: string,
    isSuccess: boolean,
    payment: TBPayment,
    booking: TBBooking,
  ): Promise<void> {
    // Đánh dấu Webhook đã xử lý
    await this.paymentService.createAndSaveWebhookEvent(
      payosEventKey,
      description,
    );
    if (isSuccess) {
      // Update payment status: PAID
      await this.paymentService.updatePaymentStatus(
        { id: payment.id },
        PaymentStatus.PAID,
      );

      // Update booking status: CONFIRMED
      await this.bookingService.updateBookingStatus(
        booking.id,
        BookingStatus.CONFIRMED,
      );
    } else {
      // Update payment status: FAILED
      await this.paymentService.updatePaymentStatus(
        { id: payment.id },
        PaymentStatus.FAILED,
      );

      // Update booking status: CANCELLED
      await this.bookingService.updateBookingStatus(
        booking.id,
        BookingStatus.CANCELLED,
        'Thanh toán thất bại',
      );

      // Hoàn trả phòng
      const dateStrings = getDateRange(booking.startDate, booking.endDate).map(
        (d) => formatDateString(d),
      );

      await this.bookingService.restoreAvailabilities(
        booking.locationId,
        dateStrings,
        booking.roomNumber,
      );
    }
  }

  // ─── Cancel Booking Flow ──────────────────────────────
  public async cancelBooking(
    payload: CancelBookingRequestDto,
    userId: number,
  ): Promise<CancelBookingResponseDto> {
    // 1. Tìm Booking & Validate điều kiện
    const booking = await this.bookingService.findBooking({
      bookingCode: payload.bookingCode,
      userId,
    });

    this.bookingService.validateBookingCanBeCancelled(booking.status);

    const dateStrings = getDateRange(booking.startDate, booking.endDate).map(
      (d) => formatDateString(d),
    );

    // 2. Tìm Payment tương ứng
    const payment = await this.paymentService.findPaymentByBookingId(
      booking.id,
    );

    const isPaid =
      booking.status === BookingStatus.CONFIRMED ||
      payment?.status === PaymentStatus.PAID;

    //Neu chua thanh toan: Hủy Booking + Hủy link PayOS
    if (!isPaid) {
      if (payment?.payosOrderCode) {
        try {
          await this.payOSService.cancelPaymentLink(
            payment.payosOrderCode,
            payload.reason || 'Khách hàng hủy đặt phòng',
          );
        } catch (error) {
          console.warn('Không thể hủy link PayOS:', error.message);
        }
      }
      return await this.handleUnpaidCancellation(
        booking,
        payment,
        payload,
        dateStrings,
      );
    }

    // Neu da thanh toan: Tạo yêu cầu hoàn tiền
    return await this.handlePaidCancellation(
      booking,
      payment,
      payload,
      userId,
      dateStrings,
    );
  }

  /**
   * TRANSACTION 1: Xử lý Hủy đơn chưa thanh toán
   */
  @Transactional()
  private async handleUnpaidCancellation(
    booking: TBBooking,
    payment: TBPayment | null,
    payload: CancelBookingRequestDto,
    dateStrings: string[],
  ): Promise<CancelBookingResponseDto> {
    await this.bookingService.updateBookingStatus(
      booking.id,
      BookingStatus.CANCELLED,
      payload.reason || 'Hủy bởi người dùng',
    );

    if (payment) {
      await this.paymentService.updatePaymentStatus(
        { id: payment.id },
        PaymentStatus.CANCELLED,
      );
    }

    await this.bookingService.restoreAvailabilities(
      booking.locationId,
      dateStrings,
      booking.roomNumber,
    );

    return {
      bookingCode: booking.bookingCode,
      bookingStatus: BookingStatus.CANCELLED,
      paymentStatus: PaymentStatus.CANCELLED,
      refundAmount: 0,
      cancellationFee: 0,
      refundPercentage: 0,
      refundRequestId: null,
      message: 'Hủy đặt phòng thành công.',
    };
  }

  /**
   * TRANSACTION 2: Xử lý Hủy đơn đã thanh toán (Tạo Request Hoàn Tiền)
   */
  @Transactional()
  private async handlePaidCancellation(
    booking: TBBooking,
    payment: TBPayment | null,
    payload: CancelBookingRequestDto,
    userId: number,
    dateStrings: string[],
  ): Promise<CancelBookingResponseDto> {
    this.bookingService.validateBankDetails(payload);

    const refundPercentage = calculateRefundPercentage(booking.startDate);
    const totalAmount = Number(booking.totalAmount || 0);
    const refundAmount = Math.round((totalAmount * refundPercentage) / 100);
    const cancellationFee = totalAmount - refundAmount;

    const paymentStatus =
      refundPercentage > 0
        ? PaymentStatus.REFUND_PENDING
        : PaymentStatus.CANCELLED;

    await this.bookingService.updateBookingStatus(
      booking.id,
      BookingStatus.CANCELLED,
      payload.reason || 'Hủy bởi người dùng (Đã thanh toán)',
    );

    if (payment) {
      await this.paymentService.updatePaymentStatus(
        { id: payment.id },
        paymentStatus,
      );
    }

    await this.bookingService.restoreAvailabilities(
      booking.locationId,
      dateStrings,
      booking.roomNumber,
    );

    const refundRequest = await this.paymentService.createAndSaveRefundRequest({
      userId,
      bookingId: booking.id,
      paymentId: payment ? payment.id : 0,
      totalAmount,
      refundAmount,
      cancellationFee,
      refundPercentage,
      bankName: payload.bankName,
      accountNumber: payload.accountNumber,
      accountHolder: payload.accountHolder,
      reason: payload.reason,
      status: RefundStatus.PENDING,
    });

    const message =
      refundPercentage > 0
        ? `Hủy đặt phòng thành công. Yêu cầu hoàn tiền ${refundPercentage}% (${refundAmount.toLocaleString('vi-VN')} VND) đã được ghi nhận và đang chờ xử lý.`
        : 'Hủy đặt phòng thành công. Booking hủy dưới 1 ngày / trong ngày check-in không thuộc diện hoàn tiền.';

    return {
      bookingCode: booking.bookingCode,
      bookingStatus: BookingStatus.CANCELLED,
      paymentStatus,
      refundAmount,
      cancellationFee,
      refundPercentage,
      refundRequestId: refundRequest.id,
      message,
    };
  }

  // ─── Cron: Handle Expired Bookings ──────────────────────────────

  @Cron(CronExpression.EVERY_MINUTE)
  async handleExpiredBookings(): Promise<void> {
    const expirationTime = new Date(Date.now() - 17 * 60 * 1000);
    const expiredBookings =
      await this.bookingService.findExpiredBookings(expirationTime);

    if (!expiredBookings || expiredBookings.length === 0) {
      return;
    }

    let successCount = 0;
    let failCount = 0;

    // Lặp qua từng booking và xử lý ĐỘC LẬP
    for (const booking of expiredBookings) {
      try {
        // Mỗi lần gọi hàm này là MỘT TRANSACTION RIÊNG BIỆT
        await this.expireSingleBooking(booking);
        successCount++;
      } catch (error) {
        failCount++;
        // Ghi log lỗi của đơn này nhưng KHÔNG LÀM CHẾT vòng lặp
        this.logger.error(
          `Lỗi khi hủy đơn hết hạn ID #${booking.id} (Mã: ${booking.bookingCode}): ${error.message}`,
        );
      }
    }

    this.logger.log(
      `Quét đơn hết hạn hoàn tất: ${successCount} thành công, ${failCount} thất bại.`,
    );
  }

  /**
   * TRANSACTION RIÊNG CHO TỪNG BOOKING:
   * Nếu đơn này lỗi, chỉ rollback đúng 1 đơn này,
   * KHÔNG ảnh hưởng đến các đơn khác trong danh sách!
   */
  @Transactional()
  private async expireSingleBooking(booking: TBBooking): Promise<void> {
    // 1. Update Booking -> EXPIRED
    await this.bookingService.updateBookingStatus(
      booking.id,
      BookingStatus.EXPIRED,
      'Hết hạn thời gian thanh toán',
    );

    // 2. Update Payment -> CANCELLED
    await this.paymentService.updatePaymentStatus(
      { bookingId: booking.id },
      PaymentStatus.CANCELLED,
    );

    // 3. Hoàn lại số lượng phòng
    const dates = getDateRange(booking.startDate, booking.endDate);
    const dateStrings = dates.map((d) => formatDateString(d));

    await this.bookingService.restoreAvailabilities(
      booking.locationId,
      dateStrings,
      booking.roomNumber,
    );
  }
}
