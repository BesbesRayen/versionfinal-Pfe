package com.creaditn.creaditnbackend.dto;

import lombok.*;

@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class CreditPlanResponse {
    private Integer months;
    private String label;
    private Double feePercent;
    private String feeLabel;
    private String description;
    private Boolean recommended;
}
