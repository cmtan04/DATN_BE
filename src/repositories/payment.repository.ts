import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { EntityManager, FindOptionsWhere, Repository } from 'typeorm';
import { TBPayment } from '@/entities/payment.entity';
import { TBLocation } from '@/entities/location/location.entity';
import { TBBooking } from '@/entities/booking.entity';
import { TBPayosWebhookEvent } from '@/entities/payos-webhook-event.entity';
import { TBUserDefault } from '@/entities/user/user_default.entity';
import { TBUserProfile } from '@/entities/user/user_profile.entity';
import {
  BookingStatus,
  PaymentMethod,
  PaymentStatus,
} from '@/assets/enum/payment.enum';
import { TBRefundRequest } from '@/entities/refund_request.entity';

const CURRENCY = 'vnd';

export interface BuyerProfileInfo {
  buyerName: string;
  buyerEmail: string;
  buyerPhone: string;
}

@Injectable()
export class PaymentRepository {
  constructor(
    @InjectRepository(TBPayment)
    private readonly paymentRepository: Repository<TBPayment>,
    @InjectRepository(TBLocation)
    private readonly locationRepository: Repository<TBLocation>,
    @InjectRepository(TBBooking)
    private readonly bookingRepository: Repository<TBBooking>,
    @InjectRepository(TBPayosWebhookEvent)
    private readonly webhookEventRepository: Repository<TBPayosWebhookEvent>,
    @InjectRepository(TBUserDefault)
    private readonly userRepository: Repository<TBUserDefault>,
    @InjectRepository(TBUserProfile)
    private readonly userProfileRepository: Repository<TBUserProfile>,
    @InjectRepository(TBRefundRequest)
    private readonly refundRequestRepository: Repository<TBRefundRequest>,
  ) {}

  async findPaymentByBookingId(bookingId: number) {
    return await this.paymentRepository.findOne({ where: { bookingId } });
  }

  public async findBookingByCodeAndUser(
    bookingCode: string,
    userId: number,
    manager?: EntityManager,
  ): Promise<TBBooking | null> {
    const repo = manager
      ? manager.getRepository(TBBooking)
      : this.bookingRepository;
    return await repo.findOne({ where: { bookingCode, userId } });
  }

  public async findBookingById(
    bookingId: number,
    manager?: EntityManager,
  ): Promise<TBBooking | null> {
    const repo = manager
      ? manager.getRepository(TBBooking)
      : this.bookingRepository;
    return await repo.findOne({ where: { id: bookingId } });
  }

  public async findBookingByIdAndUser(
    bookingId: number,
    userId: number,
    manager?: EntityManager,
  ): Promise<TBBooking | null> {
    const repo = manager
      ? manager.getRepository(TBBooking)
      : this.bookingRepository;
    return await repo.findOne({ where: { id: bookingId, userId } });
  }

  public async findExistingUnpaidPayment(
    bookingId: number,
    manager?: EntityManager,
  ): Promise<TBPayment | null> {
    const repo = manager
      ? manager.getRepository(TBPayment)
      : this.paymentRepository;
    return await repo.findOne({
      where: {
        bookingId,
        status: PaymentStatus.UNPAID,
      },
      order: { createdAt: 'DESC' },
    });
  }

  public async findLocationById(
    locationId: number,
    manager?: EntityManager,
  ): Promise<TBLocation | null> {
    const repo = manager
      ? manager.getRepository(TBLocation)
      : this.locationRepository;
    return await repo.findOne({ where: { id: locationId } });
  }

  public async getBuyerProfileInfo(
    userId: number,
    manager?: EntityManager,
  ): Promise<BuyerProfileInfo> {
    const userRepo = manager
      ? manager.getRepository(TBUserDefault)
      : this.userRepository;
    const profileRepo = manager
      ? manager.getRepository(TBUserProfile)
      : this.userProfileRepository;

    const user = await userRepo.findOne({ where: { id: userId } });
    let userProfile: TBUserProfile | null = null;

    if (user?.userProfileId) {
      userProfile = await profileRepo.findOne({
        where: { id: user.userProfileId },
      });
    }

    return {
      buyerName: userProfile?.fullName || '',
      buyerEmail: user?.email || '',
      buyerPhone: userProfile?.phoneNumber || '',
    };
  }

  public async createPendingPaymentRecord(
    userId: number,
    booking: TBBooking,
    note?: string,
    depositAmount?: number,
    manager?: EntityManager,
  ): Promise<TBPayment> {
    const bookingRepo = manager
      ? manager.getRepository(TBBooking)
      : this.bookingRepository;
    const paymentRepo = manager
      ? manager.getRepository(TBPayment)
      : this.paymentRepository;

    const updateData: Partial<TBBooking> = {
      status: BookingStatus.PENDING_PAYMENT,
    };
    if (note) {
      updateData.note = note;
    }

    await bookingRepo.update({ id: booking.id }, updateData);
    booking.status = BookingStatus.PENDING_PAYMENT;

    const paymentToCreate = paymentRepo.create({
      userId,
      bookingId: booking.id,
      method: PaymentMethod.PAYOS,
      amount: depositAmount || 0,
      currency: CURRENCY,
      status: PaymentStatus.UNPAID,
    });

    return await paymentRepo.save(paymentToCreate);
  }

  public async updatePaymentCheckoutDetails(
    paymentId: number,
    payosOrderCode: number,
    payosQrCode: string,
    manager?: EntityManager,
  ): Promise<void> {
    const repo = manager
      ? manager.getRepository(TBPayment)
      : this.paymentRepository;
    await repo.update(paymentId, {
      payosOrderCode,
      qrCode: payosQrCode,
    });
  }

  public async findWebhookEvent(
    payosEventKey: string,
    manager?: EntityManager,
  ): Promise<TBPayosWebhookEvent | null> {
    const repo = manager
      ? manager.getRepository(TBPayosWebhookEvent)
      : this.webhookEventRepository;
    return await repo.findOne({ where: { payosEventKey } });
  }

  public async findPaymentByOrderCode(
    orderCode: number,
    manager?: EntityManager,
  ): Promise<TBPayment | null> {
    const repo = manager
      ? manager.getRepository(TBPayment)
      : this.paymentRepository;
    return await repo.findOne({ where: { payosOrderCode: orderCode } });
  }

  public async savePayment(
    payment: TBPayment,
    manager?: EntityManager,
  ): Promise<TBPayment> {
    const repo = manager
      ? manager.getRepository(TBPayment)
      : this.paymentRepository;
    return await repo.save(payment);
  }

  async updatePayment(
    where: FindOptionsWhere<TBPayment>,
    status: PaymentStatus,
  ): Promise<void> {
    await this.paymentRepository.update(where, { status });
  }

  public async createAndSaveWebhookEvent(
    payosEventKey: string,
    type: string,
  ): Promise<void> {
    await this.webhookEventRepository.save({
      payosEventKey,
      type,
    });
  }

  public async findUserEmail(
    userId: number,
    manager?: EntityManager,
  ): Promise<string | null> {
    const repo = manager
      ? manager.getRepository(TBUserDefault)
      : this.userRepository;
    const user = await repo.findOne({ where: { id: userId } });
    return user?.email || null;
  }

  async createAndSaveRefundRequest(
    refundRequest: Partial<TBRefundRequest>,
  ): Promise<TBRefundRequest> {
    return await this.refundRequestRepository.save(refundRequest);
  }
}
