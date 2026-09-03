function parseDateOnly(date: Date | string): Date {
  if (typeof date === 'string') {
    const match = date.match(/^(\d{4})-(\d{2})-(\d{2})/);
    if (match) {
      return new Date(
        parseInt(match[1], 10),
        parseInt(match[2], 10) - 1,
        parseInt(match[3], 10),
      );
    }
  }
  const d = new Date(date);
  return new Date(d.getFullYear(), d.getMonth(), d.getDate());
}

/**
 * Lấy danh sách ngày ( trả về 1 mảng )
 */
export function getDateRange(
  startDate: Date | string,
  endDate: Date | string,
): Date[] {
  const start = parseDateOnly(startDate);
  const end = parseDateOnly(endDate);
  const dates: Date[] = [];
  for (
    const date = new Date(start);
    date < end;
    date.setDate(date.getDate() + 1)
  ) {
    dates.push(new Date(date));
  }
  return dates;
}

export function formatDateString(date: Date | string): string {
  const d = parseDateOnly(date);
  const yyyy = d.getFullYear();
  const mm = String(d.getMonth() + 1).padStart(2, '0');
  const dd = String(d.getDate()).padStart(2, '0');
  return `${yyyy}-${mm}-${dd}`;
}
