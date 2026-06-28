export const CREDIT_LIMIT_CAP = 8_000;
export const SALARY_LIMIT_RATIO = 0.55;

export const estimateCreditLimit = (monthlySalary: number) => {
  if (!Number.isFinite(monthlySalary) || monthlySalary <= 0) return 0;
  return Math.round(Math.min(CREDIT_LIMIT_CAP, monthlySalary * SALARY_LIMIT_RATIO));
};
