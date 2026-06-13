import type { CreditBalanceResult, CreditSimulationResult, PurchasePaymentType } from "@/lib/api";

export const PLAN_MONTHS = [3, 6, 9, 12] as const;
export type PlanMonths = (typeof PLAN_MONTHS)[number];

const toCents = (value: number) => Math.round(value * 100);
const fromCents = (value: number) => value / 100;
const floorDivideCents = (totalCents: number, parts: number) => Math.floor(totalCents / parts);

export const toDt = (value: number) => `${value.toFixed(2)} DT`;
export const toBackendMoney = (value: number) => fromCents(toCents(value));

export const getInterestRate = (months: number) => {
  switch (months) {
    case 3:
      return 0;
    case 6:
      return 0.03;
    case 9:
      return 0.06;
    case 12:
      return 0.12;
    default:
      return 0;
  }
};

export const toInterestPercent = (rate: number) => {
  const normalized = rate <= 1 ? rate * 100 : rate;
  return `${Number(normalized.toFixed(2))}%`;
};

export const addMonths = (date: Date, months: number) => {
  const next = new Date(date);
  next.setMonth(next.getMonth() + months);
  return next;
};

export const getLocalCreditMath = (amount: number, months: number, fallbackDownPayment?: number) => {
  const productCents = toCents(amount);
  const downPaymentCents = fallbackDownPayment == null
    ? Math.round(productCents * 0.2)
    : toCents(fallbackDownPayment);
  const principalCents = Math.max(0, productCents - downPaymentCents);
  const interestRate = getInterestRate(months);
  const interestCents = Math.round(principalCents * interestRate);
  const totalRepayableCents = principalCents + interestCents;
  const monthlyBaseCents = floorDivideCents(totalRepayableCents, months);
  const lastInstallmentCents = totalRepayableCents - monthlyBaseCents * (months - 1);
  const scheduleCents = Array.from({ length: months }, (_, index) =>
    index === months - 1 ? lastInstallmentCents : monthlyBaseCents,
  );

  return {
    downPayment: fromCents(downPaymentCents),
    principal: fromCents(principalCents),
    interestRate,
    interest: fromCents(interestCents),
    totalRepayable: fromCents(totalRepayableCents),
    monthly: fromCents(monthlyBaseCents),
    lastInstallment: fromCents(lastInstallmentCents),
    finalProductCost: fromCents(downPaymentCents + totalRepayableCents),
    schedule: scheduleCents.map(fromCents),
  };
};

export const getPlanComparisons = (amount: number, fallbackDownPayment?: number) =>
  PLAN_MONTHS.map((months) => ({
    months,
    ...getLocalCreditMath(amount, months, fallbackDownPayment),
  }));

export const getCreditPreviewValues = (
  amount: number,
  paymentMode: PurchasePaymentType,
  fallbackDownPayment: number,
  simulation: CreditSimulationResult | null,
  creditBalance?: Pick<CreditBalanceResult, "availableCredit"> | null,
  selectedMonths = 3,
) => {
  const fallbackMath = getLocalCreditMath(amount, simulation?.numberOfInstallments ?? selectedMonths, fallbackDownPayment);
  const downPayment = simulation?.downPayment ?? fallbackMath.downPayment;
  const principal = simulation?.remainingAmount ?? fallbackMath.principal;
  const interest = simulation?.interestAmount ?? fallbackMath.interest;
  const interestRate = simulation?.interestRate ?? fallbackMath.interestRate;
  const totalRepayable = simulation?.totalRepayable ?? fallbackMath.totalRepayable;
  const monthly = paymentMode === "CASH" ? amount : simulation?.monthlyAmount ?? fallbackMath.monthly;
  const financedAmount = paymentMode === "CASH" ? 0 : principal;
  const totalToPay = paymentMode === "CASH" ? amount : totalRepayable;
  const finalProductCost = paymentMode === "CASH" ? amount : toBackendMoney(downPayment + totalRepayable);

  return {
    downPayment: paymentMode === "CASH" ? amount : downPayment,
    principal: financedAmount,
    interestRate: paymentMode === "CASH" ? 0 : interestRate,
    interest: paymentMode === "CASH" ? 0 : interest,
    monthly,
    totalToPay,
    finalProductCost,
    remainingCredit: creditBalance == null ? null : Math.max(0, creditBalance.availableCredit - monthly),
  };
};
