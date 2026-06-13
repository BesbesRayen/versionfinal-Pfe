package com.creaditn.creaditnbackend.service;

import com.creaditn.creaditnbackend.entity.Installment;
import com.creaditn.creaditnbackend.entity.InstallmentStatus;
import com.creaditn.creaditnbackend.exception.BadRequestException;
import com.creaditn.creaditnbackend.repository.InstallmentRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;

import java.math.BigDecimal;
import java.math.RoundingMode;
import java.time.LocalDate;
import java.time.YearMonth;
import java.util.List;

@Service
@RequiredArgsConstructor
public class MonthlyCreditCapacityService {

    private final InstallmentRepository installmentRepository;
    private final CreadiScoreService creadiScoreService;

    public MonthlyCapacitySnapshot getSnapshot(Long userId, YearMonth targetMonth) {
        return getSnapshot(userId, targetMonth, LocalDate.now());
    }

    public MonthlyCapacitySnapshot getSnapshot(
            Long userId,
            YearMonth targetMonth,
            LocalDate asOfDate
    ) {
        List<Installment> installments = installmentRepository.findByCreditRequestUserId(userId);
        BigDecimal monthlyLimit = resolveMonthlyLimit(userId);
        LocalDate calculationDate = asOfDate == null ? LocalDate.now() : asOfDate;
        BigDecimal committed = committedForMonth(installments, targetMonth, calculationDate);
        boolean blocked = hasBlockingInstallment(installments, calculationDate);
        BigDecimal available = monthlyLimit.subtract(committed).max(BigDecimal.ZERO);

        return new MonthlyCapacitySnapshot(
                targetMonth,
                monthlyLimit,
                committed,
                available,
                blocked,
                blocked ? "Pay all overdue installments before requesting new credit." : null
        );
    }

    public void validateNewCredit(Long userId, List<BigDecimal> proposedAmounts, LocalDate firstDueDate) {
        List<Installment> installments = installmentRepository.findByCreditRequestUserId(userId);
        BigDecimal monthlyLimit = resolveMonthlyLimit(userId);
        if (hasBlockingInstallment(installments, LocalDate.now())) {
            throw new BadRequestException(
                    "Pay all overdue installments before requesting new credit"
            );
        }

        for (int index = 0; index < proposedAmounts.size(); index++) {
            YearMonth targetMonth = YearMonth.from(firstDueDate.plusMonths(index));
            BigDecimal committed = committedForMonth(installments, targetMonth, LocalDate.now());
            BigDecimal available = monthlyLimit.subtract(committed).max(BigDecimal.ZERO);
            BigDecimal proposed = proposedAmounts.get(index);

            if (proposed.compareTo(available) > 0) {
                throw new BadRequestException(
                        "Monthly installment exceeds the available capacity for "
                                + targetMonth + ". Available: " + available + " TND"
                );
            }
        }
    }

    public boolean isMonthSettled(Long userId, YearMonth month) {
        return installmentRepository.findByCreditRequestUserId(userId).stream()
                .filter(this::isUnpaid)
                .noneMatch(installment -> YearMonth.from(installment.getDueDate()).equals(month));
    }

    private boolean hasBlockingInstallment(List<Installment> installments, LocalDate calculationDate) {
        return installments.stream()
                .filter(this::isUnpaid)
                .anyMatch(installment -> installment.getDueDate().isBefore(calculationDate));
    }

    private BigDecimal committedForMonth(
            List<Installment> installments,
            YearMonth month,
            LocalDate calculationDate
    ) {
        return installments.stream()
                .filter(this::isUnpaid)
                .filter(installment -> YearMonth.from(installment.getDueDate()).equals(month))
                .map(installment -> amountDue(installment, calculationDate))
                .reduce(BigDecimal.ZERO, BigDecimal::add)
                .setScale(2, RoundingMode.HALF_UP);
    }

    private boolean isUnpaid(Installment installment) {
        return installment.getStatus() == InstallmentStatus.PENDING
                || installment.getStatus() == InstallmentStatus.OVERDUE;
    }

    private BigDecimal amountDue(Installment installment, LocalDate calculationDate) {
        boolean genuinelyOverdue = installment.getDueDate().isBefore(calculationDate);
        BigDecimal penalty = genuinelyOverdue && installment.getPenalty() != null
                ? installment.getPenalty()
                : BigDecimal.ZERO;
        return installment.getAmount().add(penalty);
    }

    private BigDecimal resolveMonthlyLimit(Long userId) {
        return BigDecimal.valueOf(
                        creadiScoreService.computeBuyingPowerForUser(userId).buyingPowerLimit()
                )
                .setScale(2, RoundingMode.HALF_UP)
                .max(BigDecimal.ZERO);
    }

    public record MonthlyCapacitySnapshot(
            YearMonth month,
            BigDecimal limit,
            BigDecimal committed,
            BigDecimal available,
            boolean blocked,
            String blockReason
    ) {
    }
}
