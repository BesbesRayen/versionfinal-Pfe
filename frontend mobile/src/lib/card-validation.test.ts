import {
  formatCardNumber,
  isValidLuhn,
  normalizeCardNumber,
  validateCardExpiry,
  validateCardNumber,
} from "./card-validation";

describe("card validation", () => {
  it("normalizes and formats pasted card numbers", () => {
    expect(normalizeCardNumber("4111-1111 1111.1111")).toBe("4111111111111111");
    expect(normalizeCardNumber("4111111111111111222")).toBe("4111111111111111");
    expect(formatCardNumber("4111111111111111")).toBe("4111 1111 1111 1111");
  });

  it("accepts valid Visa and Mastercard test numbers", () => {
    expect(isValidLuhn("4111111111111111")).toBe(true);
    expect(isValidLuhn("5555555555554444")).toBe(true);
    expect(validateCardNumber("4111 1111 1111 1111")).toBeNull();
  });

  it("rejects incomplete card numbers but allows non-Luhn test numbers", () => {
    expect(validateCardNumber("41111111")).toContain("exactement 16");
    expect(validateCardNumber("411111111111111")).toContain("exactement 16");
    expect(validateCardNumber("4111111111111112")).toBeNull();
  });

  it("validates expiry month and date", () => {
    const now = new Date(2026, 5, 14);
    expect(validateCardExpiry("12/30", now)).toBeNull();
    expect(validateCardExpiry("13/30", now)).toContain("01 et 12");
    expect(validateCardExpiry("05/26", now)).toContain("expiree");
  });
});
