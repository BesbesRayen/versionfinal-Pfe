package com.creaditn.creaditnbackend.dto;

import lombok.Builder;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.util.List;

@Builder
public record WalletRechargeResult(
        Long userId,
        LocalDate processedThrough,
        int creditedCycles,
        BigDecimal creditedAmount,
        BigDecimal balance,
        List<String> billingCycles
) {
}
