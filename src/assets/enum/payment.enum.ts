export enum BookingStatus {
  CREATED = 0,
  PENDING_PAYMENT = 1,
  CONFIRMED = 2,
  CANCELLED = 3,
  EXPIRED = 4,
}

export enum PaymentStatus {
  UNPAID = 'UNPAID',
  PAID = 'PAID',
  FAILED = 'FAILED',
  CANCELLED = 'CANCELLED',
  REFUND_PENDING = 'REFUND_PENDING',
  REFUNDED = 'REFUNDED',
}

export enum RefundStatus {
  PENDING = 'PENDING',
  COMPLETED = 'COMPLETED',
  REJECTED = 'REJECTED',
  CANCELLED = 'CANCELLED',
}

export enum PaymentMethod {
  COD = 'cod',
  MOMO = 'momo',
  PAYOS = 'payos',
}

export enum PaymentTranscriptStatus {
  SUCCESS = 0,
  CANCEL = -1,
}
