import { format, parseISO } from 'date-fns';
import { id as localeId } from 'date-fns/locale';

export class CurrencyFormatter {
  static format(amount: string | number | null | undefined, showPrefix = true): string {
    if (amount === null || amount === undefined || amount === '') {
      return showPrefix ? 'Rp 0' : '0';
    }

    let num = parseFloat(amount.toString());

    if (isNaN(num)) {
      console.warn(`Invalid currency value: ${amount}`);
      return showPrefix ? 'Rp 0' : '0';
    }

    num = Math.round(num);

    const formatted = num.toLocaleString('id-ID', {
      minimumFractionDigits: 0,
      maximumFractionDigits: 0
    });

    return showPrefix ? `Rp ${formatted}` : formatted;
  }

  static parse(formattedCurrency: string): number {
    if (!formattedCurrency) return 0;

    const cleaned = formattedCurrency
      .replace(/Rp/g, '')
      .replace(/\s/g, '')
      .replace(/\./g, '');

    const num = parseFloat(cleaned);
    return isNaN(num) ? 0 : num;
  }
}

export class DateTimeFormatter {
  static format(isoString: string, formatType: 'full' | 'date' | 'time' | 'dateOnly' = 'full'): string {
    if (!isoString) return '-';

    try {
      const date = parseISO(isoString);

      if (isNaN(date.getTime())) {
        console.warn(`Invalid date: ${isoString}`);
        return '-';
      }

      switch (formatType) {
        case 'full':
          return format(date, 'dd MMM yyyy, HH:mm', { locale: localeId });
        case 'date':
          return format(date, 'dd MMM yyyy', { locale: localeId });
        case 'dateOnly':
          return format(date, 'dd/MM/yyyy', { locale: localeId });
        case 'time':
          return format(date, 'HH:mm', { locale: localeId });
        default:
          return format(date, 'dd MMM yyyy, HH:mm', { locale: localeId });
      }
    } catch (error) {
      console.error('Date formatting error:', error);
      return '-';
    }
  }
}

export function getClientDisplayName(client: any): string {
  const { Name1, Full_Name, Last_Name } = client;

  if (!Name1 || Name1.trim() === '') {
    return Full_Name || Last_Name || 'Unknown Client';
  }

  if (Full_Name && /^SC\d/.test(Full_Name)) {
    return Name1;
  }

  if ((!Name1 || Name1.trim() === '') && (!Full_Name || Full_Name.trim() === '')) {
    return Last_Name || 'Unknown Client';
  }

  return Name1;
}
