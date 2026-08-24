import {
  ConfirmWebhookResponse,
  CreatePayosPaymentLinkInput,
  CreatePayosPaymentLinkResponse,
  ExtendedPaymentLink,
  PaymentLink,
  Webhook,
  WebhookData,
} from '@/dtos/payment/payos.dto';
import { getBankNameByBin } from '@/utils/vietqr-bank.util';
import {
  BadGatewayException,
  BadRequestException,
  ForbiddenException,
  HttpException,
  Injectable,
  InternalServerErrorException,
  Logger,
  NotFoundException,
  UnauthorizedException,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import {
  APIError,
  BadRequestError,
  ConnectionError,
  ConnectionTimeoutError,
  ForbiddenError,
  InternalServerError,
  InvalidSignatureError,
  NotFoundError,
  PayOS,
  TooManyRequestError,
  UnauthorizedError,
  WebhookError,
} from '@payos/node';

@Injectable()
export class PayOSService {
  private readonly logger = new Logger(PayOSService.name);
  private readonly payos: PayOS;

  constructor(private readonly configService: ConfigService) {
    const clientId = this.configService.get<string>('PAYOS_CLIENT_ID');
    const apiKey = this.configService.get<string>('PAYOS_API_KEY');
    const checksumKey = this.configService.get<string>('PAYOS_CHECKSUM_KEY');

    if (!clientId || !apiKey || !checksumKey) {
      const missingKeys = [
        !clientId && 'PAYOS_CLIENT_ID',
        !apiKey && 'PAYOS_API_KEY',
        !checksumKey && 'PAYOS_CHECKSUM_KEY',
      ]
        .filter(Boolean)
        .join(', ');

      this.logger.error(
        `Failed to initialize PayOS service. Missing configuration keys: ${missingKeys}`,
      );
      throw new InternalServerErrorException(
        `Missing PayOS configuration: ${missingKeys}`,
      );
    }

    this.payos = new PayOS({
      clientId,
      apiKey,
      checksumKey,
    });
  }

  public async createPaymentLink(
    input: CreatePayosPaymentLinkInput,
  ): Promise<CreatePayosPaymentLinkResponse> {
    try {
      const payment = await this.payos.paymentRequests.create({
        orderCode: input.orderCode,
        amount: input.amount,
        description: input.description,
        buyerName: input.buyerName,
        buyerEmail: input.buyerEmail,
        buyerPhone: input.buyerPhone,
        returnUrl: input.returnUrl,
        cancelUrl: input.cancelUrl,
        items: input.items,
      });
      return {
        orderCode: payment.orderCode,
        qrCode: payment.qrCode,
        bankName: getBankNameByBin(payment.bin),
        accountName: payment.accountName,
        accountNumber: payment.accountNumber,
        ammount: payment.amount,
        description: payment.description,
        expiredAt: payment.expiredAt,
      };
    } catch (error) {
      this.throwMappedPayosError(error);
    }
  }

  public async retrievePaymentLink(
    orderCode: number,
  ): Promise<ExtendedPaymentLink> {
    try {
      return await this.payos.paymentRequests.get(orderCode);
    } catch (error) {
      this.throwMappedPayosError(error);
    }
  }

  public async cancelPaymentLink(
    orderCode: number,
    cancellationReason?: string,
  ): Promise<PaymentLink | null> {
    try {
      return await this.payos.paymentRequests.cancel(
        orderCode,
        cancellationReason,
      );
    } catch (error) {
      this.logger.warn(
        `Failed to cancel payment link for orderCode ${orderCode}: ${
          error instanceof Error ? error.message : 'Unknown error'
        }`,
      );
      return null;
    }
  }

  public async verifyWebhook(webhook: Webhook): Promise<WebhookData> {
    try {
      return await this.payos.webhooks.verify(webhook);
    } catch (error) {
      this.throwMappedPayosError(error);
    }
  }

  public async confirmWebhookUrl(
    webhookUrl: string,
  ): Promise<ConfirmWebhookResponse> {
    try {
      return await this.payos.webhooks.confirm(webhookUrl);
    } catch (error) {
      this.throwMappedPayosError(error);
    }
  }

  private throwMappedPayosError(error: unknown): never {
    const message =
      error instanceof Error ? error.message : 'payOS request failed';
    const stack = error instanceof Error ? error.stack : undefined;

    this.logger.error(`PayOS API error: ${message}`, stack);

    if (
      error instanceof BadRequestError ||
      error instanceof InvalidSignatureError ||
      error instanceof WebhookError
    ) {
      throw new BadRequestException(message);
    }

    if (error instanceof UnauthorizedError) {
      throw new UnauthorizedException(message);
    }

    if (error instanceof ForbiddenError) {
      throw new ForbiddenException(message);
    }

    if (error instanceof NotFoundError) {
      throw new NotFoundException(message);
    }

    if (error instanceof TooManyRequestError) {
      throw new HttpException(message, 429);
    }

    if (
      error instanceof ConnectionError ||
      error instanceof ConnectionTimeoutError
    ) {
      throw new BadGatewayException(message);
    }

    if (error instanceof InternalServerError || error instanceof APIError) {
      throw new InternalServerErrorException(message);
    }

    throw new InternalServerErrorException(message);
  }
}
