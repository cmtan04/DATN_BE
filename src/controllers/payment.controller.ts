import { Body, Controller, Get, Param, Post } from '@nestjs/common';
import { ApiTags } from '@nestjs/swagger';
import { Public } from '@/common/jwt/public.decorator';
import {
  CheckoutPaymentRequestDto,
  CheckoutPaymentResponseDto,
  PaymentCheckUpdateResponseDto,
} from '@/dtos/payment/payment.dto';
import { PaymentService } from '@/services/payment.service';
import { User } from '@/user.decorator';
import type { Webhook } from '@payos/node';

@Controller('payments')
@ApiTags('Payments')
export class PaymentController {
  constructor(private readonly paymentService: PaymentService) {}

  @Post('checkout')
  public async createCheckout(
    @User('id') userId: number,
    @Body() payload: CheckoutPaymentRequestDto,
  ): Promise<CheckoutPaymentResponseDto> {
    return await this.paymentService.createCheckout(userId, payload);
  }

  @Public()
  @Post('webhook')
  public async handlePayosWebhook(
    @Body() payload: Webhook,
  ): Promise<{ received: true }> {
    return await this.paymentService.handlePayosWebhook(payload);
  }

  @Get('check-update/:token')
  public async checkUpdate(
    @User('id') userId: number,
    @Param('token') token: string,
  ): Promise<PaymentCheckUpdateResponseDto> {
    return await this.paymentService.checkUpdate(userId, token);
  }
}
