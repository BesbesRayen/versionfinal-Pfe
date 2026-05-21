package com.creaditn.creaditnbackend.dto;

import com.creaditn.creaditnbackend.entity.PurchasePaymentType;
import com.creaditn.creaditnbackend.validation.AllowedInstallmentDuration;
import jakarta.validation.constraints.DecimalMin;
import jakarta.validation.constraints.Digits;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Size;
import lombok.*;

import java.math.BigDecimal;

@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class PurchaseArticleRequest {

    @NotNull
    private Long articleId;

    @NotNull
    private PurchasePaymentType paymentType;

    @AllowedInstallmentDuration
    private Integer installmentMonths;

    @Size(max = 160)
    private String productName;

    @Size(max = 2000)
    private String description;

    @DecimalMin(value = "0.01")
    @Digits(integer = 10, fraction = 2)
    private BigDecimal price;

    @Size(max = 600)
    private String imageUrl;

    @Size(max = 160)
    private String boutiqueName;

    @Size(max = 100)
    private String category;
}
