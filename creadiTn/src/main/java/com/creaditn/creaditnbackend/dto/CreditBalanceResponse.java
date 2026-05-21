package com.creaditn.creaditnbackend.dto;

import lombok.*;

@Getter @Setter
@NoArgsConstructor @AllArgsConstructor
@Builder
public class CreditBalanceResponse {
    private double totalLimit;
    private double usedCredit;
    private double availableCredit;
}
