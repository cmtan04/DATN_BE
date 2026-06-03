import {
  BookingStatus,
  PaymentMethod,
  PaymentStatus,
} from '@assets/enum/payment.enum';
import { TBBooking } from '@/entities/booking.entity';
import { TBLocation } from '@/entities/location/location.entity';
import { TBPayosWebhookEvent } from '@/entities/payos-webhook-event.entity';
import { TBPayment } from '@/entities/payment.entity';
import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { DataSource, EntityManager, Repository } from 'typeorm';

export interface CreatePendingBookingPaymentInput {
  userId: number;
  locationId: number;
  startDate: string;
  endDate: string;
  guestCount: number;
  contactName: string;
  contactPhone: string;
  contactEmail: string;
  note?: string | null;
  amount: number;
  currency: string;
}

export interface BookingPaymentPair {
  booking: TBBooking;
  payment: TBPayment;
}

export interface PaymentTransitionResult {
  transitioned: boolean;
  userId?: number;
  bookingId?: number;
  paymentId?: number;
}

@Injectable()
export class PaymentRepository {
  constructor(
    private readonly dataSource: DataSource,
    @InjectRepository(TBBooking)
    private readonly bookingRepository: Repository<TBBooking>,
    @InjectRepository(TBPayment)
    private readonly paymentRepository: Repository<TBPayment>,
    @InjectRepository(TBLocation)
    private readonly locationRepository: Repository<TBLocation>,
  ) {}

  public async findLocationForBooking(
    locationId: number,
  ): Promise<TBLocation | null> {
    return await this.locationRepository.findOne({ where: { id: locationId } });
  }

  public async hasConfirmedBookingOverlap(
    locationId: number,
    startDate: string,
    endDate: string,
  ): Promise<boolean> {
    const count = await this.bookingRepository
      .createQueryBuilder('booking')
      .where('booking.locationId = :locationId', { locationId })
      .andWhere('booking.status = :status', {
        status: BookingStatus.CONFIRMED,
      })
      .andWhere('booking.startDate < :endDate', { endDate })
      .andWhere('booking.endDate > :startDate', { startDate })
      .getCount();

    return count > 0;
  }

  public async createPendingBookingAndPayment(
    input: CreatePendingBookingPaymentInput,
  ): Promise<BookingPaymentPair> {
    return await this.dataSource.transaction(async (manager) => {
      const bookingRepository = manager.getRepository(TBBooking);
      const paymentRepository = manager.getRepository(TBPayment);

      const booking = await bookingRepository.save(
        bookingRepository.create({
          userId: input.userId,
          locationId: input.locationId,
          startDate: input.startDate,
          endDate: input.endDate,
          guestCount: input.guestCount,
          contactName: input.contactName,
          contactPhone: input.contactPhone,
          contactEmail: input.contactEmail,
          note: input.note ?? null,
          status: BookingStatus.PENDING_PAYMENT,
          totalAmount: input.amount,
          currency: input.currency,
        }),
      );
      const payment = await paymentRepository.save(
        paymentRepository.create({
          userId: input.userId,
          bookingId: booking.id,
          method: PaymentMethod.PAYOS,
          amount: input.amount,
          currency: input.currency,
          status: PaymentStatus.UNPAID,
        }),
      );

      return { booking, payment };
    });
  }

  public async attachPayosPaymentLink(
    paymentId: number,
    payosOrderCode: number,
    payosPaymentLinkId: string,
    checkoutUrl: string,
    qrCode: string,
  ): Promise<void> {
    await this.paymentRepository.update(paymentId, {
      payosOrderCode,
      payosPaymentLinkId,
      checkoutUrl,
      qrCode,
    });
  }

  public async markCheckoutCreationFailed(
    bookingId: number,
    paymentId: number,
  ): Promise<void> {
    await this.dataSource.transaction(async (manager) => {
      await manager.getRepository(TBPayment).update(
        { id: paymentId, status: PaymentStatus.UNPAID },
        { status: PaymentStatus.FAILED },
      );
      await manager.getRepository(TBBooking).update(
        { id: bookingId, status: BookingStatus.PENDING_PAYMENT },
        { status: BookingStatus.CANCELLED },
      );
    });
  }

  public async findUserBookingPayment(
    userId: number,
    bookingId: number,
    paymentId: number,
  ): Promise<BookingPaymentPair | null> {
    const payment = await this.paymentRepository.findOne({
      where: { id: paymentId, bookingId, userId },
    });

    if (!payment) {
      return null;
    }

    const booking = await this.bookingRepository.findOne({
      where: { id: bookingId, userId },
    });

    if (!booking) {
      return null;
    }

    return { booking, payment };
  }

  public async markPayosOrderPaid(
    orderCode: number,
  ): Promise<PaymentTransitionResult> {
    return await this.dataSource.transaction(async (manager) =>
      this.markPayosOrderPaidInManager(manager, orderCode),
    );
  }

  public async markPayosOrderCancelled(
    orderCode: number,
  ): Promise<PaymentTransitionResult> {
    return await this.dataSource.transaction(async (manager) =>
      this.markPayosOrderTerminalStatusInManager(
        manager,
        orderCode,
        PaymentStatus.CANCELLED,
        BookingStatus.CANCELLED,
      ),
    );
  }

  public async markPayosOrderExpired(
    orderCode: number,
  ): Promise<PaymentTransitionResult> {
    return await this.dataSource.transaction(async (manager) =>
      this.markPayosOrderTerminalStatusInManager(
        manager,
        orderCode,
        PaymentStatus.EXPIRED,
        BookingStatus.EXPIRED,
      ),
    );
  }

  public async recordPayosWebhookAndMarkOrderPaid(
    eventKey: string,
    eventType: string,
    orderCode: number,
  ): Promise<PaymentTransitionResult> {
    return await this.dataSource.transaction(async (manager) => {
      const isNewEvent = await this.insertWebhookEvent(
        manager,
        eventKey,
        eventType,
      );

      if (!isNewEvent) {
        return { transitioned: false };
      }

      return await this.markPayosOrderPaidInManager(manager, orderCode);
    });
  }

  public async recordPayosWebhookAndExpireOrder(
    eventKey: string,
    eventType: string,
    orderCode: number,
  ): Promise<PaymentTransitionResult> {
    return await this.dataSource.transaction(async (manager) => {
      const isNewEvent = await this.insertWebhookEvent(
        manager,
        eventKey,
        eventType,
      );

      if (!isNewEvent) {
        return { transitioned: false };
      }

      const paymentRepository = manager.getRepository(TBPayment);
      const payment = await paymentRepository.findOne({
        where: { payosOrderCode: orderCode },
      });

      if (!payment || payment.status !== PaymentStatus.UNPAID) {
        return { transitioned: false };
      }

      const paymentUpdate = await paymentRepository.update(
        { id: payment.id, status: PaymentStatus.UNPAID },
        { status: PaymentStatus.EXPIRED },
      );

      if (!paymentUpdate.affected) {
        return { transitioned: false };
      }

      await manager.getRepository(TBBooking).update(
        { id: payment.bookingId, status: BookingStatus.PENDING_PAYMENT },
        { status: BookingStatus.EXPIRED },
      );

      return {
        transitioned: true,
        userId: payment.userId,
        bookingId: payment.bookingId,
        paymentId: payment.id,
      };
    });
  }

  public async cancelUserPayment(
    userId: number,
    bookingId: number,
    paymentId: number,
  ): Promise<void> {
    await this.dataSource.transaction(async (manager) => {
      const paymentUpdate = await manager.getRepository(TBPayment).update(
        {
          id: paymentId,
          bookingId,
          userId,
          status: PaymentStatus.UNPAID,
        },
        { status: PaymentStatus.CANCELLED },
      );

      if (!paymentUpdate.affected) {
        return;
      }

      await manager.getRepository(TBBooking).update(
        {
          id: bookingId,
          userId,
          status: BookingStatus.PENDING_PAYMENT,
        },
        { status: BookingStatus.CANCELLED },
      );
    });
  }

  private async insertWebhookEvent(
    manager: EntityManager,
    eventKey: string,
    eventType: string,
  ): Promise<boolean> {
    const webhookEventRepository = manager.getRepository(TBPayosWebhookEvent);
    const existing = await webhookEventRepository.findOne({
      where: { payosEventKey: eventKey },
    });

    if (existing) {
      return false;
    }

    await webhookEventRepository.save(
      webhookEventRepository.create({
        payosEventKey: eventKey,
        type: eventType,
        processedAt: new Date(),
      }),
    );

    return true;
  }

  private async markPayosOrderPaidInManager(
    manager: EntityManager,
    orderCode: number,
  ): Promise<PaymentTransitionResult> {
    const paymentRepository = manager.getRepository(TBPayment);
    const payment = await paymentRepository.findOne({
      where: { payosOrderCode: orderCode },
    });

    if (!payment || payment.status !== PaymentStatus.UNPAID) {
      return { transitioned: false };
    }

    const paymentUpdate = await paymentRepository.update(
      { id: payment.id, status: PaymentStatus.UNPAID },
      { status: PaymentStatus.PAID },
    );

    if (!paymentUpdate.affected) {
      return { transitioned: false };
    }

    await manager.getRepository(TBBooking).update(
      { id: payment.bookingId, status: BookingStatus.PENDING_PAYMENT },
      { status: BookingStatus.CONFIRMED },
    );

    return {
      transitioned: true,
      userId: payment.userId,
      bookingId: payment.bookingId,
      paymentId: payment.id,
    };
  }

  private async markPayosOrderTerminalStatusInManager(
    manager: EntityManager,
    orderCode: number,
    paymentStatus: PaymentStatus,
    bookingStatus: BookingStatus,
  ): Promise<PaymentTransitionResult> {
    const paymentRepository = manager.getRepository(TBPayment);
    const payment = await paymentRepository.findOne({
      where: { payosOrderCode: orderCode },
    });

    if (!payment || payment.status !== PaymentStatus.UNPAID) {
      return { transitioned: false };
    }

    const paymentUpdate = await paymentRepository.update(
      { id: payment.id, status: PaymentStatus.UNPAID },
      { status: paymentStatus },
    );

    if (!paymentUpdate.affected) {
      return { transitioned: false };
    }

    await manager.getRepository(TBBooking).update(
      { id: payment.bookingId, status: BookingStatus.PENDING_PAYMENT },
      { status: bookingStatus },
    );

    return {
      transitioned: true,
      userId: payment.userId,
      bookingId: payment.bookingId,
      paymentId: payment.id,
    };
  }
}
