package com.creaditn.creaditnbackend.util;

import lombok.experimental.UtilityClass;
import java.math.BigDecimal;
import java.math.RoundingMode;
import java.time.LocalDate;
import java.util.List;
import java.util.Set;
import java.util.ArrayList;

/**
 * Utility class for credit-related calculations
 */
@UtilityClass
public class CreditCalculator {

    public static final BigDecimal DOWN_PAYMENT_RATIO = BigDecimal.valueOf(0.20);
    public static final String ALLOWED_INSTALLMENT_MESSAGE = "Allowed installment plans are: 3, 6, 9, 12 months";
    public static final Set<Integer> ALLOWED_INSTALLMENT_DURATIONS = Set.of(3, 6, 9, 12);

    public static boolean isAllowedInstallmentDuration(Integer numberOfInstallments) {
        return numberOfInstallments != null && ALLOWED_INSTALLMENT_DURATIONS.contains(numberOfInstallments);
    }

    public static void validateInstallmentDuration(Integer numberOfInstallments) {
        if (!isAllowedInstallmentDuration(numberOfInstallments)) {
            throw new IllegalArgumentException(ALLOWED_INSTALLMENT_MESSAGE);
        }
    }

    /**
     * Calculate the monthly installment amount
     * @param totalAmount the total credit amount
     * @param downPayment the down payment amount
     * @param numberOfInstallments the number of installments
     * @return the monthly installment amount
     */
    public static BigDecimal calculateMonthlyAmount(
            BigDecimal totalAmount,
            BigDecimal downPayment,
            Integer numberOfInstallments) {
        List<BigDecimal> schedule = calculateRepaymentSchedule(totalAmount, downPayment, numberOfInstallments);
        return schedule.isEmpty() ? BigDecimal.ZERO.setScale(2, RoundingMode.HALF_UP) : schedule.get(0);
    }

    public static BigDecimal calculatePrincipal(BigDecimal totalAmount, BigDecimal downPayment) {
        return totalAmount.subtract(downPayment).setScale(2, RoundingMode.HALF_UP);
    }

    public static BigDecimal calculateInterestAmount(
            BigDecimal totalAmount,
            BigDecimal downPayment,
            Integer numberOfInstallments) {
        validateInstallmentDuration(numberOfInstallments);
        return calculatePrincipal(totalAmount, downPayment)
                .multiply(getInterestRate(numberOfInstallments))
                .setScale(2, RoundingMode.HALF_UP);
    }

    public static BigDecimal calculateTotalRepayable(
            BigDecimal totalAmount,
            BigDecimal downPayment,
            Integer numberOfInstallments) {
        return calculatePrincipal(totalAmount, downPayment)
                .add(calculateInterestAmount(totalAmount, downPayment, numberOfInstallments))
                .setScale(2, RoundingMode.HALF_UP);
    }

    public static List<BigDecimal> calculateRepaymentSchedule(
            BigDecimal totalAmount,
            BigDecimal downPayment,
            Integer numberOfInstallments) {
        validateInstallmentDuration(numberOfInstallments);
        return splitEvenly(calculateTotalRepayable(totalAmount, downPayment, numberOfInstallments), numberOfInstallments);
    }

    public static List<BigDecimal> calculatePrincipalSchedule(
            BigDecimal totalAmount,
            BigDecimal downPayment,
            Integer numberOfInstallments) {
        validateInstallmentDuration(numberOfInstallments);
        return splitEvenly(calculatePrincipal(totalAmount, downPayment), numberOfInstallments);
    }

    private static List<BigDecimal> splitEvenly(BigDecimal total, int count) {
        BigDecimal base = total.divide(BigDecimal.valueOf(count), 2, RoundingMode.DOWN);
        List<BigDecimal> amounts = new ArrayList<>(count);
        BigDecimal allocated = BigDecimal.ZERO.setScale(2, RoundingMode.HALF_UP);

        for (int i = 1; i <= count; i++) {
            BigDecimal amount = i == count ? total.subtract(allocated).setScale(2, RoundingMode.HALF_UP) : base;
            amounts.add(amount);
            allocated = allocated.add(amount);
        }

        return amounts;
    }

    public static BigDecimal getInterestRate(Integer numberOfInstallments) {
        validateInstallmentDuration(numberOfInstallments);
        return switch (numberOfInstallments) {
            case 3 -> BigDecimal.ZERO;
            case 6 -> BigDecimal.valueOf(0.03);
            case 9 -> BigDecimal.valueOf(0.06);
            case 12 -> BigDecimal.valueOf(0.12);
            default -> throw new IllegalArgumentException(ALLOWED_INSTALLMENT_MESSAGE);
        };
    }

    public static BigDecimal requiredDownPayment(BigDecimal totalAmount) {
        return totalAmount.multiply(DOWN_PAYMENT_RATIO).setScale(2, RoundingMode.HALF_UP);
    }

    public static LocalDate calculateFirstDueDate(Integer salaryDay) {
        return calculateFirstDueDate(salaryDay, LocalDate.now());
    }

    public static LocalDate calculateFirstDueDate(Integer salaryDay, LocalDate now) {
        int normalizedSalaryDay = salaryDay == null ? 25 : Math.max(1, Math.min(31, salaryDay));
        int dueDay = Math.min(normalizedSalaryDay + 2, now.lengthOfMonth());
        LocalDate dueThisMonth = now.withDayOfMonth(dueDay);

        if (dueThisMonth.isAfter(now)) {
            return dueThisMonth;
        }

        LocalDate nextMonth = now.plusMonths(1);
        int nextMonthDueDay = Math.min(normalizedSalaryDay + 2, nextMonth.lengthOfMonth());
        return nextMonth.withDayOfMonth(nextMonthDueDay);
    }
}
