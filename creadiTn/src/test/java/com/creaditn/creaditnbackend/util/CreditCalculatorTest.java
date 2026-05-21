package com.creaditn.creaditnbackend.util;

import org.junit.jupiter.api.Test;

import java.math.BigDecimal;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;

class CreditCalculatorTest {

    @Test
    void rejectsUnsupportedInstallmentDuration() {
        assertThat(CreditCalculator.isAllowedInstallmentDuration(5)).isFalse();
        assertThatThrownBy(() -> CreditCalculator.getInterestRate(5))
                .isInstanceOf(IllegalArgumentException.class)
                .hasMessage(CreditCalculator.ALLOWED_INSTALLMENT_MESSAGE);
    }

    @Test
    void repaymentScheduleUsesTwoDecimalsAndCorrectsLastInstallment() {
        var schedule = CreditCalculator.calculateRepaymentSchedule(
                BigDecimal.valueOf(1000),
                BigDecimal.valueOf(200),
                6
        );

        assertThat(schedule).containsExactly(
                new BigDecimal("137.33"),
                new BigDecimal("137.33"),
                new BigDecimal("137.33"),
                new BigDecimal("137.33"),
                new BigDecimal("137.33"),
                new BigDecimal("137.35")
        );
        assertThat(schedule.stream().reduce(BigDecimal.ZERO, BigDecimal::add))
                .isEqualByComparingTo("824.00");
    }

    @Test
    void threeMonthPlanHasNoInterestAndRepaysOnlyPrincipal() {
        var schedule = CreditCalculator.calculateRepaymentSchedule(
                BigDecimal.valueOf(199),
                BigDecimal.valueOf(39.80),
                3
        );

        assertThat(CreditCalculator.getInterestRate(3)).isEqualByComparingTo("0");
        assertThat(CreditCalculator.calculateInterestAmount(BigDecimal.valueOf(199), BigDecimal.valueOf(39.80), 3))
                .isEqualByComparingTo("0.00");
        assertThat(CreditCalculator.calculateTotalRepayable(BigDecimal.valueOf(199), BigDecimal.valueOf(39.80), 3))
                .isEqualByComparingTo("159.20");
        assertThat(schedule).containsExactly(
                new BigDecimal("53.06"),
                new BigDecimal("53.06"),
                new BigDecimal("53.08")
        );
    }

    @Test
    void principalScheduleAlsoCorrectsLastInstallment() {
        var schedule = CreditCalculator.calculatePrincipalSchedule(
                BigDecimal.valueOf(1000),
                BigDecimal.valueOf(200),
                6
        );

        assertThat(schedule.stream().reduce(BigDecimal.ZERO, BigDecimal::add))
                .isEqualByComparingTo("800.00");
        assertThat(schedule.get(5)).isEqualByComparingTo("133.35");
    }
}
