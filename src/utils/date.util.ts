/**
 * Lấy danh sách ngày ( trả về 1 mảng )
 */
export function getDateRange(startDate: Date, endDate: Date): Date[] {
  const dates: Date[] = [];
  for (
    let date = new Date(startDate);
    date < endDate;
    date.setDate(date.getDate() + 1)
  ) {
    dates.push(new Date(date));
  }
  return dates;
}
export function formatDateString(date: Date): string {
  const yyyy = date.getFullYear();
  const mm = String(date.getMonth() + 1).padStart(2, '0');
  const dd = String(date.getDate()).padStart(2, '0');
  return `${yyyy}-${mm}-${dd}`;
}
