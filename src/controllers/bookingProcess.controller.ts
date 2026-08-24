import {
  Body,
  Controller,
  Param,
  ParseIntPipe,
  Post,
  Query,
  Sse,
  UnauthorizedException,
} from '@nestjs/common';
import { EventEmitter2 } from '@nestjs/event-emitter';
import { JwtService } from '@nestjs/jwt';
import { ApiTags } from '@nestjs/swagger';
import { fromEvent, map, Observable } from 'rxjs';
import {
  CheckoutPaymentRequestDto,
  CheckoutPaymentResponseDto,
  CancelBookingRequestDto,
  CancelBookingResponseDto,
} from '@/dtos/booking-process.dto';
import { BookingProcessService } from '@/services/bookingProcess.service';
import { User } from '@/common/decorators/user.decorator';
import { Public } from '@/common/decorators/public.decorator';
import { JwtPayload } from '@/dtos/jwt.dto';
import type { Webhook } from '@payos/node';

@Controller('transactions')
@ApiTags('Transactions')
export class BookingProcessController {
  constructor(
    private readonly bookingProcessService: BookingProcessService,
    private readonly eventEmitter: EventEmitter2,
    private readonly jwtService: JwtService,
  ) {}

  @Post('checkout')
  public async createCheckout(
    @User('id') userId: number,
    @Body() payload: CheckoutPaymentRequestDto,
  ): Promise<CheckoutPaymentResponseDto> {
    return await this.bookingProcessService.createCheckout(userId, payload);
  }

  @Post('webhook')
  @Public()
  public async handleWebhook(@Body() body: Webhook): Promise<any> {
    return await this.bookingProcessService.handleWebhook(body);
  }

  @Post('cancel-booking')
  public async cancelBooking(
    @User('id') userId: number,
    @Body() payload: CancelBookingRequestDto,
  ): Promise<CancelBookingResponseDto> {
    return await this.bookingProcessService.cancelBooking(payload, userId);
  }

  @Public()
  @Sse('stream')
  public streamPaymentStatus(
    @Query('paymentId', ParseIntPipe) paymentId: number,
    @Query('token') token?: string,
  ): Observable<MessageEvent> {
    console.log('PAYLOAD:', { token, paymentId });
    this.assertStreamToken(token);

    return fromEvent(this.eventEmitter, `payment.${paymentId}`).pipe(
      map(
        (data) =>
          ({
            data,
          }) as MessageEvent,
      ),
    );
  }

  private assertStreamToken(token: string | undefined): void {
    if (!token) {
      throw new UnauthorizedException('Missing stream token');
    }

    try {
      this.jwtService.verify<JwtPayload>(token);
    } catch {
      throw new UnauthorizedException('Invalid stream token');
    }
  }
}
