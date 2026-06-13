package com.creaditn.creaditnbackend.dto;

import lombok.*;

import java.math.BigDecimal;
import java.time.LocalDate;

@Getter @Setter
@NoArgsConstructor @AllArgsConstructor
@Builder
public class CreditBalanceResponse {
    private double buyingPowerLimit;
    private double baseBuyingPower;
    private double paymentTrustBonus;
    private double outstandingBalance;
    private double usedPercent;
    private BigDecimal nextInstallmentAmount;
    private LocalDate nextInstallmentDate;
    private String monthlyCapacityMonth;
    private BigDecimal monthlyCapacityLimit;
    private BigDecimal monthlyCommittedAmount;
    private BigDecimal availableMonthlyCapacity;
    private boolean monthlyCapacityBlocked;
    private String monthlyCapacityBlockReason;
    private double availablePrincipalCredit;

    // Legacy aliases kept for existing clients.
    private double totalLimit;
    private double usedCredit;
    private double availableCredit;
}
