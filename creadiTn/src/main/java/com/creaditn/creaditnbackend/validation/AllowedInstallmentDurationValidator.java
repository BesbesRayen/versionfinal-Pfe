package com.creaditn.creaditnbackend.validation;

import com.creaditn.creaditnbackend.util.CreditCalculator;
import jakarta.validation.ConstraintValidator;
import jakarta.validation.ConstraintValidatorContext;

public class AllowedInstallmentDurationValidator implements ConstraintValidator<AllowedInstallmentDuration, Integer> {
    @Override
    public boolean isValid(Integer value, ConstraintValidatorContext context) {
        return value == null || CreditCalculator.isAllowedInstallmentDuration(value);
    }
}
