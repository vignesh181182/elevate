// Country dial codes for the add-client phone field — ported verbatim from the
// prototype's COUNTRIES list. Phone validation: India (+91) is exactly 10 digits,
// everything else 6–15 (E.164 range).
export interface Country {
  d: string; // dial code, e.g. '+91'
  f: string; // flag emoji
  n: string; // name
}

export const COUNTRIES: Country[] = [
  { d: '+91', f: '🇮🇳', n: 'India' },
  { d: '+1', f: '🇺🇸', n: 'United States' },
  { d: '+44', f: '🇬🇧', n: 'United Kingdom' },
  { d: '+971', f: '🇦🇪', n: 'UAE' },
  { d: '+61', f: '🇦🇺', n: 'Australia' },
  { d: '+65', f: '🇸🇬', n: 'Singapore' },
  { d: '+60', f: '🇲🇾', n: 'Malaysia' },
  { d: '+966', f: '🇸🇦', n: 'Saudi Arabia' },
  { d: '+49', f: '🇩🇪', n: 'Germany' },
  { d: '+33', f: '🇫🇷', n: 'France' },
  { d: '+64', f: '🇳🇿', n: 'New Zealand' },
];

/** Are the dialled digits valid for the chosen country? */
export function phoneOk(digits: string, dial: string): boolean {
  return dial === '+91' ? digits.length === 10 : digits.length >= 6 && digits.length <= 15;
}

/** Expected-length label for the live hint. */
export function phoneNeed(dial: string): string {
  return dial === '+91' ? '10' : '6–15';
}

export function emailOk(email: string): boolean {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
}
