/**
 * Luhn checksum (ISO/IEC 7812-1), used to tell a real-looking card number
 * apart from an arbitrary 13–19 digit string (order numbers, phone numbers
 * with the separators stripped, etc.) before flagging it as exposed PII.
 */
export function isValidLuhn(digits: string): boolean {
  if (!/^\d{13,19}$/.test(digits)) {
    return false;
  }

  let sum = 0;
  let shouldDouble = false;
  for (let i = digits.length - 1; i >= 0; i -= 1) {
    let digit = Number(digits[i]);
    if (shouldDouble) {
      digit *= 2;
      if (digit > 9) {
        digit -= 9;
      }
    }
    sum += digit;
    shouldDouble = !shouldDouble;
  }

  return sum % 10 === 0;
}
