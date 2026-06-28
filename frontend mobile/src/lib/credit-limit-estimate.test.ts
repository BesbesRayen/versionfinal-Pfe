import {
  CREDIT_LIMIT_CAP,
  estimateCreditLimit,
} from "./credit-limit-estimate";

describe("credit limit estimate", () => {
  it.each([
    [100, 55],
    [1_000, 550],
    [3_000, 1_650],
    [7_000, 3_850],
  ])("estimates a salary-dependent limit for %s DT", (salary, expected) => {
    expect(estimateCreditLimit(salary)).toBe(expected);
  });

  it("caps the estimate at the backend credit limit ceiling", () => {
    expect(estimateCreditLimit(15_000)).toBe(CREDIT_LIMIT_CAP);
  });

  it("returns zero for invalid salaries", () => {
    expect(estimateCreditLimit(Number.NaN)).toBe(0);
    expect(estimateCreditLimit(0)).toBe(0);
  });
});
