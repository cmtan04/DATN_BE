import {
  Injectable,
  Logger,
  BadRequestException,
  NotFoundException,
} from '@nestjs/common';
import { Cron, CronExpression } from '@nestjs/schedule';
import { BookingRepository } from '@/repositories/booking.repository';
import {
  CreateBookingRequestDto,
  CreateBookingResponseDto,
  GetAvailableRoomsRequestDto,
  GetAvailableRoomsResponseDto,
  CancelBookingRequestDto,
  CancelBookingResponseDto,
} from '@/dtos/booking.dto';
import {
  BookingStatus,
  PaymentStatus,
  RefundStatus,
} from '@/assets/enum/payment.enum';
import { getDateRange, formatDateString } from '@/utils/date.util';
import { generateCode } from '@/utils/nanoID.util';
import { DataSource, In } from 'typeorm';
import { TBLocation } from '@/entities/location/location.entity';
import { TBPayment } from '@/entities/payment.entity';
import { TBRefundRequest } from '@/entities/refund_request.entity';
import { PayosService } from '@/services/payos.service';
import { TBBooking } from '@/entities/booking.entity';

@Injectable()
export class BookingService {
  private readonly logger = new Logger(BookingService.name);

  constructor(
    private readonly bookingRepository: BookingRepository,
    private readonly dataSource: DataSource,
    private readonly payosService: PayosService,
  ) {}

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

  @Cron(CronExpression.EVERY_MINUTE)
  async handleExpiredBookings() {
    try {
      const expirationTime = new Date(Date.now() - 17 * 60 * 1000); // 17 minutes ago
      const expiredBookings =
        await this.bookingRepository.findExpiredBookings(expirationTime);

      if (!expiredBookings || expiredBookings.length === 0) {
        return;
      }

      const expiredBookingIds = expiredBookings.map((b) => b.id);

      await this.dataSource.manager.transaction(
        async (transactionalEntityManager) => {
          await transactionalEntityManager.update(
            TBBooking,
            { id: In(expiredBookingIds) },
            { status: BookingStatus.EXPIRED },
          );

          await transactionalEntityManager.update(
            TBPayment,
            { bookingId: In(expiredBookingIds) },
            { status: PaymentStatus.CANCELLED },
          );

          for (const booking of expiredBookings) {
            const dates = getDateRange(booking.startDate, booking.endDate);
            const dateStrings = dates.map((d) => formatDateString(d));
            await this.bookingRepository.restoreAvailabilities(
              transactionalEntityManager,
              booking.locationId,
              dateStrings,
              booking.roomNumber,
            );
          }
        },
      );
      this.logger.log(
        `Successfully processed ${expiredBookings.length} expired bookings`,
      );
    } catch (error) {
      this.logger.error('Error cancelling expired bookings', error);
    }
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

  public async cancelBooking(
    payload: CancelBookingRequestDto,
    userId: number,
  ): Promise<CancelBookingResponseDto> {
    const booking = await this.bookingRepository.findBooking(
      payload.bookingCode,
      userId,
    );

    if (booking.status === BookingStatus.CANCELLED) {
      throw new BadRequestException('Đặt phòng đã bị hủy trước đó');
    }

    if (booking.status === BookingStatus.EXPIRED) {
      throw new BadRequestException('Đặt phòng đã hết hạn');
    }

    const date = getDateRange(booking.startDate, booking.endDate);
    const dateStrings = date.map((d) => formatDateString(d));

    return this.dataSource.manager.transaction(
      async (transactionalEntityManager) => {
        const payment = await transactionalEntityManager.findOne(TBPayment, {
          where: { bookingId: booking.id },
        });

        const isPaid =
          booking.status === BookingStatus.CONFIRMED ||
          payment?.status === PaymentStatus.PAID;

        if (!isPaid) {
          // Case 1: PENDING_PAYMENT / CREATED (Chưa thanh toán)
          if (payment?.payosOrderCode) {
            await this.payosService.cancelPaymentLink(
              payment.payosOrderCode,
              payload.reason || 'Khách hàng hủy đặt phòng',
            );
          }

          await transactionalEntityManager.update(
            TBBooking,
            { id: booking.id },
            {
              status: BookingStatus.CANCELLED,
              note: payload.reason || 'Hủy bởi người dùng',
            },
          );

          if (payment) {
            await transactionalEntityManager.update(
              TBPayment,
              { id: payment.id },
              { status: PaymentStatus.CANCELLED },
            );
          }

          await this.bookingRepository.restoreAvailabilities(
            transactionalEntityManager,
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
        } else {
          // Case 2: CONFIRMED / PAID (Đã thanh toán)
          if (
            !payload.bankName ||
            !payload.accountNumber ||
            !payload.accountHolder
          ) {
            throw new BadRequestException(
              'Vui lòng cung cấp đầy đủ thông tin ngân hàng (bankName, accountNumber, accountHolder) để nhận tiền hoàn.',
            );
          }

          const startDate = +new Date(booking.startDate);
          const now = Date.now();
          const diffDays = Math.ceil((startDate - now) / (1000 * 60 * 60 * 24));

          let refundPercentage = 0;
          if (diffDays >= 3) {
            refundPercentage = 100;
          } else if (diffDays >= 1) {
            refundPercentage = 50;
          }

          const totalAmount = Number(booking.totalAmount || 0);
          const refundAmount = Math.round(
            (totalAmount * refundPercentage) / 100,
          );
          const cancellationFee = totalAmount - refundAmount;

          const paymentStatus =
            refundPercentage > 0
              ? PaymentStatus.REFUND_PENDING
              : PaymentStatus.CANCELLED;

          await transactionalEntityManager.update(
            TBBooking,
            { id: booking.id },
            {
              status: BookingStatus.CANCELLED,
              note: payload.reason || 'Hủy bởi người dùng (Đã thanh toán)',
            },
          );

          if (payment) {
            await transactionalEntityManager.update(
              TBPayment,
              { id: payment.id },
              { status: paymentStatus },
            );
          }

          await this.bookingRepository.restoreAvailabilities(
            transactionalEntityManager,
            booking.locationId,
            dateStrings,
            booking.roomNumber,
          );

          const refundRequest = transactionalEntityManager.create(
            TBRefundRequest,
            {
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
            },
          );
          const savedRefundRequest =
            await transactionalEntityManager.save(refundRequest);

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
            refundRequestId: savedRefundRequest.id,
            message,
          };
        }
      },
    );
  }
}
