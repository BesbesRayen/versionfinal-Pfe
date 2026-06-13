package com.creaditn.creaditnbackend.service;

import com.creaditn.creaditnbackend.entity.CreditRequest;
import com.creaditn.creaditnbackend.entity.Installment;
import com.creaditn.creaditnbackend.entity.InstallmentStatus;
import com.creaditn.creaditnbackend.exception.BadRequestException;
import com.creaditn.creaditnbackend.repository.InstallmentRepository;
import org.junit.jupiter.api.Test;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.time.YearMonth;
import java.util.List;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;
import static org.mockito.Mockito.mock;
import static org.mockito.Mockito.when;

class MonthlyCreditCapacityServiceTest {

    private final InstallmentRepository installmentRepository = mock(InstallmentRepository.class);
    private final CreadiScoreService creadiScoreService = mock(CreadiScoreService.class);
    private final MonthlyCreditCapacityService service =
            new MonthlyCreditCapacityService(installmentRepository, creadiScoreService);

    private void monthlyLimit(Long userId, String amount) {
        double limit = new BigDecimal(amount).doubleValue();
        when(creadiScoreService.computeBuyingPowerForUser(userId))
                .thenReturn(new CreadiScoreService.BuyingPowerSnapshot(
                        limit,
                        0,
                        limit,
                        0,
                        limit,
                        0,
                        BigDecimal.ZERO,
                        null
                ));
    }

    @Test
    void capacityRenewsSeparatelyForEachMonth() {
        YearMonth firstMonth = YearMonth.now().plusMonths(1);
        monthlyLimit(1L, "2000.00");
        when(installmentRepository.findByCreditRequestUserId(1L)).thenReturn(List.of(
                installment(firstMonth, "1500.00", InstallmentStatus.PENDING),
                installment(firstMonth.plusMonths(1), "2000.00", InstallmentStatus.PENDING),
                installment(firstMonth.plusMonths(2), "1000.00", InstallmentStatus.PENDING)
        ));

        assertThat(service.getSnapshot(1L, firstMonth).available()).isEqualByComparingTo("500.00");
        assertThat(service.getSnapshot(1L, firstMonth.plusMonths(1)).available()).isEqualByComparingTo("0.00");
        assertThat(service.getSnapshot(1L, firstMonth.plusMonths(2)).available()).isEqualByComparingTo("1000.00");
    }

    @Test
    void paidInstallmentsReleaseCapacityAfterTheMonthIsSettled() {
        YearMonth target = YearMonth.now().plusMonths(1);
        monthlyLimit(2L, "2000.00");
        when(installmentRepository.findByCreditRequestUserId(2L)).thenReturn(List.of(
                installment(target, "600.00", InstallmentStatus.PAID)
        ));

        assertThat(service.getSnapshot(2L, target).available()).isEqualByComparingTo("2000.00");
    }

    @Test
    void payingAnInstallmentRestoresItsAmountToMonthlyCapacity() {
        YearMonth target = YearMonth.now();
        monthlyLimit(6L, "2000.00");
        Installment installment = installment(
                target,
                "407.73",
                InstallmentStatus.PENDING,
                LocalDate.now().plusDays(1)
        );
        when(installmentRepository.findByCreditRequestUserId(6L)).thenReturn(List.of(installment));

        assertThat(service.getSnapshot(6L, target).available()).isEqualByComparingTo("1592.27");

        installment.setStatus(InstallmentStatus.PAID);

        assertThat(service.getSnapshot(6L, target).available()).isEqualByComparingTo("2000.00");
    }

    @Test
    void monthlyCreditResetsAndSubtractsOnlyTheUnpaidTrancheOfThatMonth() {
        YearMonth currentMonth = YearMonth.now();
        YearMonth nextMonth = currentMonth.plusMonths(1);
        monthlyLimit(11L, "1000.00");
        Installment currentTranche = installment(
                currentMonth,
                "100.00",
                InstallmentStatus.PENDING,
                LocalDate.now().plusDays(1)
        );
        Installment nextTranche = installment(
                nextMonth,
                "100.00",
                InstallmentStatus.PENDING,
                nextMonth.atDay(10)
        );
        when(installmentRepository.findByCreditRequestUserId(11L))
                .thenReturn(List.of(currentTranche, nextTranche));

        assertThat(service.getSnapshot(11L, currentMonth).available())
                .isEqualByComparingTo("900.00");

        currentTranche.setStatus(InstallmentStatus.PAID);

        assertThat(service.getSnapshot(11L, currentMonth).available())
                .isEqualByComparingTo("1000.00");
        assertThat(service.getSnapshot(11L, nextMonth).available())
                .isEqualByComparingTo("900.00");
    }

    @Test
    void deviceDateSelectsAugustAndDueDateBecomesLateOnlyTheNextDay() {
        YearMonth august = YearMonth.of(2026, 8);
        LocalDate dueDate = LocalDate.of(2026, 8, 27);
        monthlyLimit(12L, "1000.00");
        Installment tranche = installment(
                august,
                "100.00",
                InstallmentStatus.PENDING,
                dueDate
        );
        when(installmentRepository.findByCreditRequestUserId(12L))
                .thenReturn(List.of(tranche));

        MonthlyCreditCapacityService.MonthlyCapacitySnapshot onDueDate =
                service.getSnapshot(12L, august, dueDate);

        assertThat(onDueDate.month()).isEqualTo(august);
        assertThat(onDueDate.committed()).isEqualByComparingTo("100.00");
        assertThat(onDueDate.available()).isEqualByComparingTo("900.00");
        assertThat(onDueDate.blocked()).isFalse();

        tranche.setStatus(InstallmentStatus.OVERDUE);
        tranche.setPenalty(new BigDecimal("5.00"));
        MonthlyCreditCapacityService.MonthlyCapacitySnapshot nextDay =
                service.getSnapshot(12L, august, dueDate.plusDays(1));

        assertThat(nextDay.committed()).isEqualByComparingTo("105.00");
        assertThat(nextDay.available()).isEqualByComparingTo("895.00");
        assertThat(nextDay.blocked()).isTrue();
    }

    @Test
    void currentMonthInstallmentConsumesCapacityWithoutBlockingCredit() {
        YearMonth currentMonth = YearMonth.now();
        monthlyLimit(3L, "2000.00");
        when(installmentRepository.findByCreditRequestUserId(3L)).thenReturn(List.of(
                installment(currentMonth, "400.00", InstallmentStatus.PENDING, LocalDate.now().plusDays(1))
        ));

        service.validateNewCredit(
                3L,
                List.of(new BigDecimal("100.00")),
                LocalDate.now().plusDays(1)
        );

        assertThat(service.getSnapshot(3L, currentMonth).available()).isEqualByComparingTo("1600.00");
        assertThat(service.getSnapshot(3L, currentMonth).blocked()).isFalse();
    }

    @Test
    void overdueInstallmentBlocksNewCredit() {
        YearMonth currentMonth = YearMonth.now();
        monthlyLimit(5L, "2000.00");
        when(installmentRepository.findByCreditRequestUserId(5L)).thenReturn(List.of(
                installment(currentMonth, "400.00", InstallmentStatus.OVERDUE)
        ));

        assertThatThrownBy(() -> service.validateNewCredit(
                5L,
                List.of(new BigDecimal("100.00")),
                LocalDate.now().plusDays(1)
        )).isInstanceOf(BadRequestException.class)
                .hasMessageContaining("overdue");
    }

    @Test
    void futureInstallmentWithStaleOverdueStatusDoesNotBlockCreditOrConsumePenalty() {
        YearMonth currentMonth = YearMonth.now();
        monthlyLimit(9L, "2428.00");
        Installment installment = installment(
                currentMonth,
                "319.73",
                InstallmentStatus.OVERDUE,
                LocalDate.now().plusDays(10)
        );
        installment.setPenalty(new BigDecimal("15.99"));
        when(installmentRepository.findByCreditRequestUserId(9L)).thenReturn(List.of(installment));

        service.validateNewCredit(
                9L,
                List.of(new BigDecimal("100.00")),
                LocalDate.now().plusDays(1)
        );

        MonthlyCreditCapacityService.MonthlyCapacitySnapshot snapshot =
                service.getSnapshot(9L, currentMonth);

        assertThat(snapshot.committed()).isEqualByComparingTo("319.73");
        assertThat(snapshot.available()).isEqualByComparingTo("2108.27");
        assertThat(snapshot.blocked()).isFalse();
    }

    @Test
    void overdueInstallmentsDoNotHideTheCalculatedMonthlyBalance() {
        YearMonth currentMonth = YearMonth.now();
        monthlyLimit(8L, "2428.00");
        when(installmentRepository.findByCreditRequestUserId(8L)).thenReturn(List.of(
                installment(currentMonth, "335.72", InstallmentStatus.OVERDUE),
                installment(currentMonth, "335.72", InstallmentStatus.OVERDUE)
        ));

        MonthlyCreditCapacityService.MonthlyCapacitySnapshot snapshot =
                service.getSnapshot(8L, currentMonth);

        assertThat(snapshot.committed()).isEqualByComparingTo("671.44");
        assertThat(snapshot.available()).isEqualByComparingTo("1756.56");
        assertThat(snapshot.blocked()).isTrue();
    }

    @Test
    void proposedInstallmentMustFitEveryTargetMonth() {
        YearMonth target = YearMonth.now().plusMonths(1);
        monthlyLimit(4L, "2000.00");
        when(installmentRepository.findByCreditRequestUserId(4L)).thenReturn(List.of(
                installment(target, "1500.00", InstallmentStatus.PENDING)
        ));

        assertThatThrownBy(() -> service.validateNewCredit(
                4L,
                List.of(new BigDecimal("500.01")),
                target.atDay(10)
        )).isInstanceOf(BadRequestException.class)
                .hasMessageContaining("Available: 500.00");
    }

    @Test
    void monthlyLimitUsesTheUsersCalculatedBuyingPower() {
        YearMonth target = YearMonth.now();
        monthlyLimit(7L, "2468.00");
        when(installmentRepository.findByCreditRequestUserId(7L)).thenReturn(List.of(
                installment(target, "407.73", InstallmentStatus.PENDING, LocalDate.now().plusDays(1))
        ));

        MonthlyCreditCapacityService.MonthlyCapacitySnapshot snapshot =
                service.getSnapshot(7L, target);

        assertThat(snapshot.limit()).isEqualByComparingTo("2468.00");
        assertThat(snapshot.available()).isEqualByComparingTo("2060.27");
    }

    private Installment installment(YearMonth month, String amount, InstallmentStatus status) {
        return installment(month, amount, status, month.atDay(10));
    }

    private Installment installment(
            YearMonth month,
            String amount,
            InstallmentStatus status,
            LocalDate dueDate
    ) {
        return Installment.builder()
                .creditRequest(CreditRequest.builder().id(10L).build())
                .dueDate(dueDate)
                .amount(new BigDecimal(amount))
                .penalty(BigDecimal.ZERO)
                .status(status)
                .build();
    }
}
