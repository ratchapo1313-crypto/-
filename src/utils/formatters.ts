/**
 * Format helpers enforcing Arabic numbers and Thai accounting formats
 */

export function formatNumber(num: number | undefined | null): string {
  if (num === undefined || num === null || isNaN(num)) return '0';
  return new Intl.NumberFormat('en-US').format(num);
}

export function formatCurrency(amount: number | undefined | null): string {
  if (amount === undefined || amount === null || isNaN(amount)) return '0.00';
  return new Intl.NumberFormat('en-US', {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(amount);
}

const THAI_MONTHS_SHORT = [
  'ม.ค.', 'ก.พ.', 'มี.ค.', 'เม.ย.', 'พ.ค.', 'มิ.ย.',
  'ก.ค.', 'ส.ค.', 'ก.ย.', 'ต.ค.', 'พ.ย.', 'ธ.ค.'
];

const THAI_MONTHS_FULL = [
  'มกราคม', 'กุมภาพันธ์', 'มีนาคม', 'เมษายน', 'พฤษภาคม', 'มิถุนายน',
  'กรกฎาคม', 'สิงหาคม', 'กันยายน', 'ตุลาคม', 'พฤศจิกายน', 'ธันวาคม'
];

/**
 * Format date string (YYYY-MM-DD) to Thai date with Arabic numerals
 * e.g., '2027-10-15' -> '15 ต.ค. 2570'
 */
export function formatThaiDate(dateStr: string | undefined | null, full: boolean = false): string {
  if (!dateStr) return '-';
  const parts = dateStr.split('-');
  if (parts.length < 3) return dateStr;
  
  const year = parseInt(parts[0], 10);
  const month = parseInt(parts[1], 10) - 1;
  const day = parseInt(parts[2], 10);
  
  // Calculate Buddhist Era: if year < 2400 (e.g. 2026/2027), add 543
  const beYear = year < 2400 ? year + 543 : year;
  
  if (full) {
    return `${day} ${THAI_MONTHS_FULL[month] || ''} พ.ศ. ${beYear}`;
  }
  return `${day} ${THAI_MONTHS_SHORT[month] || ''} ${beYear}`;
}

export function getCurrentFiscalYear(): number {
  return 2570;
}
