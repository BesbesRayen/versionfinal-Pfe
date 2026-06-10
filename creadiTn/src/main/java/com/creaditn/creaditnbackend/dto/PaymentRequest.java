package com.creaditn.creaditnbackend.dto;

import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Positive;
import lombok.*;
import java.math.BigDecimal;

@Getter @Setter
@NoArgsConstructor @AllArgsConstructor
public class PaymentRequest {

    public PaymentRequest(Long installmentId, BigDecimal amount, String paymentMethod) {
        this.installmentId = installmentId;
        this.amount = amount;
        this.paymentMethod = paymentMethod;
    }

    @NotNull
    private Long installmentId;

    @NotNull @Positive
    private BigDecimal amount;

    private String paymentMethod;

    private String password;
}
