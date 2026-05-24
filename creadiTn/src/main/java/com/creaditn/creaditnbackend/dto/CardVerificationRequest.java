package com.creaditn.creaditnbackend.dto;

import jakarta.validation.constraints.AssertTrue;
import lombok.*;
import lombok.experimental.SuperBuilder;

@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@SuperBuilder
public class CardVerificationRequest {
    private String password;
    private Boolean biometricVerified;

    @AssertTrue(message = "Password or biometric verification is required")
    public boolean hasVerification() {
        return (password != null && !password.isBlank()) || Boolean.TRUE.equals(biometricVerified);
    }
}
