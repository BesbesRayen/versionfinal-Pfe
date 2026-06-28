export const normalizeCardNumber = (value: string) => value.replace(/\D/g, "").slice(0, 16);

export const formatCardNumber = (value: string) =>
  normalizeCardNumber(value).replace(/(\d{4})(?=\d)/g, "$1 ");

export const isValidLuhn = (value: string) => {
  const digits = normalizeCardNumber(value);
  if (!/^\d{16}$/.test(digits)) return false;

  let sum = 0;
  let shouldDouble = false;
  for (let index = digits.length - 1; index >= 0; index -= 1) {
    let digit = Number(digits[index]);
    if (shouldDouble) {
      digit *= 2;
      if (digit > 9) digit -= 9;
    }
    sum += digit;
    shouldDouble = !shouldDouble;
  }
  return sum % 10 === 0;
};

export const validateCardNumber = (value: string): string | null => {
  const digits = normalizeCardNumber(value);
  if (!/^\d{16}$/.test(digits)) return "Le numero de carte doit contenir exactement 16 chiffres.";
  return null;
};

export const validateCardExpiry = (value: string, now = new Date()): string | null => {
  if (!/^\d{2}\/\d{2}$/.test(value)) return "Utilisez le format MM/AA.";

  const month = Number(value.slice(0, 2));
  const year = Number(value.slice(3, 5));
  const currentYear = now.getFullYear() % 100;
  const currentMonth = now.getMonth() + 1;

  if (month < 1 || month > 12) return "Le mois doit etre compris entre 01 et 12.";
  if (year < currentYear || (year === currentYear && month < currentMonth)) {
    return "La carte est expiree.";
  }
  return null;
};
