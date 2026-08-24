export enum BookingStatus {
  CREATED = 0,
  PENDING_PAYMENT = 1,
  CONFIRMED = 2,
  CANCELLED = 3,
  EXPIRED = 4,
}

export enum PaymentStatus {
  UNPAID = 0,
  PAID = 1,
  FAILED = 2,
  CANCELLED = 3,
  REFUND_PENDING = 4,
  REFUNDED = 5,
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
