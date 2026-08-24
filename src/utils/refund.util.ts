/**
 * Tính phần trăm hoàn tiền dựa trên ngày bắt đầu booking.
 * Only for Viet Nam. Nếu sau này mở rộng -> cần đổi lại
 */
export function calculateRefundPercentage(bookingStartDate: Date): number {
  const startDate = new Date(bookingStartDate);
  startDate.setUTCHours(7, 0, 0, 0);
  const now = Date.now();
  const diffHours = Math.ceil((startDate.getTime() - now) / (1000 * 60 * 60));

  if (diffHours >= 72) {
    return 100;
  }
  if (diffHours >= 24) {
    return 50;
  }
  return 0;
}
