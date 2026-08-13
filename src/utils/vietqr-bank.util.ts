const VIETQR_BANK_MAP: Record<string, string> = {
  '970422': 'MBBank',
  '970436': 'Vietcombank',
  '970415': 'VietinBank',
  '970418': 'BIDV',
  '970407': 'Techcombank',
  '970405': 'Agribank',
  '970423': 'TPBank',
  '970432': 'VPBank',
  '970403': 'Sacombank',
  '970441': 'VIB',
  '970416': 'ACB',
  '970437': 'HDBank',
  '970443': 'SHB',
  '970431': 'Eximbank',
  '970426': 'MSB',
  '970427': 'BVBank',
  '970440': 'SeABank',
  '970428': 'Nam A Bank',
  '970414': 'OceanBank',
  '970430': 'PGBank',
  '970439': 'PublicBank',
  '970448': 'OCB',
  '970438': 'BaoVietBank',
  '970452': 'KienLongBank',
  '970449': 'LPBank',
  '970406': 'DongA Bank',
  '970433': 'VietBank',
  '970454': 'VietABank',
  '970429': 'SCB',
  '970457': 'Woori Bank',
  '970458': 'UOB',
  '970442': 'Shinhan Bank',
  '970434': 'IVB',
  '970412': 'PVComBank',
  '970400': 'SaigonBank',
  '970409': 'Bac A Bank',
  '970419': 'NCB',
  '970446': 'VRB',
  '970425': 'ABBANK',
  '970455': 'IBK',
  '970435': 'CIMB',
  '970444': 'CBBank',
};

/**
 * Returns the short bank name based on VietQR / Napas BIN code.
 * Falls back to "Ngân hàng liên kết PayOS" or BIN string if unknown.
 */
export function getBankNameByBin(bin?: string): string {
  if (!bin) {
    return 'Ngân hàng liên kết PayOS';
  }

  const trimmedBin = bin.trim();
  if (!VIETQR_BANK_MAP[trimmedBin]) {
    return 'Ngân hàng liên kết PayOS';
  }
  return VIETQR_BANK_MAP[trimmedBin];
}
