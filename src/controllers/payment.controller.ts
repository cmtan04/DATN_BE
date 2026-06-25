import { Body, Controller, Get, Param, Post } from '@nestjs/common';
import { ApiTags } from '@nestjs/swagger';
import {
  CheckoutPaymentRequestDto,
  CheckoutPaymentResponseDto,
  PaymentCheckUpdateResponseDto,
} from '@/dtos/payment/payment.dto';
import { PaymentService } from '@/services/payment.service';
import { User } from '@/common/decorators/user.decorator';

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

  @Get('check-update/:token')
  public async checkUpdate(
    @User('id') userId: number,
    @Param('token') token: string,
  ): Promise<PaymentCheckUpdateResponseDto> {
    return await this.paymentService.checkUpdate(userId, token);
  }

  @Post('simulate-success/:token')
  public async simulateSuccess(
    @User('id') userId: number,
    @Param('token') token: string,
  ): Promise<PaymentCheckUpdateResponseDto> {
    return await this.paymentService.simulateSuccess(userId, token);
  }
}
