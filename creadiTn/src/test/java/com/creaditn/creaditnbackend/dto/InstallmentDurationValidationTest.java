package com.creaditn.creaditnbackend.dto;

import jakarta.validation.Validation;
import jakarta.validation.Validator;
import org.junit.jupiter.api.Test;

import java.math.BigDecimal;

import static org.assertj.core.api.Assertions.assertThat;

class InstallmentDurationValidationTest {

    private final Validator validator = Validation.buildDefaultValidatorFactory().getValidator();

    @Test
    void creditSimulationRequestAllowsOnlyConfiguredDurations() {
        CreditSimulationRequest request = new CreditSimulationRequest(
                BigDecimal.valueOf(500),
                BigDecimal.valueOf(100),
                5
        );

        assertThat(validator.validate(request))
                .anyMatch(error -> error.getPropertyPath().toString().equals("numberOfInstallments"));
    }

    @Test
    void creditRequestAllowsOnlyConfiguredDurations() {
        CreditRequestDto request = CreditRequestDto.builder()
                .totalAmount(BigDecimal.valueOf(500))
                .downPayment(BigDecimal.valueOf(100))
                .numberOfInstallments(10)
                .build();

        assertThat(validator.validate(request))
                .anyMatch(error -> error.getPropertyPath().toString().equals("numberOfInstallments"));
    }

    @Test
    void purchaseRequestAllowsOnlyConfiguredDurations() {
        PurchaseArticleRequest request = PurchaseArticleRequest.builder()
                .articleId(1L)
                .paymentType(com.creaditn.creaditnbackend.entity.PurchasePaymentType.CREDIT)
                .installmentMonths(4)
                .build();

        assertThat(validator.validate(request))
                .anyMatch(error -> error.getPropertyPath().toString().equals("installmentMonths"));
    }

    @Test
    void purchaseRequestAcceptsAllowedDuration() {
        PurchaseArticleRequest request = PurchaseArticleRequest.builder()
                .articleId(1L)
                .paymentType(com.creaditn.creaditnbackend.entity.PurchasePaymentType.CREDIT)
                .installmentMonths(12)
                .build();

        assertThat(validator.validate(request)).isEmpty();
    }
}
