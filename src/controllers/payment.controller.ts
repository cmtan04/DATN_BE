import {
  Body,
  Controller,
  Get,
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
  PaymentCheckUpdateResponseDto,
} from '@/dtos/payment/payment.dto';
import { PaymentService } from '@/services/payment.service';
import { User } from '@/common/decorators/user.decorator';
import { Public } from '@/common/decorators/public.decorator';
import { JwtPayload } from '@/dtos/jwt.dto';

@Controller('payments')
@ApiTags('Payments')
export class PaymentController {
  constructor(
    private readonly paymentService: PaymentService,
    private readonly eventEmitter: EventEmitter2,
    private readonly jwtService: JwtService,
  ) {}

  @Post('checkout')
  public async createCheckout(
    @User('id') userId: number,
    @Body() payload: CheckoutPaymentRequestDto,
  ): Promise<CheckoutPaymentResponseDto> {
    return await this.paymentService.createCheckout(userId, payload);
  }

  @Get('check-update/:token')
  public async checkUpdate(
    @User('id') userId: number,
    @Param('token') token: string,
    @Query('cancel') cancel?: string,
  ): Promise<PaymentCheckUpdateResponseDto> {
    return await this.paymentService.checkUpdate(userId, token, cancel);
  }

  @Post('simulate-success/:token')
  public async simulateSuccess(
    @User('id') userId: number,
    @Param('token') token: string,
  ): Promise<PaymentCheckUpdateResponseDto> {
    return await this.paymentService.simulateSuccess(userId, token);
  }

  @Post('webhook')
  @Public()
  public async handleWebhook(@Body() body: any): Promise<any> {
    return await this.paymentService.handleWebhook(body);
  }

  @Public()
  @Sse('stream/:paymentId')
  public streamPaymentStatus(
    @Param('paymentId', ParseIntPipe) paymentId: number,
    @Query('token') token?: string,
  ): Observable<MessageEvent> {
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
