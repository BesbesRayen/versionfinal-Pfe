package com.creaditn.creaditnbackend.dto;

import lombok.*;
import java.math.BigDecimal;
import java.util.List;

@Getter @Setter
@NoArgsConstructor @AllArgsConstructor
@Builder
public class CreditSimulationResponse {
    private BigDecimal totalAmount;
    private BigDecimal downPayment;
    private BigDecimal remainingAmount;
    private BigDecimal interestAmount;
    private BigDecimal interestRate;
    private BigDecimal totalRepayable;
    private Integer numberOfInstallments;
    private BigDecimal monthlyAmount;
    private List<InstallmentPlanItemDto> schedule;
}
