import { describe, expect, it } from "vitest";
import { getLocalCreditMath, getCreditPreviewValues, toBackendMoney, toDt } from "@/lib/creditPreview";
import type { CreditSimulationResult } from "@/lib/api";

const simulation: CreditSimulationResult = {
  totalAmount: 600,
  downPayment: 120,
  remainingAmount: 480,
  interestAmount: 14.4,
  interestRate: 0.03,
  totalRepayable: 494.4,
  numberOfInstallments: 6,
  monthlyAmount: 82.4,
  schedule: [
    { installmentId: null as unknown as number, dueDate: "2026-06-25", amount: 82.4, status: "PENDING" },
  ],
};

describe("credit preview", () => {
  it("uses backend simulation values without truncating cents", () => {
    const preview = getCreditPreviewValues(600, "CREDIT", 120, simulation, { availableCredit: 1000 });

    expect(preview).toMatchObject({
      downPayment: 120,
      principal: 480,
      interest: 14.4,
      interestRate: 0.03,
      monthly: 82.4,
      totalToPay: 494.4,
      finalProductCost: 614.4,
      remainingCredit: 917.6,
    });
    expect(toDt(preview.monthly)).toBe("82.40 DT");
  });

  it("rounds request money to two decimals only", () => {
    expect(toBackendMoney(123.456)).toBe(123.46);
  });

  it.each([
    [3, 0, 400, 133.33, 133.34, 500],
    [6, 12, 412, 68.66, 68.7, 512],
    [9, 24, 424, 47.11, 47.12, 524],
    [12, 48, 448, 37.33, 37.37, 548],
  ])("calculates the required 500 DT plan for %i months", (months, interest, totalRepayable, monthly, lastInstallment, finalTotal) => {
    const plan = getLocalCreditMath(500, months);

    expect(plan.downPayment).toBe(100);
    expect(plan.principal).toBe(400);
    expect(plan.interest).toBe(interest);
    expect(plan.totalRepayable).toBe(totalRepayable);
    expect(plan.monthly).toBe(monthly);
    expect(plan.lastInstallment).toBe(lastInstallment);
    expect(plan.finalProductCost).toBe(finalTotal);
    expect(plan.schedule.reduce((sum, item) => sum + item, 0)).toBeCloseTo(totalRepayable, 2);
  });
});
