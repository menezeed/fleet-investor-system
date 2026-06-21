// Brazilian-format masks and validators, following patterns used by major
// Brazilian sites (Mercado Livre, banks, Correios) for address, document,
// and phone fields.

export function onlyDigits(value: string): string {
  return value.replace(/\D/g, '');
}

// ---- CPF ----

export function maskCpf(value: string): string {
  const digits = onlyDigits(value).slice(0, 11);
  return digits
    .replace(/(\d{3})(\d)/, '$1.$2')
    .replace(/(\d{3})(\d)/, '$1.$2')
    .replace(/(\d{3})(\d{1,2})$/, '$1-$2');
}

export function isValidCpf(value: string): boolean {
  const cpf = onlyDigits(value);
  if (cpf.length !== 11 || /^(\d)\1{10}$/.test(cpf)) return false;

  let sum = 0;
  for (let i = 0; i < 9; i++) sum += Number(cpf[i]) * (10 - i);
  let check1 = (sum * 10) % 11;
  if (check1 === 10) check1 = 0;
  if (check1 !== Number(cpf[9])) return false;

  sum = 0;
  for (let i = 0; i < 10; i++) sum += Number(cpf[i]) * (11 - i);
  let check2 = (sum * 10) % 11;
  if (check2 === 10) check2 = 0;
  return check2 === Number(cpf[10]);
}

// ---- CNPJ ----

export function maskCnpj(value: string): string {
  const digits = onlyDigits(value).slice(0, 14);
  return digits
    .replace(/(\d{2})(\d)/, '$1.$2')
    .replace(/(\d{3})(\d)/, '$1.$2')
    .replace(/(\d{3})(\d)/, '$1/$2')
    .replace(/(\d{4})(\d{1,2})$/, '$1-$2');
}

export function isValidCnpj(value: string): boolean {
  const cnpj = onlyDigits(value);
  if (cnpj.length !== 14 || /^(\d)\1{13}$/.test(cnpj)) return false;

  const calcCheck = (base: string, weights: number[]) => {
    const sum = weights.reduce((acc, w, i) => acc + Number(base[i]) * w, 0);
    const mod = sum % 11;
    return mod < 2 ? 0 : 11 - mod;
  };

  const weights1 = [5, 4, 3, 2, 9, 8, 7, 6, 5, 4, 3, 2];
  const check1 = calcCheck(cnpj.slice(0, 12), weights1);
  if (check1 !== Number(cnpj[12])) return false;

  const weights2 = [6, 5, 4, 3, 2, 9, 8, 7, 6, 5, 4, 3, 2];
  const check2 = calcCheck(cnpj.slice(0, 13), weights2);
  return check2 === Number(cnpj[13]);
}

// ---- Phone (CR-002 Change 2: international format, not restricted to Brazil) ----

/**
 * Lightly formats an international phone number as the user types, without
 * forcing the rigid Brazilian (DD) XXXXX-XXXX shape. Accepts an optional
 * leading "+" and country code, then groups remaining digits for readability.
 * Examples: "+44 20 7946 0958", "+1 415 555 2671", "+55 11 91234 5678".
 */
export function maskPhoneIntl(value: string): string {
  const hasPlus = value.trim().startsWith('+');
  const digits = onlyDigits(value).slice(0, 15); // E.164 max length is 15 digits
  if (!digits) return hasPlus ? '+' : '';

  // Group: country code (1-3 digits) + rest in chunks of ~4 for readability.
  // This is intentionally loose — international numbering plans vary too
  // much for a single rigid mask, so we group rather than strictly validate shape.
  const countryCodeLen = digits.length > 10 ? 2 : digits.length > 9 ? 1 : 0;
  const countryCode = digits.slice(0, countryCodeLen);
  const rest = digits.slice(countryCodeLen);
  const restGrouped = rest.replace(/(\d{2,4})(?=\d)/g, '$1 ').trim();

  return `+${countryCode ? countryCode + ' ' : ''}${restGrouped}`.trim();
}

/** Accepts E.164-ish phone numbers: optional +, 7 to 15 digits total. */
export function isValidPhoneIntl(value: string): boolean {
  const digits = onlyDigits(value);
  return digits.length >= 7 && digits.length <= 15;
}

// ---- Phone (Brazilian: landline 10 digits, mobile 11 digits) ----

export function maskPhone(value: string): string {
  const digits = onlyDigits(value).slice(0, 11);
  if (digits.length <= 10) {
    return digits
      .replace(/(\d{2})(\d)/, '($1) $2')
      .replace(/(\d{4})(\d{1,4})$/, '$1-$2');
  }
  return digits
    .replace(/(\d{2})(\d)/, '($1) $2')
    .replace(/(\d{5})(\d{1,4})$/, '$1-$2');
}

export function isValidPhone(value: string): boolean {
  const digits = onlyDigits(value);
  return digits.length === 10 || digits.length === 11;
}

// ---- CEP ----

export function maskCep(value: string): string {
  const digits = onlyDigits(value).slice(0, 8);
  return digits.replace(/(\d{5})(\d{1,3})$/, '$1-$2');
}

export function isValidCep(value: string): boolean {
  return onlyDigits(value).length === 8;
}

// ---- Date (DD/MM/YYYY display <-> YYYY-MM-DD storage) ----

export function maskDateBr(value: string): string {
  const digits = onlyDigits(value).slice(0, 8);
  return digits
    .replace(/(\d{2})(\d)/, '$1/$2')
    .replace(/(\d{2})(\d{1,4})$/, '$1/$2');
}

/** Converts "DD/MM/YYYY" -> "YYYY-MM-DD" (ISO, for storage). Returns null if incomplete/invalid. */
export function brDateToIso(value: string): string | null {
  const match = /^(\d{2})\/(\d{2})\/(\d{4})$/.exec(value.trim());
  if (!match) return null;
  const [, dd, mm, yyyy] = match;
  const day = Number(dd);
  const month = Number(mm);
  const year = Number(yyyy);

  const date = new Date(year, month - 1, day);
  const isRealDate = date.getFullYear() === year && date.getMonth() === month - 1 && date.getDate() === day;
  if (!isRealDate) return null;

  return `${yyyy}-${mm}-${dd}`;
}

/** Converts "YYYY-MM-DD" (ISO, from storage) -> "DD/MM/YYYY" (display). */
export function isoDateToBr(value: string | null | undefined): string {
  if (!value) return '';
  const match = /^(\d{4})-(\d{2})-(\d{2})/.exec(value);
  if (!match) return '';
  const [, yyyy, mm, dd] = match;
  return `${dd}/${mm}/${yyyy}`;
}

export function isValidBrDate(value: string): boolean {
  if (!value) return false;
  return brDateToIso(value) !== null;
}

// ---- PIX (CPF, CNPJ, email, phone, or random UUID key — only light validation) ----

export function isPlausiblePix(value: string): boolean {
  const trimmed = value.trim();
  if (!trimmed) return true; // optional field
  const digits = onlyDigits(trimmed);
  if (digits.length === 11 || digits.length === 14) return true; // CPF/CNPJ-shaped
  if (/^\S+@\S+\.\S+$/.test(trimmed)) return true; // email-shaped
  if (digits.length === 10 || digits.length === 11) return true; // phone-shaped
  if (/^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(trimmed)) return true; // random key (UUID)
  return false;
}
