package com.creaditn.creaditnbackend.validation;

import com.creaditn.creaditnbackend.util.CreditCalculator;
import jakarta.validation.Constraint;
import jakarta.validation.Payload;

import java.lang.annotation.Documented;
import java.lang.annotation.ElementType;
import java.lang.annotation.Retention;
import java.lang.annotation.RetentionPolicy;
import java.lang.annotation.Target;

@Documented
@Constraint(validatedBy = AllowedInstallmentDurationValidator.class)
@Target({ElementType.FIELD, ElementType.PARAMETER})
@Retention(RetentionPolicy.RUNTIME)
public @interface AllowedInstallmentDuration {
    String message() default CreditCalculator.ALLOWED_INSTALLMENT_MESSAGE;
    Class<?>[] groups() default {};
    Class<? extends Payload>[] payload() default {};
}
