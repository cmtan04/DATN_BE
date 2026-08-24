import { CreatePaymentLinkResponse, PaymentLink } from '@payos/node';

export interface CreatePayosItemInput {
  name: string;
  quantity: number;
  price: number;
}

export interface CreatePayosPaymentLinkInput {
  orderCode: number;
  amount: number;
  description: string;
  buyerName: string;
  buyerEmail: string;
  buyerPhone: string;
  returnUrl: string;
  cancelUrl: string;
  items: CreatePayosItemInput[];
}

export interface CreatePayosPaymentLinkResponse {
  orderCode: number;
  qrCode: string;
  bankName: string;
  accountName: string;
  accountNumber: string;
  ammount: number;
  description: string;
  expiredAt?: number;
}

export type ExtendedPaymentLink = PaymentLink &
  Partial<CreatePaymentLinkResponse>;

export type {
  ConfirmWebhookRequest,
  ConfirmWebhookResponse,
  PaymentLink,
  PaymentLinkItem,
  PaymentLinkStatus,
  Webhook,
  WebhookData,
} from '@payos/node';
