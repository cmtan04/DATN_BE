import {
  BadGatewayException,
  BadRequestException,
  ForbiddenException,
  HttpException,
  Injectable,
  InternalServerErrorException,
  NotFoundException,
  UnauthorizedException,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import {
  APIError,
  BadRequestError,
  ConnectionError,
  ConnectionTimeoutError,
  CreatePaymentLinkResponse,
  ForbiddenError,
  InternalServerError,
  InvalidSignatureError,
  NotFoundError,
  PayOS,
  PaymentLink,
  TooManyRequestError,
  UnauthorizedError,
  Webhook,
  WebhookData,
  WebhookError,
} from '@payos/node';

export interface CreatePayosPaymentLinkInput {
  orderCode: number;
  amount: number;
  description: string;
  buyerName: string;
  buyerEmail: string;
  buyerPhone: string;
  returnUrl: string;
  cancelUrl: string;
  items: {
    name: string;
    quantity: number;
    price: number;
  }[];
}

@Injectable()
export class PayosService {
  private readonly payos: PayOS;

  constructor(private readonly configService: ConfigService) {
    const clientId = this.configService.get<string>('PAYOS_CLIENT_ID');
    const apiKey = this.configService.get<string>('PAYOS_API_KEY');
    const checksumKey = this.configService.get<string>('PAYOS_CHECKSUM_KEY');

    if (!clientId) {
      throw new InternalServerErrorException('Missing PAYOS_CLIENT_ID');
    }

    if (!apiKey) {
      throw new InternalServerErrorException('Missing PAYOS_API_KEY');
    }

    if (!checksumKey) {
      throw new InternalServerErrorException('Missing PAYOS_CHECKSUM_KEY');
    }

    this.payos = new PayOS({
      clientId,
      apiKey,
      checksumKey,
    });
  }

  public async createPaymentLink(
    input: CreatePayosPaymentLinkInput,
  ): Promise<CreatePaymentLinkResponse> {
    try {
      return await this.payos.paymentRequests.create({
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
    } catch (error) {
      this.throwMappedPayosError(error);
    }
  }

  public async retrievePaymentLink(orderCode: number): Promise<PaymentLink> {
    try {
      return await this.payos.paymentRequests.get(orderCode);
    } catch (error) {
      this.throwMappedPayosError(error);
    }
  }

  public async verifyWebhook(webhook: Webhook): Promise<WebhookData> {
    try {
      return await this.payos.webhooks.verify(webhook);
    } catch (error) {
      this.throwMappedPayosError(error);
    }
  }

  private throwMappedPayosError(error: unknown): never {
    const message =
      error instanceof Error ? error.message : 'payOS request failed';

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
