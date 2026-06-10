package com.creaditn.creaditnbackend.dto;

import lombok.*;

import java.math.BigDecimal;
import java.time.LocalDate;

@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class DashboardResponse {
    private double totalLimit;
    private double usedCredit;
    private double availableCredit;
    private double buyingPowerLimit;
    private double baseBuyingPower;
    private double paymentTrustBonus;
    private double outstandingBalance;
    private double usedPercent;
    private BigDecimal nextInstallmentAmount;
    private LocalDate nextInstallmentDate;
    private Integer activeLoans;
    private BigDecimal nextPaymentAmount;
    private String nextPaymentDate;
    private Integer creditScore;

    private String kycStatus;
    private String cardStatus;
    private String profileStatus;
    private String nextStep;
}
